# Supabase Schema

Supabase stores structured dining hall menu item data for the Purdue Dining App.
The mobile app reads Supabase first and falls back to bundled local data if
Supabase fails or returns no active rows.

## Design Rules

- Keep the UUID `id` primary key.
- Keep `is_active` as the app-facing visibility switch.
- Keep existing seed rows valid.
- Add live-ingestion fields as nullable metadata until live ingestion is proven.
- Preserve local fallback data.
- Preserve saved meal snapshots and meal logs even if live rows later change.

## `menu_items`

Stores individual dining hall food/menu items with nutrition data, allergens,
dietary tags, meal metadata, and optional live-ingestion provenance.

### Current App Fields

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Food item name |
| dining_hall | text | Wiley, Windsor, Ford, Earhart, Hillenbrand |
| meal_period | text | breakfast, lunch, dinner, all_day |
| category | text | protein, carb, vegetable, fruit, side, dessert, drink, sauce, other |
| calories | integer | Calories per serving |
| protein_g | numeric | Protein in grams |
| carbs_g | numeric | Carbs in grams |
| fat_g | numeric | Fat in grams |
| allergens | text[] | Supported allergen list |
| dietary_tags | text[] | vegetarian, vegan, high_protein |
| serving_size | text | Serving size text |
| source | text | Data source label |
| is_active | boolean | Whether item appears in app |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### Live Ingestion Metadata

The migration in `supabase/migrations/20260618000000_add_live_menu_ingestion_fields.sql`
adds these nullable fields:

| Column | Type | Notes |
|---|---|---|
| serving_date | date | Date the item is served |
| station | text | Dining station or serving area |
| source_system | text | Source namespace, e.g. purdue_dining |
| source_url | text | Source page or endpoint URL |
| source_item_id | text | Source-provided item ID, if available |
| source_occurrence_key | text | Deterministic upsert key for a source/date/hall/meal/station occurrence |
| normalized_name | text | Normalized item name used for matching/reporting |
| last_fetched_at | timestamptz | Fetch time for latest ingestion run |
| first_seen_at | timestamptz | First time this occurrence was seen |
| last_seen_at | timestamptz | Most recent time this occurrence was seen |
| nutrition_status | text | complete, partial, missing |
| allergen_status | text | provided, not_provided, unknown |
| raw_payload | jsonb | Source payload excerpt for debugging |

The migration also adds indexes on:

- `is_active`
- `serving_date`
- `dining_hall`
- `meal_period`
- unique `source_occurrence_key` where it is not null

## Normalized Ingestion Record

Future ingestion scripts should normalize source data into records with:

```txt
source_system
source_item_id
source_occurrence_key
name
normalized_name
dining_hall
meal_period
category
serving_date
station
calories
protein
carbs
fat
nutrition_status
allergens
allergen_status
dietary_tags
serving_size
source_url
fetched_at
raw_payload
```

Nutrition values may be `null` in normalized ingestion data. Missing values must
not be converted to zero. Records without enough nutrition for scoring should be
reported and later excluded from recommendation rows rather than misrepresented.

Missing allergen data is not allergen-free. Use `allergen_status = 'unknown'`
or `not_provided` when the source does not provide reliable allergen data.

## Upsert Key

Live upserts should use `source_occurrence_key`, not the UUID `id`.

Recommended key shape when source IDs exist:

```txt
source_system|serving_date|dining_hall|meal_period|station|source_item_id
```

If no stable source ID exists, use a carefully normalized fallback that includes
date, hall, meal period, station, normalized name, and serving size.

## Ingestion Lifecycle

```txt
fetch -> normalize -> validate -> report -> upsert -> deactivate stale rows
```

The mobile app must never scrape Purdue directly. Supabase remains the
app-facing structured source, and bundled local data remains the fallback.

Stale live rows should be deactivated by source/date scope. For example, after
successfully ingesting a source system and serving date, rows for that same
source/date that were not seen in the latest run should be marked inactive.

## Migration

Do not run the migration automatically from the app. Apply it deliberately in
Supabase after reviewing:

```txt
supabase/migrations/20260618000000_add_live_menu_ingestion_fields.sql
```
