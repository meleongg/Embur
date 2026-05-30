import { createClient } from "@/utils/supabase/client";

export async function fetchWorkoutDetail(workoutId: string) {
  const supabase = createClient();

  const [workoutResult, exercisesResult, historyResult] = await Promise.all([
    supabase
      .from("workouts")
      .select(`*, category:categories(*)`)
      .eq("id", workoutId)
      .single(),
    supabase
      .from("workout_exercises")
      .select(`*, exercise:exercises(*, categories(*))`)
      .eq("workout_id", workoutId)
      .order("exercise_order", { ascending: true }),
    supabase
      .from("sessions")
      .select("*")
      .eq("workout_id", workoutId)
      .order("ended_at", { ascending: false })
      .limit(5),
  ]);

  if (workoutResult.error) throw workoutResult.error;
  if (exercisesResult.error) throw exercisesResult.error;
  if (historyResult.error) throw historyResult.error;

  return {
    workout: workoutResult.data,
    workoutExercises: exercisesResult.data ?? [],
    workoutHistory: historyResult.data ?? [],
  };
}
