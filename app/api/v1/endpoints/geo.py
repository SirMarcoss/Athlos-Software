from fastapi import APIRouter, Query
from typing import List
from app.schemas.geo import GeoSearchResult
from app.services.geo_service import GeoService

router = APIRouter()


@router.get("/autocomplete", response_model=List[GeoSearchResult])
async def autocomplete_address(
    q: str = Query(..., min_length=2, max_length=100, description="Indirizzo o città da cercare (es. 'San Giovanni La')"),
    limit: int = Query(5, ge=1, le=10, description="Numero massimo di risultati da restituire")
):
    """
    Ricerca geografica e completamento automatico di indirizzi basato su dati aperti OpenStreetMap/Photon.
    Restituisce l'indirizzo formattato e le coordinate geografiche (latitudine e longitudine)
    senza richiedere alcuna API Key esterna né esporre dati sensibili.
    """
    geo_service = GeoService()
    return await geo_service.autocomplete(query=q, limit=limit)
