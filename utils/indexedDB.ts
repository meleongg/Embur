import { openDB } from "idb";

const DB_NAME = "FitFlash-offline";
const DB_VERSION = 2;

export interface ActiveSessionState {
  id: string; // user_id
  workoutId: string;
  workoutName: string;
  startTime: string;
  lastUpdated: string;
  exercises: Array<{
    id: string;
    name: string;
    targetSets: number;
    targetReps: number;
    targetWeight: number;
    actualSets: {
      setNumber: number;
      reps: number | null;
      weight: number | null;
      completed: boolean;
    }[];
  }>;
}

export const db = {
  async init() {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store for active session state (in-progress workouts)
        if (!db.objectStoreNames.contains("activeSession")) {
          db.createObjectStore("activeSession", { keyPath: "id" });
        }
      },
    });
  },

  async saveActiveSession(session: ActiveSessionState) {
    try {
      const database = await this.init();
      await database.put("activeSession", {
        ...session,
        lastUpdated: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Failed to save active session to IndexedDB:", error);
      return false;
    }
  },

  async getActiveSession(): Promise<ActiveSessionState | null> {
    try {
      const database = await this.init();
      const session = await database.get("activeSession", "active");
      return session || null;
    } catch (error) {
      console.error("Failed to retrieve active session from IndexedDB:", error);
      return null;
    }
  },

  async clearActiveSession() {
    try {
      const database = await this.init();
      await database.delete("activeSession", "active");
      return true;
    } catch (error) {
      console.error("Failed to clear active session from IndexedDB:", error);
      return false;
    }
  },
};
