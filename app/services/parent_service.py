from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.parent import Parent
from app.schemas.parent import ParentCreate, ParentUpdate
import uuid

class ParentService:
    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_parent_by_user_id(self, user_id: uuid.UUID) -> Parent | None:
        """Recupera il profilo genitore tramite l'ID dell'utente."""

        stmt = select(Parent).where(Parent.user_id == user_id)
        parent = await self.db.execute(stmt)
        return parent.scalars().first()


    async def create_parent(self, parent_in: ParentCreate, user_id: uuid.UUID) -> Parent:
        """Crea il profilo genitore collegato all'account."""

        existing_parent = await self.get_parent_by_user_id(user_id)
        if existing_parent:
            raise ValueError("Profilo già esistente")

        db_parent =  Parent(
            user_id=user_id, #database non può assolutamente sapere a quale utente appartiene questo
            # nuovo profilo Genitore, non può inventarselo! Devi dirglielo tu.
            # il deps.py riesce a prendere l'id dell'utente tramite JWT --> noi lo inseriamo nella creazione
            first_name=parent_in.first_name,
            last_name=parent_in.last_name,
            phone_number=parent_in.phone_number,
            fiscal_code=parent_in.fiscal_code,
            info=parent_in.info
        )
        self.db.add(db_parent)
        await self.db.commit()
        await self.db.refresh(db_parent)
        return db_parent


    async def update_parent(self, parent_in: ParentUpdate, user_id: uuid.UUID) -> Parent:
        """Aggiorna i dati del genitore loggato."""

        parent  = await self.get_parent_by_user_id(user_id)
        if not parent:
            raise ValueError("Profilo genitore non trovato")

        update_data = parent_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(parent, key, value)

        await self.db.commit()
        await self.db.refresh(parent)
        return parent


    async def delete_parent(self, user_id: uuid.UUID) -> None:
        """Elimina il profilo genitore collegato all'utente."""

        parent = await self.get_parent_by_user_id(user_id)
        if not parent:
            raise ValueError("Profilo genitore non trovato")

        await self.db.delete(parent)
        await self.db.commit()