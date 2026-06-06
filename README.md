# Purdue Dining App

A mobile app for helping Purdue students choose dining hall meals based on nutrition goals, meal period, dining hall, allergens, and dietary preferences.

## Current stack

- Expo React Native
- TypeScript
- Expo Router
- Supabase PostgreSQL
- Supabase JavaScript client
- Local fallback seed data
- CSV-based menu data workflow

## Current features

- Meal recommendations based on calories, protein, carbs, and fat
- Meal period filtering
- Dining hall filtering
- Allergen exclusion
- Compact recommendation cards
- Bottom sheet meal details
- Supabase-backed menu data
- Local fallback data if Supabase is unavailable

### Macro Target Presets

The app includes quick macro target presets such as Balanced Meal, Higher Protein, Lower Calorie, and Pre-Workout.

These presets do not secretly change the recommendation scoring logic. Instead, they visibly update the calorie, protein, and carbohydrate target inputs on the home screen. The recommendation engine continues to rank meals based on the visible target numbers.

Users can manually edit the targets after selecting a preset. When they do, the app treats the targets as custom values.

## Project structure

```txt
app/      Expo React Native app
data/     Seed menu CSV files
docs/     Project documentation
scripts/  Data validation and reporting scripts