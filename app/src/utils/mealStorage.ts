import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ALLERGEN_OPTIONS,
  DINING_HALL_OPTIONS,
} from "../constants/menuOptions";
import type {
  Allergen,
  DiningHall,
  MealPeriod,
  MenuCategory,
} from "../types/menu";
import type {
  MealLogEntry,
  MealSnapshotItem,
  PersistedMealData,
  SavedMeal,
} from "../types/meals";
import { getMealDuplicateKey } from "./mealSnapshots";

export const MEAL_STORAGE_KEY = "@purdue-dining:meals";

export const EMPTY_MEAL_DATA: PersistedMealData = {
  version: 1,
  savedMeals: [],
  mealLogs: [],
};

const MENU_CATEGORY_VALUES: MenuCategory[] = [
  "protein",
  "carb",
  "vegetable",
  "fruit",
  "side",
  "dessert",
  "drink",
  "sauce",
  "other",
];

const MEAL_PERIOD_VALUES: MealPeriod[] = [
  "breakfast",
  "lunch",
  "dinner",
  "all_day",
];

const DINING_HALL_VALUES: DiningHall[] = [
  ...DINING_HALL_OPTIONS.map((option) => option.value),
  "Unknown",
];

const ALLERGEN_VALUES = ALLERGEN_OPTIONS.map((option) => option.value);

type BaseMealRecordFields = {
  id: string;
  recommendationId: string;
  itemIds: string[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  explanation: string;
  localDate: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAllergen(value: unknown): value is Allergen {
  return ALLERGEN_VALUES.includes(value as Allergen);
}

function isDiningHall(value: unknown): value is DiningHall {
  return DINING_HALL_VALUES.includes(value as DiningHall);
}

function isMealPeriod(value: unknown): value is MealPeriod {
  return MEAL_PERIOD_VALUES.includes(value as MealPeriod);
}

function isMenuCategory(value: unknown): value is MenuCategory {
  return MENU_CATEGORY_VALUES.includes(value as MenuCategory);
}

function parseMealSnapshotItem(value: unknown): MealSnapshotItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !isDiningHall(value.diningHall) ||
    !isMealPeriod(value.mealPeriod) ||
    !isMenuCategory(value.category) ||
    !isFiniteNumber(value.calories) ||
    !isFiniteNumber(value.protein) ||
    !isFiniteNumber(value.carbs) ||
    !isFiniteNumber(value.fat) ||
    !Array.isArray(value.allergens) ||
    !isStringArray(value.dietaryTags) ||
    !(
      value.servingSize === undefined ||
      typeof value.servingSize === "string"
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    diningHall: value.diningHall,
    mealPeriod: value.mealPeriod,
    category: value.category,
    calories: value.calories,
    protein: value.protein,
    carbs: value.carbs,
    fat: value.fat,
    allergens: value.allergens.filter(isAllergen),
    dietaryTags: value.dietaryTags,
    servingSize: value.servingSize,
  };
}

function parseMealSnapshotItems(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map(parseMealSnapshotItem)
    .filter((item): item is MealSnapshotItem => item !== null);

  return items.length === value.length ? items : null;
}

function hasBaseMealRecordFields(
  value: Record<string, unknown>
): value is Record<string, unknown> & BaseMealRecordFields {
  return (
    typeof value.id === "string" &&
    typeof value.recommendationId === "string" &&
    isStringArray(value.itemIds) &&
    isFiniteNumber(value.totalCalories) &&
    isFiniteNumber(value.totalProtein) &&
    isFiniteNumber(value.totalCarbs) &&
    isFiniteNumber(value.totalFat) &&
    typeof value.explanation === "string" &&
    typeof value.localDate === "string"
  );
}

function parseSavedMeal(value: unknown): SavedMeal | null {
  if (!isRecord(value) || !hasBaseMealRecordFields(value)) {
    return null;
  }

  const items = parseMealSnapshotItems(value.items);

  if (items === null || typeof value.savedAt !== "string") {
    return null;
  }

  return {
    id: value.id,
    recommendationId: value.recommendationId,
    itemIds: value.itemIds,
    items,
    totalCalories: value.totalCalories,
    totalProtein: value.totalProtein,
    totalCarbs: value.totalCarbs,
    totalFat: value.totalFat,
    explanation: value.explanation,
    savedAt: value.savedAt,
    localDate: value.localDate,
  };
}

function parseMealLogEntry(value: unknown): MealLogEntry | null {
  if (!isRecord(value) || !hasBaseMealRecordFields(value)) {
    return null;
  }

  const items = parseMealSnapshotItems(value.items);

  if (
    items === null ||
    typeof value.loggedAt !== "string" ||
    !(
      value.savedMealId === undefined ||
      typeof value.savedMealId === "string"
    )
  ) {
    return null;
  }

  return {
    id: value.id,
    savedMealId: value.savedMealId,
    recommendationId: value.recommendationId,
    itemIds: value.itemIds,
    items,
    totalCalories: value.totalCalories,
    totalProtein: value.totalProtein,
    totalCarbs: value.totalCarbs,
    totalFat: value.totalFat,
    explanation: value.explanation,
    loggedAt: value.loggedAt,
    localDate: value.localDate,
  };
}

function parsePersistedMealData(value: unknown): PersistedMealData {
  if (!isRecord(value) || value.version !== 1) {
    return EMPTY_MEAL_DATA;
  }

  return {
    version: 1,
    savedMeals: Array.isArray(value.savedMeals)
      ? value.savedMeals
          .map(parseSavedMeal)
          .filter((meal): meal is SavedMeal => meal !== null)
      : [],
    mealLogs: Array.isArray(value.mealLogs)
      ? value.mealLogs
          .map(parseMealLogEntry)
          .filter((entry): entry is MealLogEntry => entry !== null)
      : [],
  };
}

export async function loadPersistedMealData(): Promise<PersistedMealData> {
  try {
    const storedMealDataJson = await AsyncStorage.getItem(MEAL_STORAGE_KEY);

    if (storedMealDataJson === null) {
      return EMPTY_MEAL_DATA;
    }

    return parsePersistedMealData(JSON.parse(storedMealDataJson));
  } catch (error) {
    console.warn("Could not load meal data.", error);
    return EMPTY_MEAL_DATA;
  }
}

export async function savePersistedMealData(data: PersistedMealData) {
  try {
    await AsyncStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn("Could not save meal data.", error);
    return false;
  }
}

export async function addSavedMeal(meal: SavedMeal): Promise<PersistedMealData> {
  const data = await loadPersistedMealData();
  const mealDuplicateKey = getMealDuplicateKey(meal.itemIds);
  const alreadySaved = data.savedMeals.some(
    (savedMeal) => getMealDuplicateKey(savedMeal.itemIds) === mealDuplicateKey
  );
  const nextData = alreadySaved
    ? data
    : {
        ...data,
        savedMeals: [meal, ...data.savedMeals],
      };

  if (!alreadySaved) {
    const didSave = await savePersistedMealData(nextData);

    if (!didSave) {
      return data;
    }
  }

  return nextData;
}

export async function removeSavedMeal(id: string): Promise<PersistedMealData> {
  const data = await loadPersistedMealData();
  const nextData = {
    ...data,
    savedMeals: data.savedMeals.filter((meal) => meal.id !== id),
  };

  const didSave = await savePersistedMealData(nextData);

  return didSave ? nextData : data;
}

export async function addMealLogEntry(
  entry: MealLogEntry
): Promise<PersistedMealData> {
  const data = await loadPersistedMealData();
  const nextData = {
    ...data,
    mealLogs: [entry, ...data.mealLogs],
  };

  const didSave = await savePersistedMealData(nextData);

  return didSave ? nextData : data;
}

export async function removeMealLogEntry(
  id: string
): Promise<PersistedMealData> {
  const data = await loadPersistedMealData();
  const nextData = {
    ...data,
    mealLogs: data.mealLogs.filter((entry) => entry.id !== id),
  };

  const didSave = await savePersistedMealData(nextData);

  return didSave ? nextData : data;
}
