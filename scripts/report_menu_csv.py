import csv
import math
import re
from collections import Counter, defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = PROJECT_ROOT / "data" / "menu_items_seed.csv"


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


def parse_postgres_array_field(value: str) -> list[str]:
    value = value.strip()

    if value == "{}":
        return []

    if not value.startswith("{") or not value.endswith("}"):
        return []

    inner_value = value[1:-1].strip()

    if inner_value == "":
        return []

    items = []
    current = ""
    in_quotes = False

    for char in inner_value:
        if char == '"':
            in_quotes = not in_quotes
            current += char
        elif char == "," and not in_quotes:
            items.append(current)
            current = ""
        else:
            current += char

    items.append(current)

    cleaned_items = []
    for raw_item in items:
        item = raw_item.strip()
        if item.startswith('"') and item.endswith('"'):
            cleaned_items.append(item[1:-1].strip().lower())

    return [item for item in cleaned_items if item]


def parse_number(value: str) -> float | None:
    try:
        number = float(value.strip())
    except ValueError:
        return None

    if not math.isfinite(number):
        return None

    return number


def print_counter(title: str, counter: Counter[str]) -> None:
    print(f"\n{title}")

    if not counter:
        print("- none")
        return

    for key, count in sorted(counter.items()):
        print(f"- {key}: {count}")


def print_balance_check(title: str, counter: Counter[str]) -> None:
    print(f"\n{title}")

    if not counter:
        print("Status: no data")
        return

    counts = list(counter.values())
    min_count = min(counts)
    max_count = max(counts)

    if min_count == max_count:
        print(f"Status: balanced ({min_count} each)")
    else:
        print(f"Status: not balanced (min {min_count}, max {max_count})")


def main() -> None:
    if not CSV_PATH.exists():
        print(f"CSV file not found: {CSV_PATH}")
        return

    meal_period_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    dining_hall_counts: Counter[str] = Counter()
    source_counts: Counter[str] = Counter()
    allergen_counts: Counter[str] = Counter()
    dietary_tag_counts: Counter[str] = Counter()
    duplicate_records: dict[tuple[str, str, str, str, str], list[int]] = defaultdict(list)
    suspicious_rows: list[str] = []

    rows_with_allergens = 0
    rows_with_dietary_tags = 0
    total_rows = 0

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row_number, row in enumerate(reader, start=2):
            total_rows += 1
            meal_period_counts[row["meal_period"].strip().lower()] += 1
            category_counts[row["category"].strip().lower()] += 1
            dining_hall_counts[row["dining_hall"].strip()] += 1
            source_counts[row["source"].strip().lower()] += 1

            allergens = parse_postgres_array_field(row["allergens"])
            dietary_tags = parse_postgres_array_field(row["dietary_tags"])

            if allergens:
                rows_with_allergens += 1
                allergen_counts.update(allergens)

            if dietary_tags:
                rows_with_dietary_tags += 1
                dietary_tag_counts.update(dietary_tags)

            duplicate_records[normalize_record_key(row)].append(row_number)

            for numeric_column, suspicious_limit in SUSPICIOUS_LIMITS.items():
                number = parse_number(row[numeric_column])
                if number is not None and number > suspicious_limit:
                    suspicious_rows.append(
                        f"row {row_number}: {numeric_column}={number:g}"
                    )

    duplicates = {
        key: row_numbers
        for key, row_numbers in duplicate_records.items()
        if len(row_numbers) > 1
    }

    print("Menu CSV Report")
    print("=" * 15)
    print(f"Total rows: {total_rows}")

    print_counter("Dining halls:", dining_hall_counts)
    print_counter("Meal periods:", meal_period_counts)
    print_counter("Categories:", category_counts)
    print_counter("Sources:", source_counts)

    print("\nAllergen coverage:")
    print(f"- rows with listed allergens: {rows_with_allergens}")
    print(f"- rows with no listed allergens: {total_rows - rows_with_allergens}")
    print_counter("Allergen counts:", allergen_counts)

    print("\nDietary tag coverage:")
    print(f"- rows with dietary tags: {rows_with_dietary_tags}")
    print(f"- rows with no dietary tags: {total_rows - rows_with_dietary_tags}")
    print_counter("Dietary tag counts:", dietary_tag_counts)

    print("\nDuplicate normalized records:")
    if not duplicates:
        print("- none")
    else:
        for key, row_numbers in sorted(duplicates.items()):
            print(f"- rows {row_numbers}: {key}")

    print("\nSuspicious nutrition values:")
    if not suspicious_rows:
        print("- none")
    else:
        for item in suspicious_rows:
            print(f"- {item}")

    print_balance_check("Meal period balance:", meal_period_counts)
    print_balance_check("Category balance:", category_counts)


if __name__ == "__main__":
    main()
