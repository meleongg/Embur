export const SESSION_STORAGE_KEY = "embur-active-session";
export const LEGACY_SESSION_STORAGE_KEY = "FitFlash-active-session";

export const SIDEBAR_STORAGE_KEY = "embur-sidebar-collapsed";
export const LEGACY_SIDEBAR_STORAGE_KEY = "fitflash-sidebar-collapsed";

export const IDB_NAME = "embur-offline";
export const LEGACY_IDB_NAME = "FitFlash-offline";

export function migrateLocalStorageKey(
  newKey: string,
  legacyKey: string
): void {
  if (typeof window === "undefined") return;

  try {
    if (localStorage.getItem(newKey) !== null) return;
    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      localStorage.setItem(newKey, legacy);
      localStorage.removeItem(legacyKey);
    }
  } catch {
    /* ignore */
  }
}
