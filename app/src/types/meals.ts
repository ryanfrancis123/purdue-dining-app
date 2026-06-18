import type {
  Allergen,
  DiningHall,
  MealPeriod,
  MenuCategory,
} from "./menu";

export interface MealSnapshotItem {
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

export interface SavedMeal {
  id: string;
  recommendationId: string;
  itemIds: string[];
  items: MealSnapshotItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  explanation: string;
  savedAt: string;
  localDate: string;
}

export interface MealLogEntry {
  id: string;
  savedMealId?: string;
  recommendationId: string;
  itemIds: string[];
  items: MealSnapshotItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  explanation: string;
  loggedAt: string;
  localDate: string;
}

export interface PersistedMealData {
  version: 1;
  savedMeals: SavedMeal[];
  mealLogs: MealLogEntry[];
}
