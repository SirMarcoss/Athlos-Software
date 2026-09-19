from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.club import Club
from app.schemas.club import ClubCreate, ClubUpdate
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


    async def create_club(self, club_in: ClubCreate, user_id: uuid.UUID) -> Club:
        """Crea il profilo Club."""


        user = await self.get_club_by_user_id(user_id)
        if user:
            raise ValueError("Hai già registrato un Club")

        # TRUCCHETTO PER IL JSONB: Convertiamo l'oggetto Pydantic in un dizionario
        address_data = club_in.address.model_dump() if club_in.address else None

        club_db = Club(
            user_id=user_id,
            name=club_in.name,
            email_contact=club_in.email_contact,
            phone_number=club_in.phone_number,
            address=address_data,
            logo_url=club_in.logo_url,
            latitude=club_in.latitude,
            longitude=club_in.longitude
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
        for key, value in update_data.items():
            setattr(club, key, value)

        await self.db.commit()
        await self.db.refresh(club)
        return club


    async def delete_club(self, user_id: uuid.UUID) -> None:
        """Elimina il Club loggato."""

        club = await self.get_club_by_user_id(user_id)
        if not club:
            raise ValueError("Club non trovato")

        await self.db.delete(club)
        await self.db.commit()


    async def get_nearby_clubs(self, lat: float, lon: float, max_distance_km: int = 15) -> list[Club]:
        """
        Calcola la distanza sferica (Haversine) tra le coordinate del genitore (lat, lon)
        e le coordinate salvate nei Club, restituendo solo quelli entro 'max_distance_km'.
        """
        R = 6371.0 # Raggio della Terra in chilometri

        # Formula matematica tradotta in logica database (SQLAlchemy func)
        distance_expr = (
            R * func.acos(
                func.cos(func.radians(lat)) * func.cos(func.radians(Club.latitude)) *
                func.cos(func.radians(Club.longitude) - func.radians(lon)) +
                func.sin(func.radians(lat)) * func.sin(func.radians(Club.latitude))
            )
        )

        # Cerca solo club che hanno inserito l'indirizzo, e ordina dal più vicino!
        stmt = select(Club).where(
            Club.latitude.isnot(None),
            Club.longitude.isnot(None),
            distance_expr <= max_distance_km
        ).order_by(distance_expr)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())
