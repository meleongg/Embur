"use client";

import {
  applyThemeToDocument,
  readStoredTheme,
  type Theme,
} from "@/lib/theme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isReady: boolean;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setThemeState(stored);
      applyThemeToDocument(stored);
    }
    setIsReady(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeToDocument(next);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, isReady }),
    [theme, setTheme, isReady]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
