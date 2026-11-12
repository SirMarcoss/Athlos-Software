from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.club import Club
from app.models.payment import Payment, PaymentStatusEnum
from app.schemas.club import ClubCreate, ClubUpdate
from app.services.geo_service import GeoService
from app.services.places_service import GooglePlacesService
import uuid
from sqlalchemy.sql.functions import func


class ClubService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_club_by_user_id(self, user_id: uuid.UUID) -> Club | None:
        """Recupera il club gestito dall'utente loggato."""


        stmt = select(Club).where(Club.user_id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def get_all_clubs(self) -> list[Club]:
        """Restituisce tutte le società sportive registrate (riservato all'Admin)."""
        stmt = select(Club).order_by(Club.name.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


    async def create_club(self, club_in: ClubCreate, user_id: uuid.UUID) -> Club:
        """Crea il profilo Club."""


        user = await self.get_club_by_user_id(user_id)
        if user:
            raise ValueError("Hai già registrato un Club")

        # TRUCCHETTO PER IL JSONB: Convertiamo l'oggetto Pydantic in un dizionario
        address_data = club_in.address.model_dump() if club_in.address else None

        lat, lon = None, None
        if club_in.address:
            geo_service = GeoService()
            query_str = f"{club_in.address.street}, {club_in.address.postal_code} {club_in.address.city} {club_in.address.province}"
            geo_results = await geo_service.autocomplete(query_str, limit=1)
            if geo_results:
                lat = geo_results[0].latitude
                lon = geo_results[0].longitude
        # se latitude e longitude sono a None, utilizzo il service di geo per
        # ottenerle automaticamente

        places_service = GooglePlacesService()
        query_str = f"{club_in.address.street}, {club_in.address.city}" if club_in.address else ""
        places_info = await places_service.fetch_club_details(club_in.name, query_str)
        # Dati da salvare
        places_data_to_save = places_info if places_info else {}
        website = places_info.get("website_url") if places_info else None
        rating_val = places_info.get("rating") if places_info else None
        # Priorità al telefono inserito dal Club; Google Places usato solo come fallback se vuoto
        final_phone = (club_in.phone_number or "").strip()
        if not final_phone and places_info and places_info.get("phone_number"):
            final_phone = places_info["phone_number"][:20]

        club_db = Club(
            user_id=user_id,
            name=club_in.name,
            email_contact=club_in.email_contact,
            phone_number=final_phone,
            address=address_data,
            logo_url=club_in.logo_url,
            latitude=lat,
            longitude=lon,
            places_data=places_data_to_save,
            website_url=website,
            rating=rating_val,
        )

        self.db.add(club_db)
        await self.db.commit()
        await self.db.refresh(club_db)

        return club_db


    async def update_club(self, club_in: ClubUpdate, user_id: uuid.UUID) -> Club:
        """Aggiorna i dati del Club loggato."""

        # NOTA: model_dump trasforma automaticamente l'Address in dizionario, quindi per SQLAlchemy va benissimo!)
        club = await self.get_club_by_user_id(user_id)
        if not club:
            raise ValueError("Club non trovato")

        update_data = club_in.model_dump(exclude_unset=True)

        # Se il club sta modificando l'indirizzo, ricalcoliamo lat e lon automaticamente con GeoService
        if club_in.address:
            geo_service = GeoService()
            query_str = f"{club_in.address.street}, {club_in.address.postal_code} {club_in.address.city} {club_in.address.province}"
            geo_results = await geo_service.autocomplete(query_str, limit=1)
            if geo_results:
                update_data["latitude"] = geo_results[0].latitude
                update_data["longitude"] = geo_results[0].longitude

        # Se l'indirizzo o il nome cambiano (o se il club non ha ancora i dati places), aggiorniamo Google Places
        should_enrich_places = (
            club_in.address is not None
            or club_in.name is not None
            or club.places_data is None
        )
        if should_enrich_places:
            target_name = update_data.get("name", club.name)
            addr_obj = club_in.address if club_in.address else club.address
            street = ""
            city = ""
            if addr_obj:
                if hasattr(addr_obj, "street"):
                    street = getattr(addr_obj, "street", "") or ""
                    city = getattr(addr_obj, "city", "") or ""
                elif isinstance(addr_obj, dict):
                    street = addr_obj.get("street", "") or ""
                    city = addr_obj.get("city", "") or ""

            query_places = f"{street}, {city}".strip()
            places_service = GooglePlacesService()
            places_info = await places_service.fetch_club_details(target_name, query_places)
            if places_info:
                update_data["places_data"] = places_info
                if places_info.get("website_url"):
                    update_data["website_url"] = places_info["website_url"]
                if places_info.get("rating"):
                    update_data["rating"] = places_info["rating"]
                if places_info.get("phone_number") and not update_data.get("phone_number"):
                    update_data["phone_number"] = places_info["phone_number"]


        for key, value in update_data.items():
            setattr(club, key, value)

        await self.db.commit()
        await self.db.refresh(club)
        return club


    async def delete_club(self, user_id: uuid.UUID) -> None:
        """Elimina il Club loggato verificando l'assenza di pagamenti confermati."""

        club = await self.get_club_by_user_id(user_id)
        if not club:
            raise ValueError("Club non trovato")

        # Controlla pagamenti associati
        stmt_payments = select(Payment).where(Payment.club_id == club.id)
        payments = (await self.db.execute(stmt_payments)).scalars().all()
        if any(p.status == PaymentStatusEnum.SUCCEEDED for p in payments):
            raise ValueError("Impossibile eliminare il centro sportivo: sono presenti transazioni e incassi registrati nello storico contabile.")

        # Elimina eventuali pagamenti pendenti o falliti
        for p in payments:
            await self.db.delete(p)

        await self.db.delete(club)
        await self.db.commit()


    async def get_nearby_clubs(self, lat: float, lon: float, max_distance_km: float = 20.0) -> list[Club]:
        """
        Calcola la distanza sferica (Haversine) tra le coordinate del genitore (lat, lon)
        e le coordinate salvate nei Club, restituendo solo quelli entro 'max_distance_km'.
        """
        R = 6371.0 # Raggio della Terra in chilometri

        # Formula matematica tradotta in logica database (SQLAlchemy func)
        cos_val = (
                func.cos(func.radians(lat)) * func.cos(func.radians(Club.latitude)) *
                func.cos(func.radians(Club.longitude) - func.radians(lon)) +
                func.sin(func.radians(lat)) * func.sin(func.radians(Club.latitude))
        )
        distance_expr = R * func.acos(func.least(1.0, func.greatest(-1.0, cos_val)))

        # Cerca solo club che hanno inserito l'indirizzo, e ordina dal più vicino!
        stmt = select(Club).where(
            Club.latitude.isnot(None),
            Club.longitude.isnot(None),
            distance_expr <= max_distance_km
        ).order_by(distance_expr)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())
