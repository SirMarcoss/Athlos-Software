import httpx
import asyncio
from typing import Any, Optional
from app.core.config import settings


class GooglePlacesService:
    SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GOOGLE_PLACES_API_KEY

    async def fetch_club_details(self, club_name: str, address_str: str) -> Optional[dict[str, Any]]:
        if not self.api_key:
            return None

        text_query = f"{club_name} {address_str}".strip()
        fields = [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.nationalPhoneNumber",
            "places.internationalPhoneNumber",
            "places.websiteUri",
            "places.regularOpeningHours",
            "places.rating",
            "places.userRatingCount",
            "places.photos",
        ]
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": ",".join(fields),
        }
        body = {
            "textQuery": text_query,
            "languageCode": "it"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(self.SEARCH_URL, headers=headers, json=body)
                if response.status_code != 200:
                    return None

                data = response.json()
                places = data.get("places", [])
                if not places:
                    return None

                best_match = places[0]
                # Passiamo il client per risolvere anche i link CDN delle foto
                return await self._format_place_data(client, best_match)
        except Exception as e:
            print(f"[PlacesAPI Exception]: {e}")
            return None

    async def _format_place_data(self, client: httpx.AsyncClient, place: dict[str, Any]) -> dict[str, Any]:
        raw_photos = place.get("photos", [])

        # 1. Recupero parallelo dei link CDN pubblici con skipHttpRedirect=true (Max 4 foto)
        async def resolve_photo_cdn(photo_name: str) -> Optional[str]:
            url = f"https://places.googleapis.com/v1/{photo_name}/media"
            try:
                r = await client.get(url, params={
                    "maxWidthPx": 1000,
                    "skipHttpRedirect": "true",
                    "key": self.api_key
                })
                if r.status_code == 200:
                    return r.json().get("photoUri")
            except Exception:
                pass
            return None

        photo_tasks = [
            resolve_photo_cdn(p["name"])
            for p in raw_photos[:4]
            if p.get("name")
        ]
        resolved_photos = await asyncio.gather(*photo_tasks)
        photo_urls = [url for url in resolved_photos if url is not None]

        # 2. Orari di apertura settimanali
        opening_hours = None
        reg_hours = place.get("regularOpeningHours", {})
        if reg_hours:
            opening_hours = {
                "open_now": reg_hours.get("openNow", False),
                "weekday_descriptions": reg_hours.get("weekdayDescriptions", [])
            }

        return {
            "google_place_id": place.get("id"),
            "website_url": place.get("websiteUri"),
            "phone_number": place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"),
            "rating": place.get("rating"),
            "reviews_count": place.get("userRatingCount", 0),
            "opening_hours": opening_hours,
            "photos": photo_urls,  # URL pubblici diretti https://lh3.googleusercontent.com/...
        }