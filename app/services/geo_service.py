import asyncio
import re
import httpx
from typing import List
from app.schemas.geo import GeoSearchResult

ITALIAN_PROVINCE_CODES = {
    "agrigento": "AG", "alessandria": "AL", "ancona": "AN", "aosta": "AO", "valle d'aosta": "AO",
    "arezzo": "AR", "ascoli piceno": "AP", "asti": "AT", "avellino": "AV", "bari": "BA",
    "barletta-andria-trani": "BT", "belluno": "BL", "benevento": "BN", "bergamo": "BG",
    "biella": "BI", "bologna": "BO", "bolzano": "BZ", "bozen": "BZ", "brescia": "BS",
    "brindisi": "BR", "cagliari": "CA", "caltanissetta": "CL", "campobasso": "CB",
    "caserta": "CE", "catania": "CT", "catanzaro": "CZ", "chieti": "CH", "como": "CO",
    "cosenza": "CS", "cremona": "CR", "crotone": "KR", "cuneo": "CN", "enna": "EN",
    "fermo": "FM", "ferrara": "FE", "firenze": "FI", "foggia": "FG", "forlì-cesena": "FC",
    "forli-cesena": "FC", "frosinone": "FR", "genova": "GE", "gorizia": "GO", "grosseto": "GR",
    "imperia": "IM", "isernia": "IS", "l'aquila": "AQ", "la spezia": "SP", "latina": "LT",
    "lecce": "LE", "lecco": "LC", "livorno": "LI", "lodi": "LO", "lucca": "LU",
    "macerata": "MC", "mantova": "MN", "massa-carrara": "MS", "massa carrara": "MS",
    "matera": "MT", "messina": "ME", "milano": "MI", "modena": "MO", "monza e della brianza": "MB",
    "monza e brianza": "MB", "monza": "MB", "napoli": "NA", "novara": "NO", "nuoro": "NU",
    "oristano": "OR", "padova": "PD", "palermo": "PA", "parma": "PR", "pavia": "PV",
    "perugia": "PG", "pesaro e urbino": "PU", "pesaro-urbino": "PU", "pescara": "PE",
    "piacenza": "PC", "pisa": "PI", "pistoia": "PT", "pordenone": "PN", "potenza": "PZ",
    "prato": "PO", "ragusa": "RG", "ravenna": "RA", "reggio calabria": "RC",
    "reggio di calabria": "RC", "reggio emilia": "RE", "reggio nell'emilia": "RE",
    "rieti": "RI", "rimini": "RN", "roma": "RM", "rovigo": "RO", "salerno": "SA",
    "sassari": "SS", "savona": "SV", "siena": "SI", "siracusa": "SR", "sondrio": "SO",
    "sud sardegna": "SU", "gallura nord-est sardegna": "SS", "taranto": "TA", "teramo": "TE",
    "terni": "TR", "torino": "TO", "trapani": "TP", "trento": "TN", "treviso": "TV",
    "trieste": "TS", "udine": "UD", "varese": "VA", "venezia": "VE", "verbano-cusio-ossola": "VB",
    "vercelli": "VC", "verona": "VR", "vibo valentia": "VV", "vicenza": "VI", "viterbo": "VT"
}


def normalize_province_code(raw_prov: str | None) -> str:
    if not raw_prov:
        return ""
    cleaned = raw_prov.strip()
    if len(cleaned) == 2 and cleaned.isalpha():
        return cleaned.upper()
    lower = cleaned.lower()
    for prefix in ("provincia di ", "città metropolitana di ", "libero consorzio comunale di "):
        if lower.startswith(prefix):
            lower = lower[len(prefix):].strip()
    if lower in ITALIAN_PROVINCE_CODES:
        return ITALIAN_PROVINCE_CODES[lower]
    for name, code in ITALIAN_PROVINCE_CODES.items():
        if name in lower:
            return code
    return cleaned[:2].upper()


class GeoService:
    ARCGIS_SUGGEST_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest"
    ARCGIS_FIND_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
    HEADERS = {"User-Agent": "Athlos-App/1.0 (Athlos Sports Platform)"}

    def _sanitize_query(self, query: str) -> str:
        cleaned = re.sub(r"[^\w\s,\.\'-]", "", query, flags=re.UNICODE).strip()
        return cleaned[:120]

    def _parse_candidate(self, cand: dict) -> GeoSearchResult | None:
        loc = cand.get("location") or {}
        lon = loc.get("x")
        lat = loc.get("y")
        if lon is None or lat is None:
            return None

        attrs = cand.get("attributes") or {}
        street = (attrs.get("StAddr") or attrs.get("PlaceName") or "").strip()
        city = (attrs.get("City") or attrs.get("Nbrhd") or "").strip()
        subregion = (attrs.get("Subregion") or attrs.get("Region") or "").strip()
        postal = (attrs.get("Postal") or "").strip()
        prov_code = normalize_province_code(subregion or city)

        if not street and cand.get("address"):
            street = cand["address"].split(",")[0].strip()

        city_part = f"{postal} {city}".strip() if postal else city
        if prov_code:
            city_part = f"{city_part} ({prov_code})".strip()

        if street and city_part and street.lower() != city.lower():
            display_name = f"{street} — {city_part}"
        else:
            display_name = cand.get("address") or street or city_part

        return GeoSearchResult(
            display_name=display_name,
            street=street or None,
            city=city or None,
            province=prov_code or None,
            postal_code=postal or None,
            country="Italia",
            latitude=float(lat),
            longitude=float(lon)
        )

    async def _resolve_suggestion(self, client: httpx.AsyncClient, text: str, magic_key: str | None) -> GeoSearchResult | None:
        params = {
            "SingleLine": text,
            "countryCode": "ITA",
            "f": "json",
            "outFields": "StAddr,PlaceName,Nbrhd,City,Subregion,Region,Postal,Addr_type",
            "maxLocations": 1
        }
        if magic_key:
            params["magicKey"] = magic_key
        try:
            resp = await client.get(self.ARCGIS_FIND_URL, params=params)
            if resp.status_code == 200:
                cands = resp.json().get("candidates", [])
                if cands:
                    return self._parse_candidate(cands[0])
        except Exception:
            pass
        return None

    async def autocomplete(self, query: str, limit: int = 5) -> List[GeoSearchResult]:
        sanitized = self._sanitize_query(query)
        if len(sanitized) < 2:
            return []

        max_items = min(max(limit, 1), 8)

        # 1. Motore Primario: Esri ArcGIS World Geocoder (Supporto completo civici, CAP e comuni italiani)
        try:
            async with httpx.AsyncClient(timeout=4.5, headers=self.HEADERS) as client:
                if max_items == 1:
                    single_res = await self._resolve_suggestion(client, sanitized, None)
                    if single_res:
                        return [single_res]

                sug_resp = await client.get(
                    self.ARCGIS_SUGGEST_URL,
                    params={
                        "text": sanitized,
                        "category": "Address",
                        "countryCode": "ITA",
                        "f": "json",
                        "maxSuggestions": max_items
                    }
                )
                if sug_resp.status_code == 200:
                    suggestions = sug_resp.json().get("suggestions", [])
                    if suggestions:
                        tasks = [
                            self._resolve_suggestion(client, s.get("text", ""), s.get("magicKey"))
                            for s in suggestions[:max_items]
                        ]
                        resolved = await asyncio.gather(*tasks)
                        results = [r for r in resolved if r is not None]
                        if results:
                            return results

                # Se suggest non ha trovato match parziali, prova findAddressCandidates diretto
                cand_resp = await client.get(
                    self.ARCGIS_FIND_URL,
                    params={
                        "SingleLine": sanitized,
                        "countryCode": "ITA",
                        "f": "json",
                        "outFields": "StAddr,PlaceName,Nbrhd,City,Subregion,Region,Postal,Addr_type",
                        "maxLocations": max_items
                    }
                )
                if cand_resp.status_code == 200:
                    cands = cand_resp.json().get("candidates", [])
                    results = [self._parse_candidate(c) for c in cands]
                    valid_results = [r for r in results if r is not None]
                    if valid_results:
                        return valid_results
        except Exception:
            pass

        return []
