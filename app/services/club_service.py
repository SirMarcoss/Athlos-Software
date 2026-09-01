from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.club import Club
from app.schemas.club import ClubCreate
import uuid


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
            logo_url=club_in.logo_url
        )

        self.db.add(club_db)
        await self.db.commit()
        await self.db.refresh(club_db)

        return club_db
