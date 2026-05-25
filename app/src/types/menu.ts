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

export type DiningHall =
  | "Wiley"
  | "Windsor"
  | "Ford"
  | "Earhart"
  | "Hillenbrand"
  | "Unknown";

export type MealPeriod =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "all_day";

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

  allergens: string[];
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