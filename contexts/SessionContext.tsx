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
  endSession: () => void;
  getElapsedMinutes: () => number;
  formatSessionDate: (dateString: string) => string;
}

const SessionContext = createContext<SessionContextProps | undefined>(
  undefined
);

export { SESSION_STORAGE_KEY } from "@/lib/storage-keys";

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [isEnding, setIsEnding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          if (
            parsedSession &&
            parsedSession.workoutId &&
            parsedSession.workoutName &&
            parsedSession.startTime
          ) {
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

  // Listen for storage events to handle changes from other tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = () => {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession);
          if (parsedSession && parsedSession.startTime) {
            // Ensure we have a valid date when loading from other tabs
            parsedSession.startTime = validateStartTime(
              parsedSession.startTime
            );
            setActiveSession(parsedSession);
          } else {
            setActiveSession(null);
          }
        } catch (e) {
          console.error("Error parsing saved session:", e);
          setActiveSession(null);
        }
      } else {
        setActiveSession(null);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // CRITICAL: Save immediately when app goes to background (PWA suspend)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = async () => {
      if (document.hidden && activeSession) {
        // App is going to background - save immediately

        // Clear debounce and save immediately
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Force immediate save to IndexedDB
        if (activeSession.progress?.exercises) {
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
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also save on beforeunload (when closing/refreshing)
    const handleBeforeUnload = async () => {
      if (activeSession?.progress?.exercises) {
        // Use sendBeacon for guaranteed delivery even as page closes
        await db.saveActiveSession({
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

  // Enhanced date validation
  const validateStartTime = (timestamp: string): string => {
    try {
      // Check if the timestamp is a valid date string
      const date = new Date(timestamp);

      // If date is Invalid Date, this will be NaN
      if (isNaN(date.getTime())) {
        console.warn("Invalid date format detected, using current time");
        return new Date().toISOString();
      }

      const startTime = date.getTime();
      const currentTime = Date.now();

      // If timestamp is in the future or more than 24 hours in the past, it's invalid
      if (startTime > currentTime || currentTime - startTime > 86400000) {
        console.warn("Invalid session timestamp detected, using current time");
        return new Date().toISOString();
      }

      // Ensure we always return in ISO format
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
    // Add a cooldown check to prevent accidental reactivation
    if (
      isEnding ||
      (endTimeRef.current && Date.now() - endTimeRef.current < 5000)
    ) {
      return; // Don't allow session start during cooldown
    }

    // Validate the timestamp
    const validatedTimestamp = validateStartTime(session.started_at);

    // Create the session object
    const newSession: ActiveSession = {
      id: session.user_id,
      workoutId: session.workout_id,
      workoutName: session.workout_name,
      startTime: validatedTimestamp,
      progress: {
        exercises: session.progress?.exercises ?? [],
      },
    };

    // Update state first
    setActiveSession(newSession);

    // Persist to both storages (IndexedDB is primary, localStorage is cache)
    persistSession(newSession);
  };

  // Debounced save to IndexedDB and localStorage
  const persistSession = async (session: ActiveSession) => {
    try {
      // Save to localStorage immediately (fast cache)
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

      // Debounce IndexedDB saves to avoid excessive writes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (session.progress?.exercises) {
          const success = await db.saveActiveSession({
            id: "active",
            workoutId: session.workoutId,
            workoutName: session.workoutName,
            startTime: session.startTime,
            lastUpdated: new Date().toISOString(),
            exercises: session.progress.exercises,
          });
        }
      }, 500); // 500ms debounce
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
        exercises: exercises, // This preserves the order of exercises
      },
    };

    // Update state first
    setActiveSession(updatedSession);

    // Persist to both storages
    persistSession(updatedSession);
  };

  // Calculate elapsed time in minutes
  const getElapsedMinutes = (): number => {
    if (!activeSession) return 0;

    const startTime = new Date(activeSession.startTime).getTime();
    const currentTime = Date.now();

    // Convert milliseconds to minutes (rounded to 1 decimal place)
    return Math.round(((currentTime - startTime) / (1000 * 60)) * 10) / 10;
  };

  // Update the endSession function to be more thorough
  const endSession = async () => {
    // Set cooldown flag
    setIsEnding(true);
    endTimeRef.current = Date.now();

    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Clear React state
    setActiveSession(null);

    if (typeof window !== "undefined") {
      try {
        // Clear both storages
        localStorage.removeItem(SESSION_STORAGE_KEY);
        await db.clearActiveSession();
        console.log("🧹 Session cleared from both storages");

        // Reset cooldown flag after 5 seconds
        setTimeout(() => {
          setIsEnding(false);
        }, 5000);
      } catch (error) {
        console.error("Error during session cleanup:", error);
      }
    }
  };

  // Add this helper to format dates consistently
  const formatSessionDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown time";
      }

      // Format: "May 13, 2023 at 2:30 PM"
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
