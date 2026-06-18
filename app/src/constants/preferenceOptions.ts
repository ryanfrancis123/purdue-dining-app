import type { MealStylePreference, ProfilePreferences } from "../types/profile";

export const DEFAULT_PROFILE_PREFERENCES: ProfilePreferences = {
  excludedAllergens: [],
  favoriteDiningHalls: [],
  defaultMealStyle: null,
};

export const MEAL_STYLE_OPTIONS: {
  label: string;
  value: MealStylePreference;
}[] = [
  { label: "Balanced", value: "balanced" },
  { label: "Higher Protein", value: "higher_protein" },
  { label: "Lower Calorie", value: "lower_calorie" },
  { label: "Pre-Workout", value: "pre_workout" },
];
