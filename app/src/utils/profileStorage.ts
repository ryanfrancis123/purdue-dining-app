import AsyncStorage from "@react-native-async-storage/async-storage";

import { ALLERGEN_OPTIONS, DINING_HALL_OPTIONS } from "../constants/menuOptions";
import { DEFAULT_PROFILE_PREFERENCES } from "../constants/preferenceOptions";
import type {
  ActivityLevel,
  MealStylePreference,
  NutritionGoal,
  NutritionProfile,
  ProfilePreferences,
  Sex,
} from "../types/profile";

export const PROFILE_STORAGE_KEY = "@purdue-dining:nutrition-profile";

export type UnitSystem = "us" | "metric";

export type StoredNutritionProfileV1 = {
  version: 1;
  profile: NutritionProfile;
  unitSystem: UnitSystem;
};

export type StoredNutritionProfile = {
  version: 2;
  profile: NutritionProfile;
  unitSystem: UnitSystem;
  preferences: ProfilePreferences;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isSex(value: unknown): value is Sex {
  return (
    value === "male" ||
    value === "female" ||
    value === "prefer_not_to_say"
  );
}

function isActivityLevel(value: unknown): value is ActivityLevel {
  return (
    value === "sedentary" ||
    value === "light" ||
    value === "moderate" ||
    value === "active" ||
    value === "very_active"
  );
}

function isNutritionGoal(value: unknown): value is NutritionGoal {
  return (
    value === "maintain" ||
    value === "lose_weight" ||
    value === "gain_muscle" ||
    value === "performance"
  );
}

function isUnitSystem(value: unknown): value is UnitSystem {
  return value === "us" || value === "metric";
}

function isMealStylePreference(value: unknown): value is MealStylePreference {
  return (
    value === "balanced" ||
    value === "higher_protein" ||
    value === "lower_calorie" ||
    value === "pre_workout"
  );
}

function parseNutritionProfile(value: unknown): NutritionProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !(typeof value.displayName === "string" || value.displayName === null) ||
    !isNullableFiniteNumber(value.age) ||
    !isNullableFiniteNumber(value.heightCm) ||
    !isNullableFiniteNumber(value.weightKg) ||
    !isSex(value.sex) ||
    !isActivityLevel(value.activityLevel) ||
    !isNutritionGoal(value.goal)
  ) {
    return null;
  }

  return {
    displayName: value.displayName,
    age: value.age,
    heightCm: value.heightCm,
    weightKg: value.weightKg,
    sex: value.sex,
    activityLevel: value.activityLevel,
    goal: value.goal,
  };
}

function parseProfilePreferences(value: unknown): ProfilePreferences {
  if (!isRecord(value)) {
    return DEFAULT_PROFILE_PREFERENCES;
  }

  const supportedAllergens = new Set(
    ALLERGEN_OPTIONS.map((option) => option.value)
  );
  const supportedDiningHalls = new Set(
    DINING_HALL_OPTIONS.map((option) => option.value)
  );

  const excludedAllergens = Array.isArray(value.excludedAllergens)
    ? value.excludedAllergens.filter((allergen) =>
        supportedAllergens.has(allergen)
      )
    : DEFAULT_PROFILE_PREFERENCES.excludedAllergens;

  const favoriteDiningHalls = Array.isArray(value.favoriteDiningHalls)
    ? value.favoriteDiningHalls.filter((diningHall) =>
        supportedDiningHalls.has(diningHall)
      )
    : DEFAULT_PROFILE_PREFERENCES.favoriteDiningHalls;

  const defaultMealStyle = isMealStylePreference(value.defaultMealStyle)
    ? value.defaultMealStyle
    : DEFAULT_PROFILE_PREFERENCES.defaultMealStyle;

  return {
    excludedAllergens,
    favoriteDiningHalls,
    defaultMealStyle,
  };
}

function parseStoredNutritionProfile(value: unknown): StoredNutritionProfile | null {
  if (!isRecord(value) || !isUnitSystem(value.unitSystem)) {
    return null;
  }

  const profile = parseNutritionProfile(value.profile);

  if (profile === null) {
    return null;
  }

  if (value.version === 1) {
    return {
      version: 2,
      profile,
      unitSystem: value.unitSystem,
      preferences: DEFAULT_PROFILE_PREFERENCES,
    };
  }

  if (value.version !== 2) {
    return null;
  }

  return {
    version: 2,
    profile,
    unitSystem: value.unitSystem,
    preferences: parseProfilePreferences(value.preferences),
  };
}

export async function loadPersistedNutritionProfile() {
  const storedProfileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

  if (storedProfileJson === null) {
    return null;
  }

  return parseStoredNutritionProfile(JSON.parse(storedProfileJson));
}

export async function savePersistedNutritionProfile(
  profile: NutritionProfile,
  unitSystem: UnitSystem,
  preferences = DEFAULT_PROFILE_PREFERENCES
) {
  const storedProfile: StoredNutritionProfile = {
    version: 2,
    profile,
    unitSystem,
    preferences,
  };

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(storedProfile));
}

export async function removePersistedNutritionProfile() {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}
