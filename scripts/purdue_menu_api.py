import json
import socket
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


GRAPHQL_ENDPOINT = "https://api.hfs.purdue.edu/menus/v3/GraphQL"

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://dining.purdue.edu",
    "Referer": "https://dining.purdue.edu/menus/",
}


GET_START_LOCATIONS = """
query getStartLocations {
  diningCourtCategories {
    name
    diningCourts {
      id
      category
      name
      formalName
      lineLength
      logoUrl
      upcomingMeals {
        id
        name
        type
        startTime
        endTime
      }
    }
  }
}
""".strip()


GET_LOCATION_MENU = """
query getLocationMenu($name: String!, $date: Date!) {
  diningCourtByName(name: $name) {
    address {
      city
      state
      street
      zip
    }
    formalName
    id
    bannerUrl
    logoUrl
    name
    latitude
    longitude
    googlePlaceId
    normalHours {
      id
      name
      effectiveDate
      days {
        dayOfWeek
        meals {
          endTime
          name
          startTime
        }
      }
    }
    dailyMenu(date: $date) {
      notes
      meals {
        endTime
        startTime
        notes
        name
        status
        stations {
          iconUrl
          id
          name
          notes
          items {
            specialName
            itemMenuId
            hasComponents
            item {
              isFlaggedForCurrentUser
              isHiddenForCurrentUser
              isNutritionReady
              itemId
              name
              traits {
                name
                svgIcon
                svgIconWithoutBackground
              }
              components {
                name
                isFlaggedForCurrentUser
                isHiddenForCurrentUser
                isNutritionReady
                itemId
                traits {
                  name
                  svgIcon
                  svgIconWithoutBackground
                }
              }
            }
          }
        }
      }
    }
  }
}
""".strip()


ITEM_BY_ITEM_ID = """
query itemByItemId($id: Guid!) {
  itemByItemId(itemId: $id) {
    itemId
    name
    ingredients
    isNutritionReady
    nutritionFacts {
      dailyValueLabel
      label
      name
      value
    }
    traits {
      svgIcon
      svgIconWithoutBackground
      name
      type
    }
    appearances {
      date
      locationName
      stationName
      mealName
    }
    components {
      itemId
      name
      isFlaggedForCurrentUser
      isHiddenForCurrentUser
      isNutritionReady
      traits {
        svgIcon
        svgIconWithoutBackground
        name
        type
      }
    }
  }
}
""".strip()


ITEM_APPEARANCE = """
query itemAppearance($id: Guid!) {
  itemAppearance(itemMenuId: $id) {
    item {
      itemId
      name
      ingredients
      isNutritionReady
      nutritionFacts {
        dailyValueLabel
        label
        name
        value
      }
      traits {
        svgIcon
        svgIconWithoutBackground
        name
        type
      }
      appearances {
        date
        locationName
        stationName
        mealName
      }
    }
    displayName
    specialName
    id
    hasComponents
    components {
      item {
        itemId
        name
        isFlaggedForCurrentUser
        isHiddenForCurrentUser
        isNutritionReady
        traits {
          svgIcon
          svgIconWithoutBackground
          name
          type
        }
      }
      specialName
      itemMenuId
      id
    }
  }
}
""".strip()


class PurdueMenuApiError(RuntimeError):
    pass


@dataclass
class PurdueMenuApiStats:
    request_count: int = 0
    retry_count: int = 0


class PurdueMenuApi:
    def __init__(
        self,
        timeout_seconds: float = 20.0,
        retries: int = 2,
        backoff_seconds: float = 0.5,
        min_interval_seconds: float = 0.25,
        endpoint: str = GRAPHQL_ENDPOINT,
    ) -> None:
        self.timeout_seconds = timeout_seconds
        self.retries = retries
        self.backoff_seconds = backoff_seconds
        self.min_interval_seconds = min_interval_seconds
        self.endpoint = endpoint
        self.stats = PurdueMenuApiStats()
        self._last_request_at: float | None = None

    def get_start_locations(self) -> dict[str, Any]:
        return self.post_graphql(
            GET_START_LOCATIONS,
            operation_name="getStartLocations",
        )

    def get_location_menu(self, name: str, serving_date: str) -> dict[str, Any]:
        return self.post_graphql(
            GET_LOCATION_MENU,
            variables={"name": name, "date": serving_date},
            operation_name="getLocationMenu",
        )

    def item_by_item_id(self, item_id: str) -> dict[str, Any]:
        return self.post_graphql(
            ITEM_BY_ITEM_ID,
            variables={"id": item_id},
            operation_name="itemByItemId",
        )

    def item_appearance(self, item_menu_id: str) -> dict[str, Any]:
        return self.post_graphql(
            ITEM_APPEARANCE,
            variables={"id": item_menu_id},
            operation_name="itemAppearance",
        )

    def post_graphql(
        self,
        query: str,
        variables: dict[str, Any] | None = None,
        operation_name: str | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"query": query}
        if variables is not None:
            payload["variables"] = variables
        if operation_name is not None:
            payload["operationName"] = operation_name

        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            self.endpoint,
            data=body,
            headers=DEFAULT_HEADERS,
            method="POST",
        )

        last_error: str | None = None
        for attempt in range(self.retries + 1):
            self._pace()
            self.stats.request_count += 1

            try:
                with urllib.request.urlopen(
                    request,
                    timeout=self.timeout_seconds,
                ) as response:
                    response_body = response.read().decode("utf-8")
            except urllib.error.HTTPError as error:
                response_body = error.read().decode("utf-8", errors="replace")
                last_error = (
                    f"HTTP {error.code} for {operation_name or 'GraphQL'}: "
                    f"{response_body[:500]}"
                )
                if not self._should_retry_status(error.code, attempt):
                    raise PurdueMenuApiError(last_error) from error
            except (TimeoutError, socket.timeout, urllib.error.URLError) as error:
                last_error = f"Request failed for {operation_name or 'GraphQL'}: {error}"
                if not self._should_retry_exception(error, attempt):
                    raise PurdueMenuApiError(last_error) from error
            else:
                try:
                    decoded = json.loads(response_body)
                except json.JSONDecodeError as error:
                    raise PurdueMenuApiError(
                        f"Invalid JSON for {operation_name or 'GraphQL'}: "
                        f"{response_body[:500]}"
                    ) from error

                if decoded.get("errors"):
                    raise PurdueMenuApiError(
                        f"GraphQL errors for {operation_name or 'GraphQL'}: "
                        f"{json.dumps(decoded['errors'])[:1000]}"
                    )

                return decoded

            self.stats.retry_count += 1
            time.sleep(self.backoff_seconds * (2**attempt))

        raise PurdueMenuApiError(last_error or "Unknown Purdue GraphQL failure")

    def _pace(self) -> None:
        now = time.monotonic()
        if self._last_request_at is not None:
            elapsed = now - self._last_request_at
            if elapsed < self.min_interval_seconds:
                time.sleep(self.min_interval_seconds - elapsed)
        self._last_request_at = time.monotonic()

    def _should_retry_status(self, status_code: int, attempt: int) -> bool:
        return 500 <= status_code <= 599 and attempt < self.retries

    def _should_retry_exception(self, error: BaseException, attempt: int) -> bool:
        if attempt >= self.retries:
            return False
        if isinstance(error, (TimeoutError, socket.timeout)):
            return True
        if isinstance(error, urllib.error.URLError):
            return isinstance(error.reason, (TimeoutError, socket.timeout))
        return False
