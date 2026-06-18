import { supabase } from "../lib/supabase";
import {
  IMPORTABLE_DINING_HALLS,
  SUPPORTED_ALLERGENS,
  SUPPORTED_DIETARY_TAGS,
  SUPPORTED_MENU_CATEGORIES,
  SUPPORTED_MEAL_PERIODS,
  type Allergen,
  type DiningHall,
  type MealPeriod,
  type MenuCategory,
  type MenuItem,
} from "../types/menu";

type SupabaseMenuItemRow = {
  id: unknown;
  name: unknown;
  dining_hall: unknown;
  meal_period: unknown;
  category: unknown;
  calories: unknown;
  protein_g: unknown;
  carbs_g: unknown;
  fat_g: unknown;
  allergens: unknown;
  dietary_tags: unknown;
  serving_size?: unknown;
  source?: unknown;
  is_active?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

const SUPPORTED_DINING_HALL_VALUES = new Set<string>(IMPORTABLE_DINING_HALLS);
const SUPPORTED_MEAL_PERIOD_VALUES = new Set<string>(SUPPORTED_MEAL_PERIODS);
const SUPPORTED_CATEGORY_VALUES = new Set<string>(SUPPORTED_MENU_CATEGORIES);
const SUPPORTED_ALLERGEN_VALUES = new Set<string>(SUPPORTED_ALLERGENS);
const SUPPORTED_DIETARY_TAG_VALUES = new Set<string>(SUPPORTED_DIETARY_TAGS);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isDiningHall(value: unknown): value is DiningHall {
  return typeof value === "string" && SUPPORTED_DINING_HALL_VALUES.has(value);
}

function isMealPeriod(value: unknown): value is MealPeriod {
  return typeof value === "string" && SUPPORTED_MEAL_PERIOD_VALUES.has(value);
}

function isMenuCategory(value: unknown): value is MenuCategory {
  return typeof value === "string" && SUPPORTED_CATEGORY_VALUES.has(value);
}

function isAllergen(value: unknown): value is Allergen {
  return typeof value === "string" && SUPPORTED_ALLERGEN_VALUES.has(value);
}

function getRowLabel(row: SupabaseMenuItemRow) {
  const id = isNonEmptyString(row.id) ? row.id.trim() : "unknown id";
  const name = isNonEmptyString(row.name) ? row.name.trim() : "unknown name";

  return `${id} (${name})`;
}

function warnInvalidMenuRow(row: SupabaseMenuItemRow, reason: string) {
  console.warn(`Skipping invalid menu item row ${getRowLabel(row)}: ${reason}.`);
}

function validateSupabaseRow(row: SupabaseMenuItemRow): MenuItem | null {
  if (!isNonEmptyString(row.id)) {
    warnInvalidMenuRow(row, "id must be a non-empty string");
    return null;
  }

  if (!isNonEmptyString(row.name)) {
    warnInvalidMenuRow(row, "name must be a non-empty string");
    return null;
  }

  if (!isDiningHall(row.dining_hall)) {
    warnInvalidMenuRow(row, "dining_hall is not supported");
    return null;
  }

  if (!isMealPeriod(row.meal_period)) {
    warnInvalidMenuRow(row, "meal_period is not supported");
    return null;
  }

  if (!isMenuCategory(row.category)) {
    warnInvalidMenuRow(row, "category is not supported");
    return null;
  }

  if (!isFiniteNonNegativeNumber(row.calories)) {
    warnInvalidMenuRow(row, "calories must be a finite non-negative number");
    return null;
  }

  if (!isFiniteNonNegativeNumber(row.protein_g)) {
    warnInvalidMenuRow(row, "protein_g must be a finite non-negative number");
    return null;
  }

  if (!isFiniteNonNegativeNumber(row.carbs_g)) {
    warnInvalidMenuRow(row, "carbs_g must be a finite non-negative number");
    return null;
  }

  if (!isFiniteNonNegativeNumber(row.fat_g)) {
    warnInvalidMenuRow(row, "fat_g must be a finite non-negative number");
    return null;
  }

  if (!Array.isArray(row.allergens) || !row.allergens.every(isAllergen)) {
    warnInvalidMenuRow(row, "allergens must contain only supported values");
    return null;
  }

  if (
    !Array.isArray(row.dietary_tags) ||
    !row.dietary_tags.every(
      (tag) => typeof tag === "string" && SUPPORTED_DIETARY_TAG_VALUES.has(tag)
    )
  ) {
    warnInvalidMenuRow(
      row,
      "dietary_tags must contain only supported string values"
    );
    return null;
  }

  if (
    row.serving_size !== undefined &&
    row.serving_size !== null &&
    typeof row.serving_size !== "string"
  ) {
    warnInvalidMenuRow(row, "serving_size must be a string or null");
    return null;
  }

  const servingSize = row.serving_size?.trim();

  return {
    id: row.id.trim(),
    name: row.name.trim(),
    diningHall: row.dining_hall,
    mealPeriod: row.meal_period,
    category: row.category,
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
    allergens: row.allergens,
    dietaryTags: row.dietary_tags,
    ...(servingSize ? { servingSize } : {}),
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

  return data
    .map((row) => validateSupabaseRow(row))
    .filter((item): item is MenuItem => item !== null);
}
