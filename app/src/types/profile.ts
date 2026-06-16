export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type NutritionGoal =
  | "maintain"
  | "lose_weight"
  | "gain_muscle"
  | "performance";

export type Sex = "male" | "female" | "prefer_not_to_say";

export interface NutritionProfile {
  displayName: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
}
