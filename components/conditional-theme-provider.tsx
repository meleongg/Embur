"use client";

import { ThemeProvider } from "@/components/theme-provider";

export function ConditionalThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
