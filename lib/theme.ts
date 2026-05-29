export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export function themeFromDarkMode(useDarkMode: boolean): Theme {
  return useDarkMode ? "dark" : "light";
}

export function darkModeFromTheme(theme: Theme): boolean {
  return theme === "dark";
}

export function applyThemeToDocument(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  return null;
}
