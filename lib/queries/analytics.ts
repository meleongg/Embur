import { createClient } from "@/utils/supabase/client";

export async function fetchAnalyticsSummary() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const [exercisesResult, analyticsResult] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, name, category:categories(name)")
      .or(`is_default.eq.true,user_id.eq.${user.id}`),
    supabase
      .from("analytics")
      .select(
        `
        exercise_id,
        max_weight,
        max_reps,
        max_volume,
        updated_at,
        pr_achieved_at,
        exercises(name)
      `
      )
      .eq("user_id", user.id),
  ]);

  if (exercisesResult.error) throw exercisesResult.error;
  if (analyticsResult.error) throw analyticsResult.error;

  const personalRecords =
    analyticsResult.data?.map((record) => ({
      id: record.exercise_id,
      name: (record.exercises as { name?: string } | null)?.name,
      max_weight: record.max_weight || 0,
      max_reps: record.max_reps || 0,
      max_volume: record.max_volume || 0,
      date: record.pr_achieved_at ?? record.updated_at,
    })) ?? [];

  return {
    exercises: exercisesResult.data ?? [],
    personalRecords,
  };
}

export type ExerciseProgressRow = {
  id: string;
  reps: number;
  weight: number;
  exercise_id: string;
  session: { started_at: string } | null;
};

export async function fetchExerciseProgress(
  exerciseId: string,
  timeframe: string
): Promise<ExerciseProgressRow[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  let query = supabase
    .from("session_exercises")
    .select(
      `
      id, reps, weight, exercise_id,
      session:sessions!inner(started_at, user_id)
    `
    )
    .eq("user_id", user.id)
    .eq("exercise_id", exerciseId);

  if (timeframe !== "all") {
    const cutoff = new Date();
    if (timeframe === "week") cutoff.setDate(cutoff.getDate() - 7);
    else if (timeframe === "month") cutoff.setMonth(cutoff.getMonth() - 1);
    else if (timeframe === "3months") cutoff.setMonth(cutoff.getMonth() - 3);
    else if (timeframe === "year") cutoff.setFullYear(cutoff.getFullYear() - 1);

    query = query.gte("session.started_at", cutoff.toISOString());
  }

  const { data, error } = await query.order("session(started_at)", {
    ascending: false,
  });

  if (error) throw error;

  return (data ?? []) as unknown as ExerciseProgressRow[];
}

/** Top exercises by total volume — uses a bounded recent fetch */
export async function fetchVolumeLeaderboard(limit = 500) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("session_exercises")
    .select(
      `
      reps, weight,
      exercise:exercises(name)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
