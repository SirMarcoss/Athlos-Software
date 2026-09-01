from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.child import Child
from app.schemas.child import ChildCreate
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