import { sampleMenuItems } from "../data/sampleMenuItems";
import type { MenuItem } from "../types/menu";
import { fetchMenuItemsFromSupabase } from "./menuService";

export type MenuDataSource = "supabase" | "fallback";

export type MenuItemsResult = {
  items: MenuItem[];
  source: MenuDataSource;
};

export async function getMenuItems(): Promise<MenuItemsResult> {
  try {
    const supabaseItems = await fetchMenuItemsFromSupabase();

    if (supabaseItems.length > 0) {
      return {
        items: supabaseItems,
        source: "supabase",
      };
    }

    console.warn(
      "Supabase returned no menu items. Falling back to local sample data."
    );

    return {
      items: sampleMenuItems,
      source: "fallback",
    };
  } catch (error) {
    console.warn(
      "Failed to fetch menu items from Supabase. Falling back to local sample data.",
      error
    );

    return {
      items: sampleMenuItems,
      source: "fallback",
    };
  }
}