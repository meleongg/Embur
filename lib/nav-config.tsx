import { BicepsFlexed, ChartLine, History, Library } from "lucide-react";
import type { ReactNode } from "react";

export type AppNavItem = {
  href: string;
  icon: ReactNode;
  label: string;
};

export const appNavItems: AppNavItem[] = [
  {
    href: "/protected/workouts",
    icon: <Library className="h-5 w-5" />,
    label: "Workouts",
  },
  {
    href: "/protected/exercises",
    icon: <BicepsFlexed className="h-5 w-5" />,
    label: "Exercises",
  },
  {
    href: "/protected/sessions",
    icon: <History className="h-5 w-5" />,
    label: "Sessions",
  },
  {
    href: "/protected/analytics",
    icon: <ChartLine className="h-5 w-5" />,
    label: "Analytics",
  },
];
