import type { MealRecommendation } from "../types/menu";
import type {
  MealLogEntry,
  MealSnapshotItem,
  SavedMeal,
} from "../types/meals";

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function generateMealRecordId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getMealDuplicateKey(itemIds: string[]) {
  return itemIds.slice().sort().join("|");
}

function createMealSnapshotItems(
  meal: MealRecommendation
): MealSnapshotItem[] {
  return meal.items.map((item) => ({
    id: item.id,
    name: item.name,
    diningHall: item.diningHall,
    mealPeriod: item.mealPeriod,
    category: item.category,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    allergens: item.allergens,
    dietaryTags: item.dietaryTags,
    servingSize: item.servingSize,
  }));
}

export function createSavedMealFromRecommendation(
  meal: MealRecommendation,
  date = new Date()
): SavedMeal {
  const itemIds = meal.items.map((item) => item.id);

  return {
    id: generateMealRecordId("saved-meal"),
    recommendationId: meal.id,
    itemIds,
    items: createMealSnapshotItems(meal),
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    explanation: meal.explanation,
    savedAt: date.toISOString(),
    localDate: getLocalDateKey(date),
  };
}

export function createMealLogFromRecommendation(
  meal: MealRecommendation,
  savedMealId?: string,
  date = new Date()
): MealLogEntry {
  const itemIds = meal.items.map((item) => item.id);

  return {
    id: generateMealRecordId("meal-log"),
    savedMealId,
    recommendationId: meal.id,
    itemIds,
    items: createMealSnapshotItems(meal),
    totalCalories: meal.totalCalories,
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    explanation: meal.explanation,
    loggedAt: date.toISOString(),
    localDate: getLocalDateKey(date),
  };
}

export function createMealLogFromSavedMeal(
  savedMeal: SavedMeal,
  date = new Date()
): MealLogEntry {
  return {
    id: generateMealRecordId("meal-log"),
    savedMealId: savedMeal.id,
    recommendationId: savedMeal.recommendationId,
    itemIds: savedMeal.itemIds,
    items: savedMeal.items,
    totalCalories: savedMeal.totalCalories,
    totalProtein: savedMeal.totalProtein,
    totalCarbs: savedMeal.totalCarbs,
    totalFat: savedMeal.totalFat,
    explanation: savedMeal.explanation,
    loggedAt: date.toISOString(),
    localDate: getLocalDateKey(date),
  };
}
