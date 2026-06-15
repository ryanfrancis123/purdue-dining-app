import type { NutritionProfile } from "../types/profile";
import type { MealMacroTarget } from "../types/targets";

export function estimateMealMacroTarget(
  profile: NutritionProfile
): MealMacroTarget {
  let calories = 600;
  let proteinGrams = 35;
  let carbsGrams = 65;

  switch (profile.goal) {
    case "lose_weight":
      calories -= 100;
      proteinGrams += 5;
      carbsGrams -= 10;
      break;
    case "maintain":
      break;
    case "gain_muscle":
      calories += 150;
      proteinGrams += 10;
      carbsGrams += 10;
      break;
    case "performance":
      calories += 120;
      proteinGrams += 5;
      carbsGrams += 20;
      break;
  }

  switch (profile.activityLevel) {
    case "sedentary":
      calories -= 60;
      carbsGrams -= 10;
      break;
    case "light":
      calories -= 30;
      carbsGrams -= 5;
      break;
    case "moderate":
      break;
    case "active":
      calories += 80;
      carbsGrams += 10;
      break;
    case "very_active":
      calories += 130;
      carbsGrams += 20;
      break;
  }

  if (profile.weightKg !== null) {
    if (profile.weightKg >= 85) {
      proteinGrams += 5;
    } else if (profile.weightKg < 55) {
      proteinGrams -= 5;
    }
  }

  return {
    calories: Math.round(Math.max(400, calories)),
    proteinGrams: Math.round(Math.max(20, proteinGrams)),
    carbsGrams: Math.round(Math.max(30, carbsGrams)),
  };
}
