import { SESSION_STORAGE_KEY } from "@/lib/storage-keys";
import { THEME_STORAGE_KEY } from "@/lib/theme";
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
  options?: { endSession?: () => void }
) {
  options?.endSession?.();
  clearAppLocalStorage();
  await supabase.auth.signOut();
}
