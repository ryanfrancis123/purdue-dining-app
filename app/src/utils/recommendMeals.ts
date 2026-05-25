import {
  Allergen,
  MacroTargets,
  MealPeriod,
  MealRecommendation,
  MenuItem,
} from "../types/menu";

function getMealTotals(items: MenuItem[]) {
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
}, targets: MacroTargets) {
  const calorieDifference = Math.abs(totals.calories - targets.calories);
  const proteinDifference = Math.abs(totals.protein - targets.protein);
  const carbDifference = Math.abs(totals.carbs - targets.carbs);

  return calorieDifference * 1 + proteinDifference * 8 + carbDifference * 3;
}

function buildExplanation(
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
  targets: MacroTargets
) {
  const calorieDifference = totals.calories - targets.calories;
  const proteinDifference = totals.protein - targets.protein;
  const carbDifference = totals.carbs - targets.carbs;

  const calorieText =
    calorieDifference === 0
      ? "matches your calorie target"
      : calorieDifference > 0
      ? `${calorieDifference} calories over your target`
      : `${Math.abs(calorieDifference)} calories under your target`;

  const proteinText =
    proteinDifference === 0
      ? "matches your protein target"
      : proteinDifference > 0
      ? `${proteinDifference}g protein over your target`
      : `${Math.abs(proteinDifference)}g protein under your target`;

  const carbText =
    carbDifference === 0
      ? "matches your carb target"
      : carbDifference > 0
      ? `${carbDifference}g carbs over your target`
      : `${Math.abs(carbDifference)}g carbs under your target`;

  return `This meal ${calorieText}, ${proteinText}, and ${carbText}.`;
}

export function recommendMeals(
  items: MenuItem[],
  targets: MacroTargets,
  selectedMealPeriod?: MealPeriod,
  excludedAllergens: Allergen[] = []
): MealRecommendation[] {
  const filteredItems = items.filter((item) => {
    const matchesMealPeriod =
      selectedMealPeriod === undefined ||
      item.mealPeriod === selectedMealPeriod ||
      item.mealPeriod === "all_day";

    const hasExcludedAllergen = item.allergens.some((allergen) =>
      excludedAllergens.includes(allergen)
    );

  return matchesMealPeriod && !hasExcludedAllergen;
});

  const proteins = filteredItems.filter((item) => item.category === "protein");
  const carbs = filteredItems.filter((item) => item.category === "carb");
  const sides = filteredItems.filter(
    (item) =>
      item.category === "vegetable" ||
      item.category === "side" ||
      item.category === "fruit"
  );

  const recommendations: MealRecommendation[] = [];

  for (const protein of proteins) {
    for (const carb of carbs) {
      for (const side of sides) {
        const mealItems = [protein, carb, side];
        const totals = getMealTotals(mealItems);
        const score = calculateScore(totals, targets);

        recommendations.push({
          id: `${protein.id}-${carb.id}-${side.id}`,
          items: mealItems,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          score,
          explanation: buildExplanation(totals, targets),
        });
      }
    }
  }

  return recommendations.sort((a, b) => a.score - b.score).slice(0, 5);
}