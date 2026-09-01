from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildUpdate
import uuid

class ChildService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_child(self, child_in: ChildCreate, parent_id: uuid.UUID) -> Child:
        """Crea un bambino."""

        db_child = Child(
            parent_id=parent_id,
            first_name=child_in.first_name,
            last_name=child_in.last_name,
            date_of_birth=child_in.date_of_birth,
            gender=child_in.gender,
            sport=child_in.sport,
            skills=child_in.skills,
            fiscal_code=child_in.fiscal_code,
            medical_notes=child_in.medical_notes,
            info=child_in.info
        )
        self.db.add(db_child)
        await self.db.commit()
        await self.db.refresh(db_child)
        return db_child


    async def get_children_by_parent(self, parent_id: uuid.UUID) -> list[Child]:
        """Restituisce i figli dato un parent_id."""
        stmt = select(Child).where(Child.parent_id == parent_id)
        child = await self.db.execute(stmt)
        return list(child.scalars().all())


    async def get_child_by_id_and_parent(self, child_id: uuid.UUID, parent_id: uuid.UUID) -> Child | None:
        """Utility: Trova un bambino specifico, assicurandosi che appartenga a quel genitore."""

        stmt = select(Child).where(Child.id == child_id).where(Child.parent_id == parent_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def update_child(self, child_id: uuid.UUID, child_in: ChildUpdate, parent_id: uuid.UUID) -> Child:
        """Aggiorna i dati di un bambino."""
        # 1. Trova il bambino (e verifica che sia del genitore)
        db_child = await self.get_child_by_id_and_parent(child_id, parent_id)
        if not db_child:
            raise ValueError("Bambino non trovato o non autorizzato")
        # 2. Estrai solo i campi inviati (ignora quelli che il frontend non ha mandato)
        update_data = child_in.model_dump(exclude_unset=True)
        # 3. Aggiorna dinamicamente i campi dell'oggetto SQLAlchemy
        for key, value in update_data.items():
            setattr(db_child, key, value)  # È come scrivere db_child.name = value, ma dinamico!

        await self.db.commit()
        await self.db.refresh(db_child)
        return db_child


    async def delete_child(self, child_id: uuid.UUID, parent_id: uuid.UUID) -> None:
        """Elimina un bambino dal database."""

        stmt = select(Child).where(Child.id == child_id).where(Child.parent_id == parent_id)
        result = await self.db.execute(stmt)
        child = result.scalars().first()
        if not child:
            raise ValueError("Bambino non trovato")

        await self.db.delete(child)
        await self.db.commit()