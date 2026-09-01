from datetime import date
import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text, DATE
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.parent import Parent
    from app.models.evaluation import Evaluation

class Child(Base):
    __tablename__ = "children"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    parent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("parents.id", ondelete="CASCADE"),
        nullable=False
    )

    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(DATE, nullable=False)
    gender : Mapped[str] = mapped_column(String(10), nullable=False)
    sport : Mapped[str] = mapped_column(String(255), nullable=False)
    skills : Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False)
    fiscal_code: Mapped[str] = mapped_column(String(16), nullable=False)
    medical_notes : Mapped[str] = mapped_column(String(255), nullable=True)
    info : Mapped[str] = mapped_column(String(255), nullable=True)

    parents: Mapped["Parent"] = relationship("Parent", back_populates="children",
                                      cascade="all, delete-orphan")

    evaluations : Mapped[list["Evaluation"]] = relationship("Evaluation", back_populates="children",
                                      cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return (
            f"Club_id = {self.id!r},"
            f"first_name = {self.first_name!r},"
            f"last_name = {self.last_name!r},"
            f"sport = {self.sport!r},"
            f"skills = {self.skills!r}"
        )

