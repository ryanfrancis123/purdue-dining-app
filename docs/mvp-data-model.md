# Purdue Dining App MVP Data Model

## Current MVP Goal

The current MVP helps a student enter macro targets and receive realistic meal combinations from sample dining hall data.

The app currently works fully with local sample data. Supabase will be added later as the database layer, but the core data model and recommendation logic are being designed locally first.

## Core Idea

The app recommends full meal combinations, not isolated food items.

A meal recommendation is currently built from:

- 1 protein item
- 1 carb item
- 1 side, vegetable, or fruit item

This keeps the MVP simple while still making the recommendations useful.

## MenuItem

Each food item uses the following structure:

```ts
export interface MenuItem {
  id: string;
  name: string;

  diningHall: DiningHall;
  mealPeriod: MealPeriod;
  category: MenuCategory;

  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  allergens: Allergen[];
  dietaryTags: string[];

  servingSize?: string;
}