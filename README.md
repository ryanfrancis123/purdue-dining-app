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

## Project structure

```txt
app/      Expo React Native app
data/     Seed menu CSV files
docs/     Project documentation
scripts/  Data validation and reporting scripts