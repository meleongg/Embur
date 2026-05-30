import { createClient } from "@/utils/supabase/client";

export async function fetchExerciseLibrary() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const [categoriesResult, exercisesResult] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase
      .from("exercises")
      .select("*, category:categories(*)")
      .or(`is_default.eq.true,user_id.eq.${user.id}`)
      .order("name"),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (exercisesResult.error) throw exercisesResult.error;

  return {
    categories: categoriesResult.data ?? [],
    exercises: exercisesResult.data ?? [],
  };
}
