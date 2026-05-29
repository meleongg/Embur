"use client";

import { useTheme } from "@/components/theme-provider";
import { themeFromDarkMode } from "@/lib/theme";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef } from "react";

/**
 * Syncs theme from user_preferences (source of truth when logged in).
 * Runs once per app session on protected routes.
 */
export default function ThemeSync() {
  const { setTheme, isReady } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isReady || hasSynced.current) return;

    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("use_dark_mode")
        .eq("user_id", user.id)
        .single();

      if (prefs && typeof prefs.use_dark_mode === "boolean") {
        setTheme(themeFromDarkMode(prefs.use_dark_mode));
        hasSynced.current = true;
      }
    })();
  }, [isReady, setTheme]);

  return null;
}
