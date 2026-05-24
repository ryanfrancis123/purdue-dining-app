# Data Model

The MVP uses structured menu item data before live Purdue integration.

Each menu item contains:
- id
- name
- diningHall
- mealPeriod
- station
- date
- servingSize
- calories
- protein
- carbs
- fat
- dietaryTags
- allergens
- available

The app should not depend directly on Purdue's live website. The app reads from structured data first, then later from Supabase. Purdue live menu integration will be handled through a separate importer script.