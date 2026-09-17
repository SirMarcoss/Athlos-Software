import asyncio
from app.services.geo_service import GeoService

async def main():
    print("=" * 60)
    print("  1. TEST MOTORE DI RICERCA INDIRIZZI (PHOTON / OSM)")
    print("=" * 60)
    service = GeoService()
    
    query = "San Giovanni La"
    print(f"Ricerca in corso per: '{query}'...")
    results = await service.autocomplete(query, limit=3)
    
    if not results:
        print("Nessun risultato trovato.")
        return

    for i, res in enumerate(results, start=1):
        print(f"\n[Risultato {i}]")
        print(f"  Nome completo : {res.display_name}")
        print(f"  Città / Comune: {res.city}")
        print(f"  Provincia     : {res.province}")
        print(f"  CAP           : {res.postal_code}")
        print(f"  Coordinate    : Latitudine {res.latitude}, Longitudine {res.longitude}")

    first = results[0]
    parent_lat = first.latitude
    parent_lon = first.longitude

    print("\n" + "=" * 60)
    print("  2. SIMULAZIONE FILTRO CORSI A 20 KM (HAVERSINE)")
    print("=" * 60)
    print(f"Posizione Genitore: {first.display_name} ({parent_lat}, {parent_lon})\n")

    # Lista di club di prova con le loro coordinate
    clubs_test = [
        {"nome": "Polisportiva Punta (San Giovanni La Punta)", "lat": 37.5785, "lon": 15.0953},
        {"nome": "Catania Calcio Club (Catania Centro)",        "lat": 37.5079, "lon": 15.0873},
        {"nome": "Acireale Basket (Acireale)",                 "lat": 37.6125, "lon": 15.1656},
        {"nome": "Siracusa Sport (Siracusa)",                  "lat": 37.0755, "lon": 15.2866},
        {"nome": "Messina Tennis (Messina)",                   "lat": 38.1938, "lon": 15.5540},
    ]

    import math
    def calc_haversine(lat1, lon1, lat2, lon2):
        cos_val = (
            math.sin(math.radians(lat1)) * math.sin(math.radians(lat2)) +
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
            math.cos(math.radians(lon2) - math.radians(lon1))
        )
        return 6371.0 * math.acos(max(-1.0, min(1.0, cos_val)))

    for club in clubs_test:
        dist = calc_haversine(parent_lat, parent_lon, club["lat"], club["lon"])
        is_within_20km = dist <= 20.0
        status = "VISIBILE AL GENITORE (<= 20 km)" if is_within_20km else "ESCLUSO (> 20 km)"
        print(f"- {club['nome']:<45} | Distanza: {dist:5.1f} km | {status}")

    print("\n" + "=" * 60)
    print("Test completato con successo!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
