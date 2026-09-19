import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.club import Club
    from app.models.evaluation import PhysicalTest, PsychologicalForm
    from app.models.sport import Sport

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    clubs_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False
    )
    
    sport_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sports.id", ondelete="RESTRICT"),
        nullable=False
    )

    name : Mapped[str] = mapped_column(String(100), nullable=False)

    min_age: Mapped[int]

    max_age : Mapped[int]

    clubs : Mapped["Club"] = relationship("Club", back_populates="courses")
    sport: Mapped["Sport"] = relationship("Sport", back_populates="courses")

    physical_tests : Mapped[list["PhysicalTest"]] = relationship("PhysicalTest", back_populates="courses", cascade="all, delete-orphan")
    psychological_forms : Mapped[list["PsychologicalForm"]] = relationship("PsychologicalForm", back_populates="courses", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Course(id={self.id!r}, name={self.name!r}, club_id={self.clubs_id!r})>"
