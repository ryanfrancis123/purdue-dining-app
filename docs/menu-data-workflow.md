# Menu Data Workflow

This document explains the current seed data workflow for the Purdue Dining App.

## Current Source Of Truth

The manually maintained seed menu data lives in:

```txt
data/menu_items_seed.csv
```

This CSV is the source of truth for seed rows that are imported into Supabase.
The app still keeps local fallback data bundled in the Expo app so the MVP can
remain operational if Supabase is unavailable or returns no active rows.

## Validation

Before importing the CSV into Supabase, validate it from the Expo app folder:

```bash
cd C:\Projects\PurdueDiningApp\app
npm run validate:menu
```

Expected output:

```txt
CSV validation passed.
```

Validation fails on malformed or unsupported data. It may also print warnings
for suspiciously high nutrition values. Warnings should be reviewed before
import, but they do not automatically fail validation.

Do not import the CSV into Supabase unless validation passes.

## Data Report

After validation, generate a report:

```bash
cd C:\Projects\PurdueDiningApp\app
npm run report:menu
```

The report shows:

```txt
Total rows
Dining hall counts
Meal period counts
Category counts
Source counts
Allergen coverage
Dietary tag coverage
Duplicate normalized records
Suspicious nutrition values
Meal period balance status
Category balance status
```

Use the report to check coverage across dining halls, meal periods, categories,
allergens, and dietary tags before importing data.

## CSV Format Rules

The CSV must include these columns:

```txt
name
dining_hall
meal_period
category
calories
protein_g
carbs_g
fat_g
allergens
dietary_tags
serving_size
source
is_active
```

The CSV should not include the `id` column. The current Supabase table generates
`id` with PostgreSQL.

## Supported Values

Supported imported dining halls:

```txt
Wiley
Windsor
Ford
Earhart
Hillenbrand
```

`Unknown` exists only as an internal app fallback value. Do not use it as a
normal imported dining hall.

Supported meal periods:

```txt
breakfast
lunch
dinner
all_day
```

Supported categories:

```txt
protein
carb
vegetable
fruit
side
dessert
drink
sauce
other
```

Supported allergens:

```txt
milk
egg
wheat
soy
fish
peanut
tree_nut
shellfish
sesame
```

Supported dietary tags:

```txt
vegetarian
vegan
high_protein
```

Use `high_protein`, not `high-protein`.

Allowed sources:

```txt
csv_seed
manual
purdue_menu
```

## Missing Data Rules

Missing nutrition values must never be converted to zero. Zero is a real
nutrition value and should only be used when the source explicitly says the
value is zero.

Missing allergen data does not mean allergen-free. Use an empty allergen array
only when the source provides listed allergen data and no supported allergens
are listed for that item.

The app should avoid unsupported dietary or medical claims. Dietary tags are
simple source-backed labels, not guarantees.

## PostgreSQL Array Fields

The `allergens` and `dietary_tags` columns use PostgreSQL array format.

Empty array:

```csv
{}
```

One value:

```csv
"{""milk""}"
```

Multiple values:

```csv
"{""vegetarian"",""vegan""}"
```

This quoting is required because commas inside arrays would otherwise break the
CSV column structure.

## Duplicate Records

Validation checks duplicate normalized records using:

```txt
name
dining_hall
meal_period
category
serving_size
```

This is a seed-data safeguard. Live ingestion will need a stronger source
occurrence key that includes serving date, station, and source identifiers.

## Normalized Live Ingestion Dry Run

Future live ingestion should first normalize source data into JSON records before
any database writes. A fixture for dry-run validation lives in:

```txt
data/normalized_menu_fixture.json
```

Validate normalized records without writing anywhere:

```bash
cd C:\Projects\PurdueDiningApp
python scripts\validate_normalized_menu.py
```

Generate a normalized ingestion report:

```bash
python scripts\report_normalized_menu.py
```

Normalized records include:

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

Nutrition values may be missing in normalized ingestion data. Do not replace
missing values with zero. Incomplete records should be reported honestly, and
records without enough nutrition for scoring should later be excluded from
recommendation rows rather than misrepresented.

Live upserts should use `source_occurrence_key`. The UUID `id` remains the table
primary key, but it is not a stable source key.

## Live Ingestion Lifecycle

Live ingestion should follow this lifecycle:

```txt
fetch -> normalize -> validate -> report -> upsert -> deactivate stale rows
```

The mobile app must never scrape Purdue directly. The app reads structured data
from Supabase first and local bundled fallback data second.

Saved meal snapshots and meal logs remain unchanged if live menu rows later
change because saved records store their own item snapshots.

Stale live rows should be deactivated by source/date scope. After a successful
ingestion run for a source and serving date, active rows for that same scope that
were not seen in the latest run should be marked inactive.

## Clean Reseed Workflow

When updating seed data, do not blindly append rows in Supabase.

Use this workflow:

1. Edit `data/menu_items_seed.csv`.
2. Run validation:

```bash
cd C:\Projects\PurdueDiningApp\app
npm run validate:menu
```

3. Run the data report:

```bash
npm run report:menu
```

4. If validation passes and warnings have been reviewed, commit the CSV change.
5. In Supabase SQL Editor, check how many seed rows currently exist:

```sql
select count(*)
from menu_items
where source = 'csv_seed';
```

6. Delete only seed rows:

```sql
delete from menu_items
where source = 'csv_seed';
```

7. Import the full updated CSV into the `menu_items` table.
8. Confirm the new row count.
9. Test the app through Expo Go.

## Current State

The CSV currently contains 36 validated `csv_seed` rows.

The app loads active rows from Supabase first and falls back to local sample data
only if Supabase fails or returns no active rows.
