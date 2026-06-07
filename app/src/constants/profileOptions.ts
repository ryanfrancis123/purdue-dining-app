import type { ActivityLevel, NutritionGoal, Sex } from "../types/profile";

export const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

export const ACTIVITY_LEVEL_OPTIONS: {
  label: string;
  value: ActivityLevel;
  description: string;
}[] = [
  {
    label: "Sedentary",
    value: "sedentary",
    description: "Mostly sitting, little structured activity",
  },
  {
    label: "Light",
    value: "light",
    description: "Light walking or activity a few days per week",
  },
  {
    label: "Moderate",
    value: "moderate",
    description: "Regular exercise or active daily routine",
  },
  {
    label: "Active",
    value: "active",
    description: "Hard exercise or physically active lifestyle",
  },
  {
    label: "Very Active",
    value: "very_active",
    description: "Very intense training or highly physical routine",
  },
];

export const NUTRITION_GOAL_OPTIONS: {
  label: string;
  value: NutritionGoal;
  description: string;
}[] = [
  {
    label: "Maintain",
    value: "maintain",
    description: "Keep current body weight and eat balanced meals",
  },
  {
    label: "Lose Weight",
    value: "lose_weight",
    description: "Prefer lower calorie meals while keeping nutrition balanced",
  },
  {
    label: "Gain Muscle",
    value: "gain_muscle",
    description: "Prioritize protein and enough total energy",
  },
  {
    label: "Performance",
    value: "performance",
    description: "Support training, workouts, and higher energy needs",
  },
];