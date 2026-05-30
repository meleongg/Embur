import { IDB_NAME, LEGACY_IDB_NAME } from "@/lib/storage-keys";
import { openDB, type IDBPDatabase } from "idb";

const DB_VERSION = 2;

export interface ActiveSessionState {
  id: string;
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

function openSessionDb(name: string) {
  return openDB(name, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("activeSession")) {
        db.createObjectStore("activeSession", { keyPath: "id" });
      }
    },
  });
}

async function migrateLegacyDb(
  database: IDBPDatabase
): Promise<ActiveSessionState | null> {
  try {
    const legacyDb = await openSessionDb(LEGACY_IDB_NAME);
    const session = (await legacyDb.get(
      "activeSession",
      "active"
    )) as ActiveSessionState | undefined;

    if (!session) return null;

    await database.put("activeSession", session);
    await legacyDb.delete("activeSession", "active");
    return session;
  } catch {
    return null;
  }
}

export const db = {
  async init() {
    const database = await openSessionDb(IDB_NAME);
    const existing = (await database.get(
      "activeSession",
      "active"
    )) as ActiveSessionState | undefined;

    if (!existing) {
      await migrateLegacyDb(database);
    }

    return database;
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
      const session = (await database.get(
        "activeSession",
        "active"
      )) as ActiveSessionState | undefined;
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
