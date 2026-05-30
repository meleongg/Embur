import { createClient } from "@/utils/supabase/client";

export type UserPreferences = {
  use_metric: boolean;
  use_dark_mode: boolean;
  default_rest_timer: number;
};

export async function fetchUserPreferences(): Promise<UserPreferences | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("use_metric, use_dark_mode, default_rest_timer")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}
