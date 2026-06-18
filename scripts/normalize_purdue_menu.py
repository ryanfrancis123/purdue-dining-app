import argparse
import json
import math
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FIXTURE_DIR = PROJECT_ROOT / "data" / "purdue_live_fixtures" / "2026-06-18_wiley"
DEFAULT_OUTPUT_PATH = DEFAULT_FIXTURE_DIR / "normalized_purdue_menu.json"

SOURCE_SYSTEM = "purdue_dining"
SOURCE_ITEM_URL = "https://dining.purdue.edu/menus/item/{item_id}"

NUTRITION_NAME_MAP = {
    "Calories": "calories",
    "Protein": "protein",
    "Total Carbohydrate": "carbs",
    "Total fat": "fat",
}

SUPPORTED_ALLERGENS = {
    "Eggs": "egg",
    "Fish": "fish",
    "Milk": "milk",
    "Peanuts": "peanut",
    "Sesame": "sesame",
    "Shellfish": "shellfish",
    "Soy": "soy",
    "Tree Nuts": "tree_nut",
    "Wheat": "wheat",
}

SUPPORTED_DIETARY_TAGS = {
    "Vegetarian": "vegetarian",
    "Vegan": "vegan",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize Purdue Dining GraphQL fixtures into Module 19 JSON."
    )
    parser.add_argument(
        "--fixture-dir",
        type=Path,
        default=DEFAULT_FIXTURE_DIR,
        help="Directory containing Part 2A Purdue raw fixtures.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path for normalized JSON output.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        normalized_records = normalize_fixture_dir(args.fixture_dir)
    except FileNotFoundError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1
    except ValueError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(normalized_records, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    summary = summarize_records(normalized_records)
    summary["output"] = str(args.output)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


def normalize_fixture_dir(fixture_dir: Path) -> list[dict[str, Any]]:
    daily_menu_paths = sorted(fixture_dir.glob("daily_menu_*.json"))
    if not daily_menu_paths:
        raise FileNotFoundError(f"No daily_menu_*.json files found in {fixture_dir}")

    item_details_path = fixture_dir / "item_details_by_item_id.json"
    occurrence_details_path = fixture_dir / "occurrence_details_by_item_menu_id.json"

    item_detail_responses = load_json_object(item_details_path)
    occurrence_detail_responses = (
        load_json_object(occurrence_details_path)
        if occurrence_details_path.exists()
        else {}
    )

    fetched_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    records: list[dict[str, Any]] = []

    for daily_menu_path in daily_menu_paths:
        daily_menu_response = load_json_object(daily_menu_path)
        records.extend(
            normalize_daily_menu(
                daily_menu_response=daily_menu_response,
                item_detail_responses=item_detail_responses,
                occurrence_detail_responses=occurrence_detail_responses,
                fetched_at=fetched_at,
            )
        )

    return records


def normalize_daily_menu(
    daily_menu_response: dict[str, Any],
    item_detail_responses: dict[str, Any],
    occurrence_detail_responses: dict[str, Any],
    fetched_at: str,
) -> list[dict[str, Any]]:
    dining_court = daily_menu_response.get("data", {}).get("diningCourtByName")
    if not isinstance(dining_court, dict):
        raise ValueError("Daily menu fixture does not contain data.diningCourtByName.")

    dining_hall = dining_court.get("name")
    daily_menu = dining_court.get("dailyMenu") or {}
    records: list[dict[str, Any]] = []

    for meal in daily_menu.get("meals") or []:
        meal_period = normalize_label(meal.get("name"))
        serving_date = iso_date(meal.get("startTime"))

        for station in meal.get("stations") or []:
            station_name = station.get("name")

            for occurrence in station.get("items") or []:
                if occurrence.get("hasComponents") and occurrence.get("itemMenuId"):
                    component_records = normalize_component_occurrence(
                        parent_occurrence=occurrence,
                        occurrence_detail_response=occurrence_detail_responses.get(
                            occurrence["itemMenuId"]
                        ),
                        item_detail_responses=item_detail_responses,
                        dining_hall=dining_hall,
                        meal_period=meal_period,
                        serving_date=serving_date,
                        station_name=station_name,
                        fetched_at=fetched_at,
                    )
                    if component_records:
                        records.extend(component_records)
                        continue

                item = occurrence.get("item") or {}
                item_id = item.get("itemId")
                item_detail = item_from_detail_response(item_detail_responses.get(item_id))
                records.append(
                    build_record(
                        item=item_detail or item,
                        occurrence=occurrence,
                        dining_hall=dining_hall,
                        meal_period=meal_period,
                        serving_date=serving_date,
                        station_name=station_name,
                        fetched_at=fetched_at,
                        parent_item_menu_id=None,
                    )
                )

    return records


def normalize_component_occurrence(
    parent_occurrence: dict[str, Any],
    occurrence_detail_response: dict[str, Any] | None,
    item_detail_responses: dict[str, Any],
    dining_hall: str,
    meal_period: str,
    serving_date: str,
    station_name: str,
    fetched_at: str,
) -> list[dict[str, Any]]:
    detail = item_appearance_from_response(occurrence_detail_response)
    if not detail:
        return []

    records = []
    for component in detail.get("components") or []:
        component_item = (component.get("item") or {}).copy()
        item_id = component_item.get("itemId")
        detailed_item = item_from_detail_response(item_detail_responses.get(item_id))
        if detailed_item:
            component_item.update(detailed_item)

        records.append(
            build_record(
                item=component_item,
                occurrence=component,
                dining_hall=dining_hall,
                meal_period=meal_period,
                serving_date=serving_date,
                station_name=station_name,
                fetched_at=fetched_at,
                parent_item_menu_id=parent_occurrence.get("itemMenuId"),
            )
        )

    return records


def build_record(
    item: dict[str, Any],
    occurrence: dict[str, Any],
    dining_hall: str,
    meal_period: str,
    serving_date: str,
    station_name: str,
    fetched_at: str,
    parent_item_menu_id: str | None,
) -> dict[str, Any]:
    item_id = item.get("itemId")
    item_menu_id = occurrence.get("itemMenuId")
    name = occurrence.get("specialName") or item.get("name")
    normalized_name = normalize_name(name)
    nutrition = map_nutrition(item.get("nutritionFacts"))
    traits = item.get("traits")
    trait_mapping = map_traits(traits)
    occurrence_key = build_occurrence_key(
        serving_date=serving_date,
        dining_hall=dining_hall,
        meal_period=meal_period,
        station_name=station_name,
        item_menu_id=item_menu_id,
        item_id=item_id,
        normalized_name=normalized_name,
    )
    exclusion_reasons = get_exclusion_reasons(
        category_status="unclassified",
        nutrition_status=nutrition["nutrition_status"],
        allergen_status=trait_mapping["allergen_status"],
    )

    return {
        "source_system": SOURCE_SYSTEM,
        "source_item_id": item_id,
        "source_occurrence_key": occurrence_key,
        "name": name,
        "normalized_name": normalized_name,
        "dining_hall": dining_hall,
        "meal_period": meal_period,
        "category": None,
        "category_status": "unclassified",
        "serving_date": serving_date,
        "station": station_name,
        "calories": nutrition["calories"],
        "protein": nutrition["protein"],
        "carbs": nutrition["carbs"],
        "fat": nutrition["fat"],
        "nutrition_status": nutrition["nutrition_status"],
        "allergens": trait_mapping["allergens"],
        "allergen_status": trait_mapping["allergen_status"],
        "unsupported_source_allergens": trait_mapping["unsupported_source_allergens"],
        "dietary_tags": trait_mapping["dietary_tags"],
        "serving_size": nutrition["serving_size"],
        "source_url": SOURCE_ITEM_URL.format(item_id=item_id) if item_id else None,
        "fetched_at": fetched_at,
        "recommendation_eligible": len(exclusion_reasons) == 0,
        "exclusion_reasons": exclusion_reasons,
        "raw_payload": compact_raw_payload(
            item=item,
            occurrence=occurrence,
            parent_item_menu_id=parent_item_menu_id,
        ),
    }


def map_nutrition(nutrition_facts: Any) -> dict[str, Any]:
    mapped: dict[str, Any] = {
        "calories": None,
        "protein": None,
        "carbs": None,
        "fat": None,
        "serving_size": None,
    }

    if not isinstance(nutrition_facts, list):
        mapped["nutrition_status"] = "missing"
        return mapped

    for fact in nutrition_facts:
        if not isinstance(fact, dict):
            continue

        name = fact.get("name")
        if name == "Serving Size":
            label = fact.get("label")
            mapped["serving_size"] = label if isinstance(label, str) and label else None
            continue

        target = NUTRITION_NAME_MAP.get(str(name))
        if target is None:
            continue

        value = fact.get("value")
        if isinstance(value, (int, float)) and math.isfinite(value) and value >= 0:
            mapped[target] = value

    present_count = sum(mapped[field] is not None for field in NUTRITION_NAME_MAP.values())
    if present_count == 4:
        mapped["nutrition_status"] = "complete"
    elif present_count > 0:
        mapped["nutrition_status"] = "partial"
    else:
        mapped["nutrition_status"] = "missing"

    return mapped


def map_traits(traits: Any) -> dict[str, Any]:
    if traits is None:
        return {
            "allergens": [],
            "allergen_status": "unknown",
            "unsupported_source_allergens": [],
            "dietary_tags": [],
        }

    allergens: set[str] = set()
    unsupported_source_allergens: set[str] = set()
    dietary_tags: set[str] = set()

    if not isinstance(traits, list):
        traits = []

    for trait in traits:
        if not isinstance(trait, dict):
            continue

        name = trait.get("name")
        trait_type = trait.get("type")

        if trait_type == "Allergen":
            mapped = SUPPORTED_ALLERGENS.get(str(name))
            if mapped:
                allergens.add(mapped)
            elif name:
                unsupported_source_allergens.add(str(name))

        if trait_type == "Preference":
            mapped = SUPPORTED_DIETARY_TAGS.get(str(name))
            if mapped:
                dietary_tags.add(mapped)

    return {
        "allergens": sorted(allergens),
        "allergen_status": "provided",
        "unsupported_source_allergens": sorted(unsupported_source_allergens),
        "dietary_tags": sorted(dietary_tags),
    }


def get_exclusion_reasons(
    category_status: str,
    nutrition_status: str,
    allergen_status: str,
) -> list[str]:
    reasons = []
    if category_status == "unclassified":
        reasons.append("category_unclassified")
    if nutrition_status != "complete":
        reasons.append(f"nutrition_{nutrition_status}")
    if allergen_status == "unknown":
        reasons.append("allergens_unknown")
    return reasons


def compact_raw_payload(
    item: dict[str, Any],
    occurrence: dict[str, Any],
    parent_item_menu_id: str | None,
) -> dict[str, Any]:
    return {
        "itemId": item.get("itemId"),
        "itemMenuId": occurrence.get("itemMenuId"),
        "parentItemMenuId": parent_item_menu_id,
        "hasComponents": occurrence.get("hasComponents"),
        "isNutritionReady": item.get("isNutritionReady"),
        "traitNames": [
            trait.get("name")
            for trait in item.get("traits") or []
            if isinstance(trait, dict)
        ],
        "nutritionFactNames": [
            fact.get("name")
            for fact in item.get("nutritionFacts") or []
            if isinstance(fact, dict)
        ],
    }


def summarize_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    by_scope: Counter[str] = Counter()
    unsupported_allergens: Counter[str] = Counter()
    dietary_tags: Counter[str] = Counter()
    exclusion_reasons: Counter[str] = Counter()
    occurrence_keys: defaultdict[str, list[int]] = defaultdict(list)

    for index, record in enumerate(records, start=1):
        scope = "|".join(
            [
                str(record.get("dining_hall")),
                str(record.get("serving_date")),
                str(record.get("meal_period")),
                str(record.get("station")),
            ]
        )
        by_scope[scope] += 1
        unsupported_allergens.update(record.get("unsupported_source_allergens", []))
        dietary_tags.update(record.get("dietary_tags", []))
        exclusion_reasons.update(record.get("exclusion_reasons", []))
        occurrence_keys[str(record.get("source_occurrence_key"))].append(index)

    duplicates = {
        key: indexes
        for key, indexes in occurrence_keys.items()
        if key and len(indexes) > 1
    }

    return {
        "total_records": len(records),
        "records_by_hall_date_meal_station": dict(sorted(by_scope.items())),
        "nutrition_status": dict(Counter(record["nutrition_status"] for record in records)),
        "allergen_status": dict(Counter(record["allergen_status"] for record in records)),
        "unsupported_source_allergens": dict(sorted(unsupported_allergens.items())),
        "dietary_tag_counts": dict(sorted(dietary_tags.items())),
        "category_status": dict(Counter(record["category_status"] for record in records)),
        "unclassified_category_count": sum(
            1 for record in records if record.get("category_status") == "unclassified"
        ),
        "recommendation_eligible_records": sum(
            1 for record in records if record.get("recommendation_eligible") is True
        ),
        "recommendation_excluded_records": sum(
            1 for record in records if record.get("recommendation_eligible") is not True
        ),
        "exclusion_reasons": dict(sorted(exclusion_reasons.items())),
        "duplicate_occurrence_keys": duplicates,
    }


def item_from_detail_response(response: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(response, dict):
        return None
    item = response.get("data", {}).get("itemByItemId")
    return item if isinstance(item, dict) else None


def item_appearance_from_response(response: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(response, dict):
        return None
    item_appearance = response.get("data", {}).get("itemAppearance")
    return item_appearance if isinstance(item_appearance, dict) else None


def load_json_object(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Required fixture file not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    return payload


def build_occurrence_key(
    serving_date: str,
    dining_hall: str,
    meal_period: str,
    station_name: str,
    item_menu_id: str | None,
    item_id: str | None,
    normalized_name: str,
) -> str:
    parts = [
        SOURCE_SYSTEM,
        serving_date,
        key_part(dining_hall),
        key_part(meal_period),
        key_part(station_name),
    ]

    if item_menu_id:
        parts.append(item_menu_id)
    else:
        parts.extend([item_id or "missing_item_id", key_part(normalized_name)])

    return "|".join(parts)


def normalize_name(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def normalize_label(value: Any) -> str:
    return key_part(str(value or "").strip().lower())


def key_part(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[^a-z0-9._:-]+", "_", text)
    return text.strip("_") or "unknown"


def iso_date(value: Any) -> str:
    if not isinstance(value, str) or not value:
        return ""

    return value[:10]


if __name__ == "__main__":
    raise SystemExit(main())
