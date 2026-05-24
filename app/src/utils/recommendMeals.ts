import { MealRecommendation, MenuItem, UserGoal } from "../types/menu";

function hasBlockedAllergen(item: MenuItem, allergensToAvoid: string[]): boolean {
  return item.allergens.some((allergen) =>
    allergensToAvoid.includes(allergen)
  );
}

function hasRequiredDietaryTags(
  item: MenuItem,
  requiredDietaryTags: string[]
): boolean {
  return requiredDietaryTags.every((tag) =>
    item.dietaryTags.includes(tag)
  );
}

function filterMenuItems(items: MenuItem[], goal: UserGoal): MenuItem[] {
  return items.filter((item) => {
    if (!item.available) return false;
    if (item.date !== goal.date) return false;
    if (item.mealPeriod !== goal.mealPeriod) return false;

    if (
      goal.preferredDiningHall &&
      item.diningHall !== goal.preferredDiningHall
    ) {
      return false;
    }

    if (hasBlockedAllergen(item, goal.allergensToAvoid)) return false;

    if (!hasRequiredDietaryTags(item, goal.requiredDietaryTags)) {
      return false;
    }

    return true;
  });
}

function calculateTotals(items: MenuItem[]) {
  return items.reduce(
    (totals, item) => {
      return {
        calories: totals.calories + item.calories,
        protein: totals.protein + item.protein,
        carbs: totals.carbs + item.carbs,
        fat: totals.fat + item.fat,
      };
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  );
}

function calculateScore(totals: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}, goal: UserGoal): number {
  const calorieDiff = Math.abs(totals.calories - goal.targetCalories);
  const proteinDiff = Math.abs(totals.protein - goal.targetProtein);
  const carbDiff = Math.abs(totals.carbs - goal.targetCarbs);

  let score = calorieDiff + proteinDiff * 4 + carbDiff * 2;

  if (goal.targetFat !== undefined) {
    const fatDiff = Math.abs(totals.fat - goal.targetFat);
    score += fatDiff;
  }

  return score;
}

function createExplanation(
  recommendation: Omit<MealRecommendation, "explanation">
): string {
  const itemNames = recommendation.items.map((item) => item.name).join(", ");

  return `This meal combines ${itemNames}. Estimated macros: ${recommendation.totalProtein}g protein, ${recommendation.totalCarbs}g carbs, ${recommendation.totalFat}g fat, and ${recommendation.totalCalories} calories.`;
}

export function recommendMeals(
  items: MenuItem[],
  goal: UserGoal
): MealRecommendation[] {
  const validItems = filterMenuItems(items, goal);

  const recommendations: MealRecommendation[] = [];

  for (let i = 0; i < validItems.length; i++) {
    for (let j = i + 1; j < validItems.length; j++) {
      for (let k = j + 1; k < validItems.length; k++) {
        const mealItems = [validItems[i], validItems[j], validItems[k]];
        const totals = calculateTotals(mealItems);
        const score = calculateScore(totals, goal);

        const recommendationWithoutExplanation = {
          items: mealItems,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          score,
        };

        recommendations.push({
          ...recommendationWithoutExplanation,
          explanation: createExplanation(recommendationWithoutExplanation),
        });
      }
    }
  }

  return recommendations
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}