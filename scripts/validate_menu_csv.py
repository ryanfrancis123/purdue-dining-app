import csv
import math
import re
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = PROJECT_ROOT / "data" / "menu_items_seed.csv"


REQUIRED_COLUMNS = {
    "name",
    "dining_hall",
    "meal_period",
    "category",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "allergens",
    "dietary_tags",
    "serving_size",
    "source",
    "is_active",
}


VALID_DINING_HALLS = {
    "Earhart",
    "Ford",
    "Hillenbrand",
    "Wiley",
    "Windsor",
}


VALID_MEAL_PERIODS = {
    "all_day",
    "breakfast",
    "dinner",
    "lunch",
}


VALID_CATEGORIES = {
    "carb",
    "dessert",
    "drink",
    "fruit",
    "other",
    "protein",
    "sauce",
    "side",
    "vegetable",
}


VALID_ALLERGENS = {
    "egg",
    "fish",
    "milk",
    "peanut",
    "sesame",
    "shellfish",
    "soy",
    "tree_nut",
    "wheat",
}


VALID_DIETARY_TAGS = {
    "high_protein",
    "vegan",
    "vegetarian",
}


VALID_SOURCES = {
    "csv_seed",
    "manual",
    "purdue_menu",
}


SUSPICIOUS_LIMITS = {
    "calories": 1500,
    "protein_g": 120,
    "carbs_g": 250,
    "fat_g": 100,
}


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def normalize_record_key(row: dict[str, str]) -> tuple[str, str, str, str, str]:
    return (
        normalize_text(row["name"]),
        row["dining_hall"].strip(),
        row["meal_period"].strip().lower(),
        row["category"].strip().lower(),
        normalize_text(row["serving_size"]),
    )


def parse_number(value: str, column_name: str, row_number: int) -> float | None:
    value = value.strip()

    if value == "":
        print(f"Row {row_number}: {column_name} is empty.")
        return None

    try:
        number = float(value)
    except ValueError:
        print(f"Row {row_number}: {column_name} must be a number. Found: {value}")
        return None

    if not math.isfinite(number):
        print(f"Row {row_number}: {column_name} must be finite. Found: {value}")
        return None

    if number < 0:
        print(f"Row {row_number}: {column_name} cannot be negative. Found: {value}")
        return None

    return number


def parse_postgres_array_field(
    value: str,
    column_name: str,
    row_number: int,
) -> list[str] | None:
    value = value.strip()

    if value == "":
        print(f"Row {row_number}: {column_name} is empty. Use {{}} for an empty array.")
        return None

    if value == "{}":
        return []

    if not value.startswith("{") or not value.endswith("}"):
        print(
            f"Row {row_number}: {column_name} must use PostgreSQL array format. "
            f'Example: {{"vegetarian","vegan"}} or {{}}'
        )
        return None

    inner_value = value[1:-1].strip()

    if inner_value == "":
        return []

    items = []
    current = ""
    in_quotes = False
    index = 0

    while index < len(inner_value):
        char = inner_value[index]

        if char == '"':
            in_quotes = not in_quotes
            current += char
        elif char == "," and not in_quotes:
            items.append(current)
            current = ""
        else:
            current += char

        index += 1

    if in_quotes:
        print(f"Row {row_number}: {column_name} contains an unterminated quote.")
        return None

    items.append(current)
    cleaned_items = []

    for raw_item in items:
        item = raw_item.strip()

        if not item.startswith('"') or not item.endswith('"'):
            print(
                f"Row {row_number}: each value in {column_name} must be wrapped in quotes. "
                f"Found: {item}"
            )
            return None

        cleaned_item = item[1:-1].strip().lower()

        if cleaned_item == "":
            print(f"Row {row_number}: {column_name} contains an empty value.")
            return None

        cleaned_items.append(cleaned_item)

    return cleaned_items


def validate_csv() -> bool:
    if not CSV_PATH.exists():
        print(f"CSV file not found: {CSV_PATH}")
        return False

    has_errors = False
    warning_count = 0
    normalized_records: dict[tuple[str, str, str, str, str], int] = {}

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        if reader.fieldnames is None:
            print("CSV file has no header row.")
            return False

        actual_columns = set(reader.fieldnames)
        missing_columns = REQUIRED_COLUMNS - actual_columns

        if missing_columns:
            print("Missing required columns:")
            for column in sorted(missing_columns):
                print(f"- {column}")
            return False

        for row_number, row in enumerate(reader, start=2):
            name = row["name"].strip()
            dining_hall = row["dining_hall"].strip()
            meal_period = row["meal_period"].strip().lower()
            category = row["category"].strip().lower()
            source = row["source"].strip().lower()
            is_active = row["is_active"].strip().lower()

            if name == "":
                print(f"Row {row_number}: name is empty.")
                has_errors = True

            if dining_hall not in VALID_DINING_HALLS:
                print(
                    f"Row {row_number}: invalid dining_hall '{dining_hall}'. "
                    f"Allowed: {sorted(VALID_DINING_HALLS)}"
                )
                has_errors = True

            if meal_period not in VALID_MEAL_PERIODS:
                print(
                    f"Row {row_number}: invalid meal_period '{meal_period}'. "
                    f"Allowed: {sorted(VALID_MEAL_PERIODS)}"
                )
                has_errors = True

            if category not in VALID_CATEGORIES:
                print(
                    f"Row {row_number}: invalid category '{category}'. "
                    f"Allowed: {sorted(VALID_CATEGORIES)}"
                )
                has_errors = True

            if is_active not in {"true", "false"}:
                print(
                    f"Row {row_number}: is_active must be true or false. "
                    f"Found: {is_active}"
                )
                has_errors = True

            if source not in VALID_SOURCES:
                print(
                    f"Row {row_number}: invalid source '{source}'. "
                    f"Allowed: {sorted(VALID_SOURCES)}"
                )
                has_errors = True

            for numeric_column in ["calories", "protein_g", "carbs_g", "fat_g"]:
                number = parse_number(row[numeric_column], numeric_column, row_number)
                if number is None:
                    has_errors = True
                    continue

                suspicious_limit = SUSPICIOUS_LIMITS[numeric_column]
                if number > suspicious_limit:
                    warning_count += 1
                    print(
                        f"Warning row {row_number}: {numeric_column} is unusually high "
                        f"({number:g} > {suspicious_limit})."
                    )

            allergens = parse_postgres_array_field(row["allergens"], "allergens", row_number)
            dietary_tags = parse_postgres_array_field(row["dietary_tags"], "dietary_tags", row_number)

            if allergens is None:
                has_errors = True
            else:
                if len(allergens) != len(set(allergens)):
                    print(f"Row {row_number}: duplicate allergen found in allergens field.")
                    has_errors = True

                invalid_allergens = sorted(set(allergens) - VALID_ALLERGENS)
                if invalid_allergens:
                    print(
                        f"Row {row_number}: unsupported allergens {invalid_allergens}. "
                        f"Allowed: {sorted(VALID_ALLERGENS)}"
                    )
                    has_errors = True

            if dietary_tags is None:
                has_errors = True
            else:
                if len(dietary_tags) != len(set(dietary_tags)):
                    print(f"Row {row_number}: duplicate dietary tag found in dietary_tags field.")
                    has_errors = True

                invalid_dietary_tags = sorted(set(dietary_tags) - VALID_DIETARY_TAGS)
                if invalid_dietary_tags:
                    print(
                        f"Row {row_number}: unsupported dietary_tags {invalid_dietary_tags}. "
                        f"Allowed: {sorted(VALID_DIETARY_TAGS)}"
                    )
                    has_errors = True

            normalized_key = normalize_record_key(row)
            first_seen_row = normalized_records.get(normalized_key)

            if first_seen_row is not None:
                print(
                    f"Row {row_number}: duplicate normalized record. "
                    f"First seen on row {first_seen_row}."
                )
                has_errors = True
            else:
                normalized_records[normalized_key] = row_number

    if has_errors:
        print("\nCSV validation failed.")
        return False

    if warning_count > 0:
        print(f"\nCSV validation passed with {warning_count} warning(s).")
    else:
        print("CSV validation passed.")

    return True


if __name__ == "__main__":
    success = validate_csv()
    sys.exit(0 if success else 1)
