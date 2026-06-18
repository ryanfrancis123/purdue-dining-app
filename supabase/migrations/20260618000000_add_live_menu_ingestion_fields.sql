-- Additive live menu ingestion fields for menu_items.
-- This migration is intentionally backward-compatible with existing seed rows.

alter table public.menu_items
  add column if not exists serving_date date,
  add column if not exists station text,
  add column if not exists source_system text,
  add column if not exists source_url text,
  add column if not exists source_item_id text,
  add column if not exists source_occurrence_key text,
  add column if not exists normalized_name text,
  add column if not exists last_fetched_at timestamptz,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists nutrition_status text,
  add column if not exists allergen_status text,
  add column if not exists raw_payload jsonb;

alter table public.menu_items
  add constraint menu_items_nutrition_status_check
    check (
      nutrition_status is null
      or nutrition_status in ('complete', 'partial', 'missing')
    ) not valid,
  add constraint menu_items_allergen_status_check
    check (
      allergen_status is null
      or allergen_status in ('provided', 'not_provided', 'unknown')
    ) not valid;

create index if not exists menu_items_is_active_idx
  on public.menu_items (is_active);

create index if not exists menu_items_serving_date_idx
  on public.menu_items (serving_date);

create index if not exists menu_items_dining_hall_idx
  on public.menu_items (dining_hall);

create index if not exists menu_items_meal_period_idx
  on public.menu_items (meal_period);

create unique index if not exists menu_items_source_occurrence_key_unique_idx
  on public.menu_items (source_occurrence_key)
  where source_occurrence_key is not null;
