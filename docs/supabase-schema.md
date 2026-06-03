# Supabase Schema

## Module 2 Goal

Supabase will store dining hall menu item data for the Purdue Dining App.

The local sample data will remain in the app while Supabase is introduced. The app should not depend fully on Supabase until the database connection and fallback behavior are stable.

## MVP Table

### menu_items

Stores individual dining hall food/menu items with nutrition data, allergens, dietary tags, and meal metadata.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Food item name |
| dining_hall | text | Dining hall name |
| meal_period | text | breakfast, lunch, dinner |
| category | text | protein, carb, side, vegetable, dessert, drink |
| calories | integer | Calories per serving |
| protein_g | numeric | Protein in grams |
| carbs_g | numeric | Carbs in grams |
| fat_g | numeric | Fat in grams |
| allergens | text[] | Allergen list |
| dietary_tags | text[] | Dietary/diet labels |
| serving_size | text | Serving size text |
| source | text | Data source label |
| is_active | boolean | Whether item appears in app |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Design Rule

Do not remove local sample data yet.

The app will eventually support:

- local sample data fallback
- Supabase menu item fetching
- mapping database rows into the existing MenuItem type

## Database Constraints

The `menu_items` table includes database-level constraints to prevent invalid menu data from being inserted.

### Meal Period Constraint

Allowed values:

- `breakfast`
- `lunch`
- `dinner`

### Category Constraint

Allowed values:

- `protein`
- `carb`
- `side`
- `vegetable`
- `dessert`
- `drink`

### Dining Hall Constraint

Allowed values:

- `Wiley`
- `Ford`
- `Earhart`
- `Windsor`
- `Hillenbrand`
- `The Gathering Place`

These constraints protect the app from invalid Supabase data such as misspelled meal periods, unsupported categories, or fake dining halls.

## Automatic Updated Timestamp

The `menu_items` table uses a database trigger to automatically update the `updated_at` column whenever an existing row is edited.

This prevents the app or admin tools from needing to manually set `updated_at` during updates.