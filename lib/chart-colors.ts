/** Recharts colors aligned with Charcoal & Coral theme tokens */
export const chartColorsLight = {
  primary: "hsl(11, 65%, 62%)",
  success: "hsl(152, 24%, 62%)",
  charcoal: "hsl(235, 16%, 30%)",
  sand: "hsl(38, 45%, 65%)",
  teal: "hsl(158, 18%, 48%)",
} as const;

export const chartColorsDark = {
  primary: "hsl(27, 87%, 67%)",
  success: "hsl(152, 28%, 68%)",
  charcoal: "hsl(240, 5%, 65%)",
  sand: "hsl(38, 45%, 72%)",
  teal: "hsl(158, 22%, 55%)",
} as const;

/** @deprecated Use getChartColors(theme) in client components */
export const chartColors = chartColorsLight;

export function getChartColors(theme: "light" | "dark") {
  return theme === "dark" ? chartColorsDark : chartColorsLight;
}
