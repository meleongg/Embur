import { createClient } from "@/utils/supabase/client";

export async function fetchSessionsList() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required to view workout history");
  }

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      workout:workouts(*),
      session_exercises(*)
    `
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchSessionDetail(sessionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      workout:workouts(*),
      session_exercises(
        *,
        exercise:exercises(*, category:categories(*))
      )
    `
    )
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}
