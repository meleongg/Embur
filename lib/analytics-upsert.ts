import type { SupabaseClient } from "@supabase/supabase-js";

/** Metrics from a single logged set. */
export type ExerciseSetMetrics = {
  weight: number;
  reps: number;
};

/**
 * Single-set personal records for an exercise.
 * - maxWeight: heaviest weight on any one set
 * - maxReps: most reps on any one set
 * - maxVolume: highest weight × reps on any one set (not session or day totals)
 */
export type ExerciseBests = {
  maxWeight: number;
  maxReps: number;
  maxVolume: number;
};

export function computeBestsFromSets(
  sets: ExerciseSetMetrics[]
): ExerciseBests {
  let maxWeight = 0;
  let maxReps = 0;
  let maxVolume = 0;

  for (const set of sets) {
    const weight = set.weight || 0;
    const reps = set.reps || 0;
    maxWeight = Math.max(maxWeight, weight);
    maxReps = Math.max(maxReps, reps);
    maxVolume = Math.max(maxVolume, weight * reps);
  }

  return { maxWeight, maxReps, maxVolume };
}

export function computeSessionTotals(
  exercises: {
    actualSets: {
      completed: boolean;
      weight: number | null;
      reps: number | null;
    }[];
  }[]
): { totalSets: number; totalVolume: number } {
  let totalSets = 0;
  let totalVolume = 0;

  for (const exercise of exercises) {
    for (const set of exercise.actualSets) {
      if (!set.completed) continue;
      totalSets += 1;
      totalVolume += (set.weight || 0) * (set.reps || 0);
    }
  }

  return { totalSets, totalVolume };
}

/**
 * Merges session bests into analytics, only advancing fields that improve.
 * Sets pr_achieved_at when any PR field increases.
 */
export async function upsertAnalyticsBests(
  supabase: SupabaseClient,
  userId: string,
  exerciseId: string,
  bests: ExerciseBests
): Promise<void> {
  if (bests.maxWeight <= 0 && bests.maxReps <= 0) return;

  const { data: existing, error: fetchError } = await supabase
    .from("analytics")
    .select("max_weight, max_reps, max_volume")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (fetchError) {
    console.error("Analytics fetch error:", fetchError);
    return;
  }

  const currentMaxWeight = existing?.max_weight || 0;
  const currentMaxReps = existing?.max_reps || 0;
  const currentMaxVolume = existing?.max_volume || 0;

  const newMaxWeight = Math.max(bests.maxWeight, currentMaxWeight);
  const newMaxReps = Math.max(bests.maxReps, currentMaxReps);
  const newMaxVolume = Math.max(bests.maxVolume, currentMaxVolume);

  const improved =
    newMaxWeight > currentMaxWeight ||
    newMaxReps > currentMaxReps ||
    newMaxVolume > currentMaxVolume;

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: userId,
    exercise_id: exerciseId,
    max_weight: newMaxWeight,
    max_reps: newMaxReps,
    max_volume: newMaxVolume,
    updated_at: now,
  };

  if (improved) {
    payload.pr_achieved_at = now;
  }

  const { error } = await supabase.from("analytics").upsert(payload, {
    onConflict: "user_id,exercise_id",
  });

  if (error) {
    console.error("Analytics upsert error:", error);
  }
}

export async function upsertAnalyticsFromSessionExercises(
  supabase: SupabaseClient,
  userId: string,
  exercises: {
    id: string;
    actualSets: {
      completed: boolean;
      weight: number | null;
      reps: number | null;
    }[];
  }[]
): Promise<void> {
  for (const exercise of exercises) {
    const completedSets = exercise.actualSets.filter((set) => set.completed);
    if (completedSets.length === 0) continue;

    const bests = computeBestsFromSets(
      completedSets.map((set) => ({
        weight: set.weight || 0,
        reps: set.reps || 0,
      }))
    );

    await upsertAnalyticsBests(supabase, userId, exercise.id, bests);
  }
}
