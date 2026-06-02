import { supabase } from "../lib/supabase";
import type { MenuItem } from "../types/menu";

type SupabaseMenuItemRow = {
  id: string;
  name: string;
  dining_hall: string;
  meal_period: string;
  category: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  allergens: string[];
  dietary_tags: string[];
  serving_size: string | null;
  source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function mapSupabaseRowToMenuItem(row: SupabaseMenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    diningHall: row.dining_hall,
    mealPeriod: row.meal_period,
    category: row.category,
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
    allergens: row.allergens,
  };
}

export async function fetchMenuItemsFromSupabase(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch menu items: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map(mapSupabaseRowToMenuItem);
}