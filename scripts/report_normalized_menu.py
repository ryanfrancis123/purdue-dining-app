import argparse
import json
import math
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JSON_PATH = PROJECT_ROOT / "data" / "normalized_menu_fixture.json"

VALID_DINING_HALLS = {
    "Wiley",
    "Windsor",
    "Ford",
    "Earhart",
    "Hillenbrand",
}

VALID_MEAL_PERIODS = {
    "breakfast",
    "lunch",
    "dinner",
    "all_day",
}

VALID_CATEGORIES = {
    "protein",
    "carb",
    "vegetable",
    "fruit",
    "side",
    "dessert",
    "drink",
    "sauce",
    "other",
}

VALID_ALLERGENS = {
    "milk",
    "egg",
    "wheat",
    "soy",
    "fish",
    "peanut",
    "tree_nut",
    "shellfish",
    "sesame",
}

VALID_DIETARY_TAGS = {
    "vegetarian",
    "vegan",
    "high_protein",
}

VALID_NUTRITION_STATUSES = {
    "complete",
    "partial",
    "missing",
}

VALID_ALLERGEN_STATUSES = {
    "provided",
    "not_provided",
    "unknown",
}

NUTRITION_FIELDS = ["calories", "protein", "carbs", "fat"]


def load_records(path: Path) -> list[dict[str, Any]] | None:
    if not path.exists():
        print(f"JSON file not found: {path}")
        return None

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        print(f"JSON parse failed: {error}")
        return None

    if not isinstance(data, list):
        print("Normalized menu JSON must contain a top-level array.")
        return None

    return [item for item in data if isinstance(item, dict)]


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and value.strip() != ""


def is_valid_date(value: Any) -> bool:
    if not is_non_empty_string(value):
        return False

    try:
        date.fromisoformat(value)
    except ValueError:
        return False

    return True


def is_valid_datetime(value: Any) -> bool:
    if not is_non_empty_string(value):
        return False

    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return False

    return True


def is_valid_number_or_missing(value: Any) -> bool:
    if value is None:
        return True

    return isinstance(value, (int, float)) and math.isfinite(value) and value >= 0


def record_errors(record: dict[str, Any]) -> list[str]:
    errors = []

    for field in [
        "source_system",
        "source_occurrence_key",
        "name",
        "normalized_name",
        "dining_hall",
        "meal_period",
        "category",
        "serving_date",
        "nutrition_status",
        "allergen_status",
        "fetched_at",
    ]:
        if not is_non_empty_string(record.get(field)):
            errors.append(field)

    if record.get("dining_hall") not in VALID_DINING_HALLS:
        errors.append("dining_hall")

    if record.get("meal_period") not in VALID_MEAL_PERIODS:
        errors.append("meal_period")

    if record.get("category") not in VALID_CATEGORIES:
        errors.append("category")

    if not is_valid_date(record.get("serving_date")):
        errors.append("serving_date")

    if not is_valid_datetime(record.get("fetched_at")):
        errors.append("fetched_at")

    nutrition_status = record.get("nutrition_status")
    if nutrition_status not in VALID_NUTRITION_STATUSES:
        errors.append("nutrition_status")

    if record.get("allergen_status") not in VALID_ALLERGEN_STATUSES:
        errors.append("allergen_status")

    for field in NUTRITION_FIELDS:
        if not is_valid_number_or_missing(record.get(field)):
            errors.append(field)

    if nutrition_status == "complete" and any(record.get(field) is None for field in NUTRITION_FIELDS):
        errors.append("complete_nutrition_missing_values")

    if nutrition_status == "missing" and any(record.get(field) is not None for field in NUTRITION_FIELDS):
        errors.append("missing_nutrition_has_values")

    if not isinstance(record.get("allergens"), list):
        errors.append("allergens")

    if not isinstance(record.get("dietary_tags"), list):
        errors.append("dietary_tags")

    return errors


def print_counter(title: str, counter: Counter[str]) -> None:
    print(f"\n{title}")
    if not counter:
        print("- none")
        return

    for key, count in sorted(counter.items()):
        print(f"- {key}: {count}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Report normalized menu ingestion JSON without writing anywhere."
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=str(DEFAULT_JSON_PATH),
        help="Path to normalized menu JSON.",
    )
    args = parser.parse_args()

    records = load_records(Path(args.path))
    if records is None:
        return 1

    date_counts: Counter[str] = Counter()
    hall_counts: Counter[str] = Counter()
    meal_period_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    nutrition_status_counts: Counter[str] = Counter()
    allergen_status_counts: Counter[str] = Counter()
    unknown_allergens: Counter[str] = Counter()
    unknown_tags: Counter[str] = Counter()
    source_occurrence_keys: dict[str, list[int]] = defaultdict(list)

    invalid_indexes: set[int] = set()

    for index, record in enumerate(records, start=1):
        if record_errors(record):
            invalid_indexes.add(index)

        date_counts[str(record.get("serving_date", ""))] += 1
        hall_counts[str(record.get("dining_hall", ""))] += 1
        meal_period_counts[str(record.get("meal_period", ""))] += 1
        category_counts[str(record.get("category", ""))] += 1
        nutrition_status_counts[str(record.get("nutrition_status", ""))] += 1
        allergen_status_counts[str(record.get("allergen_status", ""))] += 1

        for allergen in record.get("allergens", []):
            if not isinstance(allergen, str) or allergen not in VALID_ALLERGENS:
                unknown_allergens[str(allergen)] += 1

        for tag in record.get("dietary_tags", []):
            if not isinstance(tag, str) or tag not in VALID_DIETARY_TAGS:
                unknown_tags[str(tag)] += 1

        source_occurrence_key = record.get("source_occurrence_key")
        if is_non_empty_string(source_occurrence_key):
            source_occurrence_keys[source_occurrence_key].append(index)

    duplicates = {
        key: indexes
        for key, indexes in source_occurrence_keys.items()
        if len(indexes) > 1
    }

    for indexes in duplicates.values():
        invalid_indexes.update(indexes)

    invalid_count = len(invalid_indexes)
    valid_count = len(records) - invalid_count

    print("Normalized Menu Report")
    print("======================")
    print(f"Total records: {len(records)}")
    print(f"Valid records: {valid_count}")
    print(f"Invalid records: {invalid_count}")

    print_counter("Counts by date:", date_counts)
    print_counter("Counts by dining hall:", hall_counts)
    print_counter("Counts by meal period:", meal_period_counts)
    print_counter("Counts by category:", category_counts)
    print_counter("Nutrition status coverage:", nutrition_status_counts)
    print_counter("Allergen status coverage:", allergen_status_counts)
    print_counter("Unknown allergens:", unknown_allergens)
    print_counter("Unknown dietary tags:", unknown_tags)

    print("\nDuplicate source_occurrence_key values:")
    if not duplicates:
        print("- none")
    else:
        for key, indexes in sorted(duplicates.items()):
            print(f"- records {indexes}: {key}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
