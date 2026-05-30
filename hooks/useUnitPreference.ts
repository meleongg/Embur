import { queryKeys } from "@/lib/query-keys";
import { fetchUserPreferences } from "@/lib/queries/user-preferences";
import { useQuery } from "@tanstack/react-query";

export function useUnitPreference() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.userPreferences.current(),
    queryFn: fetchUserPreferences,
  });

  return {
    useMetric: data?.use_metric ?? true,
    defaultRestTimer: data?.default_rest_timer ?? 60,
    useDarkMode: data?.use_dark_mode ?? false,
    isLoading,
  };
}
