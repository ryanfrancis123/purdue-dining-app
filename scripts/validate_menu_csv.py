import csv
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


VALID_MEAL_PERIODS = {
    "breakfast",
    "lunch",
    "dinner",
}


VALID_DINING_HALLS = {
    "earhart",
    "ford",
    "hillenbrand",
    "wiley",
    "windsor",
}


VALID_CATEGORIES = {
    "protein",
    "carb",
    "side",
    "vegetable",
    "fruit",
    "dessert",
    "drink",
}


VALID_SOURCES = {
    "csv_seed",
    "manual",
    "purdue_menu",
}


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

    if number < 0:
        print(f"Row {row_number}: {column_name} cannot be negative. Found: {value}")
        return None

    return number


def parse_postgres_array_field(value: str, column_name: str, row_number: int) -> list[str] | None:
    value = value.strip()

    if value == "":
        print(f"Row {row_number}: {column_name} is empty. Use {{}} for an empty array.")
        return None

    if value == "{}":
        return []

    if not value.startswith("{") or not value.endswith("}"):
        print(
            f"Row {row_number}: {column_name} must use PostgreSQL array format. "
            f"Example: {{\"vegetarian\",\"vegan\"}} or {{}}"
        )
        return None

    inner_value = value[1:-1].strip()

    if inner_value == "":
        return []

    items = []

    for raw_item in inner_value.split(","):
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

        items.append(cleaned_item)

    return items


def validate_csv() -> bool:
    if not CSV_PATH.exists():
        print(f"CSV file not found: {CSV_PATH}")
        return False

    has_errors = False

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
            dining_hall = row["dining_hall"].strip().lower()
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

            allergens = parse_postgres_array_field(row["allergens"], "allergens", row_number)
            dietary_tags = parse_postgres_array_field(row["dietary_tags"], "dietary_tags", row_number)

            if allergens is None:
                has_errors = True
            else:
                if len(allergens) != len(set(allergens)):
                    print(f"Row {row_number}: duplicate allergen found in allergens field.")
                    has_errors = True

            if dietary_tags is None:
                has_errors = True
            else:
                if len(dietary_tags) != len(set(dietary_tags)):
                    print(f"Row {row_number}: duplicate dietary tag found in dietary_tags field.")
                    has_errors = True

    if has_errors:
        print("\nCSV validation failed.")
        return False

    print("CSV validation passed.")
    return True


if __name__ == "__main__":
    success = validate_csv()
    sys.exit(0 if success else 1)