import type { MealLogEntry } from "../types/meals";
import type { MealMacroTarget } from "../types/targets";
import { getLocalDateKey } from "./mealSnapshots";

const LOCAL_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DailyMealLogSummary {
  localDate: string;
  mealCount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeeklyMealLogSummaryDay extends DailyMealLogSummary {
  weekdayLabel: string;
}

export interface LastSevenDaysMealLogSummary {
  days: WeeklyMealLogSummaryDay[];
  daysWithLoggedMeals: number;
}

export interface TargetReferenceProgress {
  actual: number;
  target: number;
  percentage: number;
  visualPercentage: number;
}

export { getLocalDateKey };

export function isValidLocalDateKey(value: string): boolean {
  if (!LOCAL_DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function resolveMealLogLocalDate(log: MealLogEntry): string | null {
  if (isValidLocalDateKey(log.localDate)) {
    return log.localDate;
  }

  const loggedAtDate = new Date(log.loggedAt);

  if (Number.isNaN(loggedAtDate.getTime())) {
    return null;
  }

  return getLocalDateKey(loggedAtDate);
}

export function getLastLocalDateKeys(numberOfDays = 7): string[] {
  const safeNumberOfDays =
    Number.isInteger(numberOfDays) && numberOfDays > 0 ? numberOfDays : 7;
  const today = new Date();

  return Array.from({ length: safeNumberOfDays }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (safeNumberOfDays - 1 - index)
    );

    return getLocalDateKey(date);
  });
}

export function summarizeMealLogsForDate(
  logs: MealLogEntry[],
  localDate: string
): DailyMealLogSummary {
  const summary: DailyMealLogSummary = {
    localDate,
    mealCount: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  if (!isValidLocalDateKey(localDate)) {
    return summary;
  }

  for (const log of logs) {
    if (resolveMealLogLocalDate(log) !== localDate) {
      continue;
    }

    summary.mealCount += 1;
    summary.calories += getSafeNutritionValue(log.totalCalories);
    summary.protein += getSafeNutritionValue(log.totalProtein);
    summary.carbs += getSafeNutritionValue(log.totalCarbs);
    summary.fat += getSafeNutritionValue(log.totalFat);
  }

  return summary;
}

export function summarizeMealLogsForLastSevenDays(
  logs: MealLogEntry[]
): LastSevenDaysMealLogSummary {
  const days = getLastLocalDateKeys(7).map((localDate) => {
    const summary = summarizeMealLogsForDate(logs, localDate);

    return {
      ...summary,
      weekdayLabel: getShortWeekdayLabel(localDate),
    };
  });

  return {
    days,
    daysWithLoggedMeals: days.filter((day) => day.mealCount > 0).length,
  };
}

export function getTargetReferenceProgress(
  actual: number,
  target: number
): TargetReferenceProgress {
  const safeActual = getSafeNutritionValue(actual);
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;
  const percentage = safeTarget > 0 ? (safeActual / safeTarget) * 100 : 0;

  return {
    actual: safeActual,
    target: safeTarget,
    percentage,
    visualPercentage: clamp(percentage, 0, 100),
  };
}

export function getMacroTargetReferenceProgress(summary: DailyMealLogSummary, target: MealMacroTarget) {
  return {
    calories: getTargetReferenceProgress(summary.calories, target.calories),
    protein: getTargetReferenceProgress(summary.protein, target.proteinGrams),
    carbs: getTargetReferenceProgress(summary.carbs, target.carbsGrams),
  };
}

function getSafeNutritionValue(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getShortWeekdayLabel(localDate: string): string {
  const [yearText, monthText, dayText] = localDate.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText));

  return date.toLocaleDateString([], { weekday: "short" });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
