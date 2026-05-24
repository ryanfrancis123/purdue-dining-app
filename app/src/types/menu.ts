export type MealPeriod = "Breakfast" | "Lunch" | "Dinner";

export type MenuItem = {
  id: string;
  name: string;
  diningHall: string;
  mealPeriod: MealPeriod;
  station: string;
  date: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dietaryTags: string[];
  allergens: string[];
  available: boolean;
};

export type UserGoal = {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat?: number;
  mealPeriod: MealPeriod;
  date: string;
  requiredDietaryTags: string[];
  allergensToAvoid: string[];
  preferredDiningHall?: string;
};

export type MealRecommendation = {
  items: MenuItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  score: number;
  explanation: string;
};