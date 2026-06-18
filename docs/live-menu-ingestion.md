# Live Menu Ingestion

This project uses Purdue Dining's official structured GraphQL menu source for
read-only fixture capture and future normalization work. The endpoint is an
official Purdue source used by the public menu app, but it appears to be
undocumented and should be treated as an internal public API.

Endpoint:

```text
https://api.hfs.purdue.edu/menus/v3/GraphQL
```

Implemented read-only operations:

```text
getStartLocations
getLocationMenu($name: String!, $date: Date!)
itemByItemId($id: Guid!)
itemAppearance($id: Guid!)
```

Run a narrow dry-run fixture capture:

```bash
python scripts/fetch_purdue_menu.py --date 2026-06-18 --hall Wiley
```

The fetcher writes raw response fixtures under `data/purdue_live_fixtures/`.
It does not write to Supabase, does not authenticate, and does not parse HTML.

The fetcher uses conservative request behavior:

- `POST` requests only to the GraphQL endpoint.
- Two retries by default for timeouts and 5xx responses.
- Exponential backoff between retries.
- At least 250 ms between requests.
- No parallel request bursts.

Normalize captured fixtures:

```bash
python scripts/normalize_purdue_menu.py \
  --fixture-dir data/purdue_live_fixtures/2026-06-18_wiley \
  --output data/purdue_live_fixtures/2026-06-18_wiley/normalized_purdue_menu.json
```

Validate and report without writing anywhere:

```bash
python scripts/validate_normalized_menu.py data/purdue_live_fixtures/2026-06-18_wiley/normalized_purdue_menu.json
python scripts/report_normalized_menu.py data/purdue_live_fixtures/2026-06-18_wiley/normalized_purdue_menu.json
```

## Normalization Rules

Identity:

- `source_system` is `purdue_dining`.
- `source_item_id` is Purdue's `itemId`.
- The preferred occurrence key is
  `purdue_dining|serving_date|dining_hall|meal_period|station|itemMenuId`.
- If `itemMenuId` is absent, use
  `purdue_dining|serving_date|dining_hall|meal_period|station|itemId|normalized_name`.

Nutrition:

- Map `Calories`, `Protein`, `Total Carbohydrate`, and `Total fat`.
- Map `Serving Size` to `serving_size`.
- Missing nutrition remains `null`; it must never be converted to zero.
- `nutrition_status` is `complete`, `partial`, or `missing` based on the four
  core nutrition fields.

Allergens:

- Use traits where `type == "Allergen"`.
- Unknown allergen data is not allergen-free. When `traits` is `null`, write an
  empty allergen array and `allergen_status: "unknown"`.
- Supported source allergens are mapped to the app contract.
- Source labels that are not in the app contract, including `Gluten` and
  `Coconut`, are reported as `unsupported_source_allergens` and are not silently
  mapped to `wheat` or `tree_nut`.

Dietary preferences:

- Map only `Vegetarian` and `Vegan`.
- Do not invent `high_protein`, `halal`, `kosher`, `gluten_free`, or other
  suitability claims.

Station and category:

- Purdue station names such as `La Fonda` are preserved only in `station`.
- Station names are not recommendation categories.
- Purdue does not provide the app's `protein`, `carb`, `side`, and similar
  category taxonomy.
- Live Purdue rows use `category: null` and `category_status: "unclassified"`
  until category classification is intentionally solved.
- Unclassified live rows must not be upserted for recommendation use.

The mobile app must never call or scrape Purdue directly. The app should read
from Supabase or bundled fallback data only.
