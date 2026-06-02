import { sampleMenuItems } from "../data/sampleMenuItems";
import type { MenuItem } from "../types/menu";
import { fetchMenuItemsFromSupabase } from "./menuService";

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    const supabaseItems = await fetchMenuItemsFromSupabase();


    if (supabaseItems.length > 0) {
      return supabaseItems;
    }

    console.warn("Supabase returned no menu items. Falling back to local sample data.");
    return sampleMenuItems;
  } catch (error) {
    console.warn("Failed to fetch menu items from Supabase. Falling back to local sample data.", error);
    return sampleMenuItems;
  }
}