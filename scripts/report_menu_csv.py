import csv
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = PROJECT_ROOT / "data" / "menu_items_seed.csv"


def print_counter(title: str, counter: Counter[str]) -> None:
    print(f"\n{title}")

    if not counter:
        print("- none")
        return

    for key, count in sorted(counter.items()):
        print(f"- {key}: {count}")


def main() -> None:
    if not CSV_PATH.exists():
        print(f"CSV file not found: {CSV_PATH}")
        return

    meal_period_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    dining_hall_counts: Counter[str] = Counter()
    source_counts: Counter[str] = Counter()

    total_rows = 0

    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            total_rows += 1
            meal_period_counts[row["meal_period"].strip().lower()] += 1
            category_counts[row["category"].strip().lower()] += 1
            dining_hall_counts[row["dining_hall"].strip()] += 1
            source_counts[row["source"].strip().lower()] += 1

    print("Menu CSV Report")
    print("=" * 15)
    print(f"Total rows: {total_rows}")

    print_counter("Meal periods:", meal_period_counts)
    print_counter("Categories:", category_counts)
    print_counter("Dining halls:", dining_hall_counts)
    print_counter("Sources:", source_counts)


if __name__ == "__main__":
    main()