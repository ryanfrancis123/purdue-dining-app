import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ActivityLevel, NutritionGoal, NutritionProfile, Sex } from "../types/profile";

export const PROFILE_STORAGE_KEY = "@purdue-dining:nutrition-profile";

export type UnitSystem = "us" | "metric";

export type StoredNutritionProfile = {
  version: 1;
  profile: NutritionProfile;
  unitSystem: UnitSystem;
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

function parseStoredNutritionProfile(value: unknown): StoredNutritionProfile | null {
  if (!isRecord(value) || value.version !== 1 || !isUnitSystem(value.unitSystem)) {
    return null;
  }

  const profile = value.profile;

  if (!isRecord(profile)) {
    return null;
  }

  if (
    !(typeof profile.displayName === "string" || profile.displayName === null) ||
    !isNullableFiniteNumber(profile.age) ||
    !isNullableFiniteNumber(profile.heightCm) ||
    !isNullableFiniteNumber(profile.weightKg) ||
    !isSex(profile.sex) ||
    !isActivityLevel(profile.activityLevel) ||
    !isNutritionGoal(profile.goal)
  ) {
    return null;
  }

  return {
    version: 1,
    profile: {
      displayName: profile.displayName,
      age: profile.age,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    },
    unitSystem: value.unitSystem,
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
  unitSystem: UnitSystem
) {
  const storedProfile: StoredNutritionProfile = {
    version: 1,
    profile,
    unitSystem,
  };

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(storedProfile));
}

export async function removePersistedNutritionProfile() {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}
