"use client";

import { db } from "@/utils/indexedDB";
import {
  LEGACY_SESSION_STORAGE_KEY,
  migrateLocalStorageKey,
  SESSION_STORAGE_KEY,
} from "@/lib/storage-keys";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface SessionExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
  showWorkoutTarget?: boolean;
  actualSets: {
    setNumber: number;
    reps: number | null;
    weight: number | null;
    completed: boolean;
  }[];
}

interface ActiveSession {
  id: string;
  workoutId: string;
  workoutName: string;
  startTime: string;
  progress?: {
    exercises: SessionExercise[];
  };
}

interface SessionContextProps {
  activeSession: ActiveSession | null;
  isHydrated: boolean;
  startSession: (workout: {
    user_id: string;
    workout_id: string;
    workout_name: string;
    started_at: string;
    progress?: {
      exercises: SessionExercise[];
    };
  }) => void;
  updateSessionProgress: (exercises: SessionExercise[]) => void;
  endSession: () => Promise<void>;
  getElapsedMinutes: () => number;
  formatSessionDate: (dateString: string) => string;
}

const SESSION_CHANNEL = "embur-active-session";

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

export { SESSION_STORAGE_KEY } from "@/lib/storage-keys";

function isValidSessionShape(session: unknown): session is ActiveSession {
  if (!session || typeof session !== "object") return false;
  const value = session as ActiveSession;
  return Boolean(value.workoutId && value.workoutName && value.startTime);
}

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [isEnding, setIsEnding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Bumps on end/start so stale debounced IDB writes from this or other paths are dropped
  const sessionEpochRef = useRef(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const cancelPendingSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  };

  const bumpEpoch = () => {
    sessionEpochRef.current += 1;
    return sessionEpochRef.current;
  };

  // Load session from IndexedDB first, then localStorage as fallback
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadSession = async () => {
      migrateLocalStorageKey(SESSION_STORAGE_KEY, LEGACY_SESSION_STORAGE_KEY);

      try {
        // Try IndexedDB first (most reliable for PWAs)
        const idbSession = await db.getActiveSession();

        if (idbSession) {
          const session: ActiveSession = {
            id: idbSession.id,
            workoutId: idbSession.workoutId,
            workoutName: idbSession.workoutName,
            startTime: validateStartTime(idbSession.startTime),
            progress: {
              exercises: idbSession.exercises,
            },
          };
          setActiveSession(session);

          // Update localStorage cache
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          setIsHydrated(true);
          return;
        }

        // Fallback to localStorage
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          console.log(
            "⚠️ Loaded session from localStorage (IndexedDB was empty)"
          );
          const parsedSession = JSON.parse(savedSession);
          if (isValidSessionShape(parsedSession)) {
            const validDate = validateStartTime(parsedSession.startTime);
            const session = {
              ...parsedSession,
              startTime: validDate,
            };
            setActiveSession(session);

            // Sync to IndexedDB for future reliability
            if (session.progress?.exercises) {
              await db.saveActiveSession({
                id: "active",
                workoutId: session.workoutId,
                workoutName: session.workoutName,
                startTime: session.startTime,
                lastUpdated: new Date().toISOString(),
                exercises: session.progress.exercises,
              });
            }
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error("❌ Error loading session:", e);
        // Clear potentially corrupted data
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        setIsHydrated(true);
      }
    };

    loadSession();
  }, []);

  // Cross-tab sync: storage events + BroadcastChannel for end/clear
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = () => {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          if (isValidSessionShape(parsedSession)) {
            parsedSession.startTime = validateStartTime(
              parsedSession.startTime
            );
            setActiveSession(parsedSession);
          } else {
            cancelPendingSave();
            bumpEpoch();
            setActiveSession(null);
          }
        } catch (e) {
          console.error("Error parsing saved session:", e);
          cancelPendingSave();
          bumpEpoch();
          setActiveSession(null);
        }
      } else {
        // Another tab cleared the session — drop pending IDB writes
        cancelPendingSave();
        bumpEpoch();
        setActiveSession(null);
      }
    };

    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SESSION_CHANNEL);
      channelRef.current = channel;
      channel.onmessage = (event) => {
        if (event.data?.type === "session-ended") {
          cancelPendingSave();
          bumpEpoch();
          setActiveSession(null);
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      };
    } catch {
      // BroadcastChannel unsupported — storage events still cover most cases
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      channel?.close();
      channelRef.current = null;
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      cancelPendingSave();
    };
  }, []);

  // CRITICAL: Save immediately when app goes to background (PWA suspend)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = async () => {
      if (document.hidden && activeSession) {
        cancelPendingSave();

        const epoch = sessionEpochRef.current;
        if (activeSession.progress?.exercises) {
          // Only write if session was not ended meanwhile
          if (
            epoch === sessionEpochRef.current &&
            localStorage.getItem(SESSION_STORAGE_KEY)
          ) {
            await db.saveActiveSession({
              id: "active",
              workoutId: activeSession.workoutId,
              workoutName: activeSession.workoutName,
              startTime: activeSession.startTime,
              lastUpdated: new Date().toISOString(),
              exercises: activeSession.progress.exercises,
            });
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleBeforeUnload = () => {
      // Sync path only — avoid racing a cleared session after end
      if (
        activeSession?.progress?.exercises &&
        localStorage.getItem(SESSION_STORAGE_KEY)
      ) {
        void db.saveActiveSession({
          id: "active",
          workoutId: activeSession.workoutId,
          workoutName: activeSession.workoutName,
          startTime: activeSession.startTime,
          lastUpdated: new Date().toISOString(),
          exercises: activeSession.progress.exercises,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeSession]);

  // Keep valid timestamps; only replace unparseable or future values.
  // Do not silently rewrite long-running / overnight sessions.
  const validateStartTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);

      if (isNaN(date.getTime())) {
        console.warn("Invalid date format detected, using current time");
        return new Date().toISOString();
      }

      const startTime = date.getTime();
      const currentTime = Date.now();

      if (startTime > currentTime + 60_000) {
        console.warn("Future session timestamp detected, using current time");
        return new Date().toISOString();
      }

      return date.toISOString();
    } catch (e) {
      console.error("Error validating timestamp:", e);
      return new Date().toISOString();
    }
  };

  const startSession = (session: {
    user_id: string;
    workout_id: string;
    workout_name: string;
    started_at: string;
    progress?: {
      exercises: SessionExercise[];
    };
  }) => {
    if (
      isEnding ||
      (endTimeRef.current && Date.now() - endTimeRef.current < 5000)
    ) {
      return;
    }

    const validatedTimestamp = validateStartTime(session.started_at);
    bumpEpoch();

    const newSession: ActiveSession = {
      id: session.user_id,
      workoutId: session.workout_id,
      workoutName: session.workout_name,
      startTime: validatedTimestamp,
      progress: {
        exercises: session.progress?.exercises ?? [],
      },
    };

    setActiveSession(newSession);
    persistSession(newSession);
  };

  const persistSession = async (session: ActiveSession) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

      cancelPendingSave();

      const epochAtSchedule = sessionEpochRef.current;
      saveTimeoutRef.current = setTimeout(async () => {
        // Drop writes if session ended (this tab or another via epoch/storage)
        if (epochAtSchedule !== sessionEpochRef.current) return;
        if (!localStorage.getItem(SESSION_STORAGE_KEY)) return;

        if (session.progress?.exercises) {
          await db.saveActiveSession({
            id: "active",
            workoutId: session.workoutId,
            workoutName: session.workoutName,
            startTime: session.startTime,
            lastUpdated: new Date().toISOString(),
            exercises: session.progress.exercises,
          });
        }
      }, 500);
    } catch (error) {
      console.error("Failed to persist session:", error);
    }
  };

  const updateSessionProgress = (exercises: SessionExercise[]) => {
    if (!activeSession) return;

    const updatedSession = {
      ...activeSession,
      progress: {
        ...activeSession.progress,
        exercises: exercises,
      },
    };

    setActiveSession(updatedSession);
    persistSession(updatedSession);
  };

  const getElapsedMinutes = (): number => {
    if (!activeSession) return 0;

    const startTime = new Date(activeSession.startTime).getTime();
    const currentTime = Date.now();

    return Math.round(((currentTime - startTime) / (1000 * 60)) * 10) / 10;
  };

  const endSession = async () => {
    setIsEnding(true);
    endTimeRef.current = Date.now();
    bumpEpoch();
    cancelPendingSave();
    setActiveSession(null);

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        await db.clearActiveSession();
        try {
          channelRef.current?.postMessage({ type: "session-ended" });
        } catch {
          // ignore BroadcastChannel post failures
        }
        console.log("🧹 Session cleared from both storages");
      } catch (error) {
        console.error("Error during session cleanup:", error);
      } finally {
        setTimeout(() => {
          setIsEnding(false);
        }, 5000);
      }
    } else {
      setIsEnding(false);
    }
  };

  const formatSessionDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown time";
      }

      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Unknown time";
    }
  };

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        isHydrated,
        startSession,
        updateSessionProgress,
        endSession,
        getElapsedMinutes,
        formatSessionDate,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
