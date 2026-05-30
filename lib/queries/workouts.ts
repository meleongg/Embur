import { createClient } from "@/utils/supabase/client";

export type WorkoutsListParams = {
  page: number;
  pageSize: number;
  sortOption: string;
  filterOption: string;
  searchQuery: string;
};

export async function fetchWorkoutCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchWorkoutsList({
  page,
  pageSize,
  sortOption,
  filterOption,
  searchQuery,
}: WorkoutsListParams) {
  const supabase = createClient();

  let query = supabase.from("workouts").select(`
      *,
      category:categories(*),
      workout_exercises(exercise_id, exercises(name, category_id, categories(name)))
    `);

  let countQuery = supabase.from("workouts").select("id", { count: "exact" });

  if (filterOption !== "all") {
    query = query.eq("category_id", filterOption);
    countQuery = countQuery.eq("category_id", filterOption);
  }

  if (searchQuery) {
    query = query.ilike("name", `%${searchQuery}%`);
    countQuery = countQuery.ilike("name", `%${searchQuery}%`);
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw countError;
  const totalCount = count || 0;

  switch (sortOption) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    case "most_used":
      query = query.order("last_used_at", {
        ascending: false,
        nullsFirst: false,
      });
      break;
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  const { data, error } = await query.range(start, end);
  if (error) throw error;

  return {
    workouts: data ?? [],
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    totalCount,
  };
}
