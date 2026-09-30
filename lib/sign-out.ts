import { SESSION_STORAGE_KEY } from "@/lib/storage-keys";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { db } from "@/utils/indexedDB";
import type { SupabaseClient } from "@supabase/supabase-js";

const LOCAL_STORAGE_KEYS_TO_CLEAR = [
  SESSION_STORAGE_KEY,
  "rest-timer-duration",
  THEME_STORAGE_KEY,
] as const;

export function clearAppLocalStorage() {
  LOCAL_STORAGE_KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("storage"));
}

export async function signOutUser(
  supabase: SupabaseClient,
  options?: { endSession?: () => void | Promise<void> }
) {
  try {
    await options?.endSession?.();
  } catch (error) {
    console.error("Failed to end active session during sign-out:", error);
    // Still clear IndexedDB so a zombie session cannot survive sign-out
    try {
      await db.clearActiveSession();
    } catch (clearError) {
      console.error("Failed to clear IndexedDB on sign-out:", clearError);
    }
  }

  clearAppLocalStorage();
  // Belt-and-suspenders: clear IDB even if endSession was omitted
  try {
    await db.clearActiveSession();
  } catch (error) {
    console.error("Failed to clear IndexedDB on sign-out:", error);
  }

  await supabase.auth.signOut();
}
