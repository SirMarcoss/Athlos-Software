import re
import httpx
from typing import List
from app.schemas.geo import GeoSearchResult


class GeoService:
    BASE_URL = "https://photon.komoot.io/api/"
    HEADERS = {"User-Agent": "Athlos-App/1.0 (Athlos Sports Platform)"}

    def _sanitize_query(self, query: str) -> str:
        # Strip and remove potentially dangerous / invalid characters
        cleaned = re.sub(r"[^\w\s,\.\'-]", "", query, flags=re.UNICODE).strip()
        return cleaned[:100]

    async def autocomplete(self, query: str, limit: int = 5) -> List[GeoSearchResult]:
        sanitized = self._sanitize_query(query)
        if len(sanitized) < 2:
            return []

        # 1. Prova prima con OpenStreetMap Nominatim (massima precisione per indirizzi italiani)
        try:
            nom_url = "https://nominatim.openstreetmap.org/search"
            nom_params = {
                "q": sanitized,
                "format": "json",
                "addressdetails": 1,
                "countrycodes": "it",
                "limit": min(max(limit, 1), 10)
            }
            async with httpx.AsyncClient(timeout=4.0, headers=self.HEADERS) as client:
                resp = await client.get(nom_url, params=nom_params)
                if resp.status_code == 200:
                    nom_data = resp.json()
                    if isinstance(nom_data, list) and len(nom_data) > 0:
                        nom_results: List[GeoSearchResult] = []
                        for item in nom_data:
                            addr = item.get("address", {})
                            street_name = addr.get("road") or addr.get("pedestrian") or addr.get("street") or addr.get("suburb") or item.get("name") or ""
                            house_num = addr.get("house_number")
                            full_street = f"{street_name} {house_num}".strip() if house_num else street_name
                            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("municipality") or addr.get("county") or ""
                            province = addr.get("county") or addr.get("state_district") or ""
                            nom_results.append(GeoSearchResult(
                                display_name=item.get("display_name", ""),
                                street=full_street or None,
                                city=city,
                                province=province,
                                postal_code=addr.get("postcode"),
                                country=addr.get("country", "Italia"),
                                latitude=float(item.get("lat")),
                                longitude=float(item.get("lon"))
                            ))
                        if nom_results:
                            return nom_results
        except Exception:
            pass

        # 2. Fallback su Photon (Komoot)
        params = {
            "q": sanitized,
            "limit": min(max(limit, 1), 10),
            "lang": "default"
        }

        try:
            async with httpx.AsyncClient(timeout=4.0, headers=self.HEADERS) as client:
                response = await client.get(self.BASE_URL, params=params)
                if response.status_code != 200:
                    return []
                data = response.json()
        except Exception:
            return []

        features = data.get("features", [])
        results: List[GeoSearchResult] = []

        for feat in features:
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])

            if len(coords) < 2:
                continue

            lon, lat = coords[0], coords[1]
            name = props.get("name")
            street = props.get("street")
            housenumber = props.get("housenumber")
            city = props.get("city") or props.get("town") or props.get("village") or props.get("locality")
            county = props.get("county") or props.get("state_district")
            postcode = props.get("postcode")
            country = props.get("country")

            # Street composition
            if street and housenumber:
                full_street = f"{street} {housenumber}"
            elif street:
                full_street = street
            elif props.get("osm_value") in ["residential", "secondary", "primary", "tertiary", "service", "living_street"] and name:
                full_street = name
            else:
                full_street = None

            # Display name composition
            parts = []
            if full_street:
                parts.append(full_street)
            elif name and name != city:
                parts.append(name)

            if city:
                parts.append(city)
            if county and county != city:
                parts.append(county)
            if country:
                parts.append(country)

            display_name = ", ".join(parts) if parts else (name or "Indirizzo sconosciuto")

            results.append(
                GeoSearchResult(
                    display_name=display_name,
                    street=full_street or name,
                    city=city or name,
                    province=county,
                    postal_code=postcode,
                    country=country or "Italia",
                    latitude=float(lat),
                    longitude=float(lon)
                )
            )

        return results
