import {
  Allergen,
  DiningHall,
  MacroTargets,
  MealPeriod,
  MealRecommendation,
  MenuItem,
} from "../types/menu";

const CALORIE_SCORE_WEIGHT = 1;
const PROTEIN_SCORE_WEIGHT = 8;
const CARB_SCORE_WEIGHT = 3;
const CLOSE_CALORIE_PERCENT = 0.15;
const CLOSE_PROTEIN_PERCENT = 0.15;
const CLOSE_CARB_PERCENT = 0.2;

function getRelativeDifference(actual: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.abs(actual - target) / target;
}

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

function calculateScore(
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  },
  targets: MacroTargets
) {
  const calorieDifference = getRelativeDifference(
    totals.calories,
    targets.calories
  );

  const proteinDifference = getRelativeDifference(
    totals.protein,
    targets.protein
  );

  const carbDifference = getRelativeDifference(totals.carbs, targets.carbs);

  return (
    calorieDifference * CALORIE_SCORE_WEIGHT +
    proteinDifference * PROTEIN_SCORE_WEIGHT +
    carbDifference * CARB_SCORE_WEIGHT
  );
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

  const reasons: string[] = [];

  const absoluteCalorieDifference = Math.abs(calorieDifference);
  const absoluteProteinDifference = Math.abs(proteinDifference);
  const absoluteCarbDifference = Math.abs(carbDifference);

  if (
    getRelativeDifference(totals.calories, targets.calories) <=
    CLOSE_CALORIE_PERCENT
  ) {
    reasons.push("close to your calorie target");
  } else if (calorieDifference < 0) {
    reasons.push(`${absoluteCalorieDifference} calories under your target`);
  } else {
    reasons.push(`${absoluteCalorieDifference} calories over your target`);
  }

  if (
    getRelativeDifference(totals.protein, targets.protein) <=
    CLOSE_PROTEIN_PERCENT
  ) {
    reasons.push("strong protein match");
  } else if (proteinDifference > 0) {
    reasons.push(`${proteinDifference}g protein above your target`);
  } else {
    reasons.push(`${absoluteProteinDifference}g protein below your target`);
  }

  if (
    getRelativeDifference(totals.carbs, targets.carbs) <=
    CLOSE_CARB_PERCENT
  ) {
    reasons.push("close to your carb target");
  } else if (carbDifference < 0) {
    reasons.push("lower-carb option");
  } else {
    reasons.push(`${carbDifference}g carbs above your target`);
  }

  return `Recommended because it is ${reasons.join(", ")}.`;
}

function mealPeriodsAreCompatible(items: MenuItem[]) {
  const specificMealPeriods = items
    .map((item) => item.mealPeriod)
    .filter((mealPeriod) => mealPeriod !== "all_day");

  if (specificMealPeriods.length === 0) {
    return true;
  }

  const firstMealPeriod = specificMealPeriods[0];

  return specificMealPeriods.every(
    (mealPeriod) => mealPeriod === firstMealPeriod
  );
}

export function recommendMeals(
  items: MenuItem[],
  targets: MacroTargets,
  selectedMealPeriod?: MealPeriod,
  excludedAllergens: Allergen[] = [],
  selectedDiningHall?: DiningHall
): MealRecommendation[] {
  const filteredItems = items.filter((item) => {
    const matchesMealPeriod =
      selectedMealPeriod === undefined ||
      item.mealPeriod === selectedMealPeriod ||
      item.mealPeriod === "all_day";

    const matchesDiningHall =
      selectedDiningHall === undefined ||
      item.diningHall === selectedDiningHall;

    const hasExcludedAllergen = item.allergens.some((allergen) =>
      excludedAllergens.includes(allergen)
    );

  return matchesMealPeriod && matchesDiningHall && !hasExcludedAllergen;
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

        if (!mealPeriodsAreCompatible(mealItems)) {
          continue;
        }

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