import argparse
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True

from purdue_menu_api import PurdueMenuApi, PurdueMenuApiError


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FIXTURE_ROOT = PROJECT_ROOT / "data" / "purdue_live_fixtures"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read-only Purdue Dining GraphQL fetcher and fixture capture.",
    )
    parser.add_argument(
        "--date",
        default=date.today().isoformat(),
        help="Serving date to fetch in YYYY-MM-DD format. Defaults to today.",
    )
    parser.add_argument(
        "--hall",
        help="Single Purdue dining hall/location name, e.g. Wiley.",
    )
    parser.add_argument(
        "--all-dining-courts",
        action="store_true",
        help="Fetch all locations in the official Dining Courts category.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Fixture output directory. Defaults under data/purdue_live_fixtures/.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="Per-request timeout in seconds.",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=2,
        help="Retries for timeout and 5xx failures.",
    )
    parser.add_argument(
        "--min-interval",
        type=float,
        default=0.25,
        help="Minimum seconds between requests.",
    )
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    try:
        date.fromisoformat(args.date)
    except ValueError as error:
        raise SystemExit(f"--date must be YYYY-MM-DD, got {args.date!r}") from error

    if args.hall and args.all_dining_courts:
        raise SystemExit("Use either --hall or --all-dining-courts, not both.")

    if not args.hall and not args.all_dining_courts:
        raise SystemExit("Choose a controlled scope with --hall or --all-dining-courts.")

    if args.timeout <= 0:
        raise SystemExit("--timeout must be greater than 0.")

    if args.retries < 0:
        raise SystemExit("--retries must be 0 or greater.")

    if args.min_interval < 0.25:
        raise SystemExit("--min-interval must be at least 0.25 seconds.")


def main() -> int:
    args = parse_args()
    validate_args(args)

    output_dir = args.output or default_output_dir(args)
    output_dir.mkdir(parents=True, exist_ok=True)

    api = PurdueMenuApi(
        timeout_seconds=args.timeout,
        retries=args.retries,
        min_interval_seconds=args.min_interval,
    )

    try:
        locations_response = api.get_start_locations()
        write_json(output_dir / "locations.json", locations_response)

        selected_halls = select_halls(locations_response, args)
        if not selected_halls:
            raise PurdueMenuApiError("No halls matched the requested fetch scope.")

        daily_menu_responses: dict[str, Any] = {}
        item_ids: set[str] = set()
        component_item_menu_ids: set[str] = set()

        for hall_name in selected_halls:
            response = api.get_location_menu(hall_name, args.date)
            daily_menu_responses[hall_name] = response
            write_json(
                output_dir / f"daily_menu_{slugify(hall_name)}_{args.date}.json",
                response,
            )

            for occurrence in iter_menu_occurrences(response):
                item = occurrence.get("item") or {}
                item_id = item.get("itemId")
                if item_id:
                    item_ids.add(item_id)

                if occurrence.get("hasComponents") and occurrence.get("itemMenuId"):
                    component_item_menu_ids.add(occurrence["itemMenuId"])

        item_detail_responses: dict[str, Any] = {}
        for item_id in sorted(item_ids):
            item_detail_responses[item_id] = api.item_by_item_id(item_id)
        write_json(output_dir / "item_details_by_item_id.json", item_detail_responses)

        occurrence_detail_responses: dict[str, Any] = {}
        for item_menu_id in sorted(component_item_menu_ids):
            occurrence_detail_responses[item_menu_id] = api.item_appearance(item_menu_id)
        write_json(
            output_dir / "occurrence_details_by_item_menu_id.json",
            occurrence_detail_responses,
        )

        fixture_paths = capture_exemplar_fixtures(
            output_dir,
            item_detail_responses,
            occurrence_detail_responses,
        )
    except PurdueMenuApiError as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1

    summary = build_summary(
        args=args,
        output_dir=output_dir,
        selected_halls=selected_halls,
        api=api,
        daily_menu_responses=daily_menu_responses,
        item_detail_responses=item_detail_responses,
        occurrence_detail_responses=occurrence_detail_responses,
        fixture_paths=fixture_paths,
    )
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


def default_output_dir(args: argparse.Namespace) -> Path:
    scope = args.hall if args.hall else "all_dining_courts"
    return DEFAULT_FIXTURE_ROOT / f"{args.date}_{slugify(scope)}"


def select_halls(locations_response: dict[str, Any], args: argparse.Namespace) -> list[str]:
    courts = [
        court
        for category in get_categories(locations_response)
        if category.get("name") == "Dining Courts"
        for court in category.get("diningCourts") or []
    ]

    if args.all_dining_courts:
        return [court["name"] for court in courts if court.get("name")]

    requested = (args.hall or "").strip().casefold()
    for court in all_locations(locations_response):
        candidates = [
            str(court.get("name") or ""),
            str(court.get("formalName") or ""),
        ]
        if any(candidate.casefold() == requested for candidate in candidates):
            return [court["name"]]

    return [args.hall.strip()] if args.hall else []


def get_categories(response: dict[str, Any]) -> list[dict[str, Any]]:
    return response.get("data", {}).get("diningCourtCategories") or []


def all_locations(response: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        court
        for category in get_categories(response)
        for court in category.get("diningCourts") or []
    ]


def iter_menu_occurrences(response: dict[str, Any]) -> list[dict[str, Any]]:
    dining_court = response.get("data", {}).get("diningCourtByName") or {}
    daily_menu = dining_court.get("dailyMenu") or {}
    occurrences: list[dict[str, Any]] = []

    for meal in daily_menu.get("meals") or []:
        for station in meal.get("stations") or []:
            for item in station.get("items") or []:
                occurrences.append(item)

    return occurrences


def capture_exemplar_fixtures(
    output_dir: Path,
    item_detail_responses: dict[str, Any],
    occurrence_detail_responses: dict[str, Any],
) -> list[str]:
    fixture_paths: list[str] = []
    exemplars = {
        "complete_nutrition_item.json": has_complete_nutrition,
        "missing_nutrition_item.json": has_missing_nutrition,
        "item_with_allergen_traits.json": has_allergen_traits,
        "item_with_traits_unavailable.json": has_traits_unavailable,
    }

    for filename, predicate in exemplars.items():
        match = first_matching_item_response(item_detail_responses, predicate)
        if match is not None:
            path = output_dir / filename
            write_json(path, match)
            fixture_paths.append(str(path))

    if occurrence_detail_responses:
        first_key = sorted(occurrence_detail_responses)[0]
        path = output_dir / "component_collection_occurrence.json"
        write_json(path, occurrence_detail_responses[first_key])
        fixture_paths.append(str(path))

    return fixture_paths


def first_matching_item_response(
    item_detail_responses: dict[str, Any],
    predicate: Any,
) -> dict[str, Any] | None:
    for response in item_detail_responses.values():
        item = response.get("data", {}).get("itemByItemId") or {}
        if predicate(item):
            return response
    return None


def has_complete_nutrition(item: dict[str, Any]) -> bool:
    return bool(item.get("isNutritionReady") and item.get("nutritionFacts"))


def has_missing_nutrition(item: dict[str, Any]) -> bool:
    return not item.get("isNutritionReady") or item.get("nutritionFacts") is None


def has_allergen_traits(item: dict[str, Any]) -> bool:
    return any(
        trait.get("type") == "Allergen"
        for trait in item.get("traits") or []
        if isinstance(trait, dict)
    )


def has_traits_unavailable(item: dict[str, Any]) -> bool:
    return item.get("traits") is None


def build_summary(
    args: argparse.Namespace,
    output_dir: Path,
    selected_halls: list[str],
    api: PurdueMenuApi,
    daily_menu_responses: dict[str, Any],
    item_detail_responses: dict[str, Any],
    occurrence_detail_responses: dict[str, Any],
    fixture_paths: list[str],
) -> dict[str, Any]:
    observed_items = [
        response.get("data", {}).get("itemByItemId") or {}
        for response in item_detail_responses.values()
    ]

    return {
        "dry_run": True,
        "supabase_write": False,
        "mobile_files_edited": False,
        "selected_date": args.date,
        "selected_halls": selected_halls,
        "output_dir": str(output_dir),
        "request_count": api.stats.request_count,
        "retry_count": api.stats.retry_count,
        "retry_policy": f"{api.retries} retries for timeout/5xx",
        "min_interval_seconds": api.min_interval_seconds,
        "daily_menu_count": len(daily_menu_responses),
        "unique_item_detail_count": len(item_detail_responses),
        "occurrence_detail_count": len(occurrence_detail_responses),
        "nutrition_observed": any(has_complete_nutrition(item) for item in observed_items),
        "missing_nutrition_observed": any(
            has_missing_nutrition(item) for item in observed_items
        ),
        "allergen_traits_observed": any(
            has_allergen_traits(item) for item in observed_items
        ),
        "traits_unavailable_observed": any(
            has_traits_unavailable(item) for item in observed_items
        ),
        "occurrence_uuids_observed": bool(occurrence_detail_responses),
        "fixture_files_captured": fixture_paths,
        "api_errors": [],
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


if __name__ == "__main__":
    raise SystemExit(main())
