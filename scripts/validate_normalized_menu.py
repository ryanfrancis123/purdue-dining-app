import argparse
import json
import math
import re
import sys
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

VALID_CATEGORY_STATUSES = {
    "classified",
    "unclassified",
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

REQUIRED_STRING_FIELDS = [
    "source_system",
    "source_occurrence_key",
    "name",
    "normalized_name",
    "dining_hall",
    "meal_period",
    "serving_date",
    "nutrition_status",
    "allergen_status",
    "fetched_at",
]

OPTIONAL_STRING_FIELDS = [
    "source_item_id",
    "category",
    "category_status",
    "station",
    "serving_size",
    "source_url",
]

NUTRITION_FIELDS = [
    "calories",
    "protein",
    "carbs",
    "fat",
]

SOURCE_OCCURRENCE_KEY_PATTERN = re.compile(r"^[A-Za-z0-9._|:-]+$")


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and value.strip() != ""


def is_valid_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
    except ValueError:
        return False

    return True


def is_valid_datetime(value: str) -> bool:
    normalized_value = value.replace("Z", "+00:00")

    try:
        datetime.fromisoformat(normalized_value)
    except ValueError:
        return False

    return True


def is_valid_number_or_missing(value: Any) -> bool:
    if value is None:
        return True

    return isinstance(value, (int, float)) and math.isfinite(value) and value >= 0


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

    records = []

    for index, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            print(f"Record {index}: must be an object.")
            return None

        records.append(item)

    return records


def validate_record(record: dict[str, Any], index: int) -> list[str]:
    errors = []

    for field in REQUIRED_STRING_FIELDS:
        if not is_non_empty_string(record.get(field)):
            errors.append(f"{field} must be a non-empty string")

    for field in OPTIONAL_STRING_FIELDS:
        value = record.get(field)
        if value is not None and not isinstance(value, str):
            errors.append(f"{field} must be a string or null")

    source_occurrence_key = record.get("source_occurrence_key")
    if is_non_empty_string(source_occurrence_key) and not SOURCE_OCCURRENCE_KEY_PATTERN.match(
        source_occurrence_key
    ):
        errors.append("source_occurrence_key contains unsupported characters")

    serving_date = record.get("serving_date")
    if is_non_empty_string(serving_date) and not is_valid_date(serving_date):
        errors.append("serving_date must be YYYY-MM-DD")

    fetched_at = record.get("fetched_at")
    if is_non_empty_string(fetched_at) and not is_valid_datetime(fetched_at):
        errors.append("fetched_at must be an ISO datetime")

    if record.get("dining_hall") not in VALID_DINING_HALLS:
        errors.append("dining_hall is not supported")

    if record.get("meal_period") not in VALID_MEAL_PERIODS:
        errors.append("meal_period is not supported")

    category = record.get("category")
    category_status = record.get("category_status", "classified")

    if category_status not in VALID_CATEGORY_STATUSES:
        errors.append("category_status is not supported")

    if category_status == "classified" and category not in VALID_CATEGORIES:
        errors.append("category is not supported")

    if category_status == "unclassified" and category is not None:
        errors.append("unclassified records must use category null")

    nutrition_status = record.get("nutrition_status")
    if nutrition_status not in VALID_NUTRITION_STATUSES:
        errors.append("nutrition_status is not supported")

    allergen_status = record.get("allergen_status")
    if allergen_status not in VALID_ALLERGEN_STATUSES:
        errors.append("allergen_status is not supported")

    for field in NUTRITION_FIELDS:
        if not is_valid_number_or_missing(record.get(field)):
            errors.append(f"{field} must be finite, non-negative, or null")

    if nutrition_status == "complete" and any(record.get(field) is None for field in NUTRITION_FIELDS):
        errors.append("complete nutrition records must include all nutrition values")

    if nutrition_status == "missing" and any(record.get(field) is not None for field in NUTRITION_FIELDS):
        errors.append("missing nutrition records should not include nutrition values")

    allergens = record.get("allergens")
    if not isinstance(allergens, list):
        errors.append("allergens must be an array")
    else:
        invalid_allergens = sorted(
            {item for item in allergens if not isinstance(item, str) or item not in VALID_ALLERGENS}
        )
        if invalid_allergens:
            errors.append(f"allergens contains unsupported values: {invalid_allergens}")

    dietary_tags = record.get("dietary_tags")
    if not isinstance(dietary_tags, list):
        errors.append("dietary_tags must be an array")
    else:
        invalid_tags = sorted(
            {item for item in dietary_tags if not isinstance(item, str) or item not in VALID_DIETARY_TAGS}
        )
        if invalid_tags:
            errors.append(f"dietary_tags contains unsupported values: {invalid_tags}")

    raw_payload = record.get("raw_payload")
    if raw_payload is not None and not isinstance(raw_payload, dict):
        errors.append("raw_payload must be an object or null")

    if errors:
        print(f"Record {index}: invalid")
        for error in errors:
            print(f"- {error}")

    return errors


def validate_records(records: list[dict[str, Any]]) -> bool:
    has_errors = False
    occurrence_key_rows: dict[str, int] = {}

    for index, record in enumerate(records, start=1):
        errors = validate_record(record, index)

        if errors:
            has_errors = True

        source_occurrence_key = record.get("source_occurrence_key")
        if is_non_empty_string(source_occurrence_key):
            first_seen_index = occurrence_key_rows.get(source_occurrence_key)
            if first_seen_index is not None:
                print(
                    f"Record {index}: duplicate source_occurrence_key "
                    f"(first seen in record {first_seen_index})."
                )
                has_errors = True
            else:
                occurrence_key_rows[source_occurrence_key] = index

    if has_errors:
        print("\nNormalized menu validation failed.")
        return False

    print("Normalized menu validation passed.")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate normalized menu ingestion JSON without writing anywhere."
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

    return 0 if validate_records(records) else 1


if __name__ == "__main__":
    sys.exit(main())
