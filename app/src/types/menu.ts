export type MenuCategory =
  | "protein"
  | "carb"
  | "vegetable"
  | "fruit"
  | "side"
  | "dessert"
  | "drink"
  | "sauce"
  | "other";

export const SUPPORTED_MENU_CATEGORIES = [
  "protein",
  "carb",
  "vegetable",
  "fruit",
  "side",
  "dessert",
  "drink",
  "sauce",
  "other",
] as const;

export type Allergen =
  | "milk"
  | "egg"
  | "wheat"
  | "soy"
  | "fish"
  | "peanut"
  | "tree_nut"
  | "shellfish"
  | "sesame";

export const SUPPORTED_ALLERGENS = [
  "milk",
  "egg",
  "wheat",
  "soy",
  "fish",
  "peanut",
  "tree_nut",
  "shellfish",
  "sesame",
] as const;

export type DiningHall =
  | "Wiley"
  | "Windsor"
  | "Ford"
  | "Earhart"
  | "Hillenbrand"
  | "Unknown";

export const SUPPORTED_DINING_HALLS = [
  "Wiley",
  "Windsor",
  "Ford",
  "Earhart",
  "Hillenbrand",
  "Unknown",
] as const;

export const IMPORTABLE_DINING_HALLS = [
  "Wiley",
  "Windsor",
  "Ford",
  "Earhart",
  "Hillenbrand",
] as const;

export type MealPeriod =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "all_day";

export const SUPPORTED_MEAL_PERIODS = [
  "breakfast",
  "lunch",
  "dinner",
  "all_day",
] as const;

export const SUPPORTED_DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "high_protein",
] as const;

export interface MenuItem {
  id: string;
  name: string;

  diningHall: DiningHall;
  mealPeriod: MealPeriod;
  category: MenuCategory;

  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  allergens: Allergen[];
  dietaryTags: string[];

  servingSize?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
}

export interface MealRecommendation {
  id: string;
  items: MenuItem[];

  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;

  score: number;
  explanation: string;
}
