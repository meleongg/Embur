export const queryKeys = {
  exercises: {
    all: ["exercises"] as const,
    list: () => [...queryKeys.exercises.all, "list"] as const,
    categories: () => [...queryKeys.exercises.all, "categories"] as const,
  },
  workouts: {
    all: ["workouts"] as const,
    list: (
      page: number,
      search: string,
      categoryId: string,
      sort: string
    ) =>
      [
        ...queryKeys.workouts.all,
        "list",
        { page, search, categoryId, sort },
      ] as const,
    detail: (id: string) => [...queryKeys.workouts.all, "detail", id] as const,
    categories: () => [...queryKeys.workouts.all, "categories"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    list: () => [...queryKeys.sessions.all, "list"] as const,
    detail: (id: string) => [...queryKeys.sessions.all, "detail", id] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    summary: () => [...queryKeys.analytics.all, "summary"] as const,
    exerciseProgress: (exerciseId: string, timeframe: string) =>
      [
        ...queryKeys.analytics.all,
        "exerciseProgress",
        { exerciseId, timeframe },
      ] as const,
    volumeLeaderboard: () =>
      [...queryKeys.analytics.all, "volumeLeaderboard"] as const,
  },
  userPreferences: {
    all: ["userPreferences"] as const,
    current: () => [...queryKeys.userPreferences.all, "current"] as const,
  },
};
