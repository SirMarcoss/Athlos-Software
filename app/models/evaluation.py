import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, text
from sqlalchemy.sql.sqltypes import Integer, String, Text, DateTime
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.schema import CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.child import Child

class PhysicalTest(Base):
    __tablename__ = "physical_tests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False
    )

    child_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False
    )

    test_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "scatto_20m", "salto_in_lungo"
    score_value: Mapped[float] = mapped_column(nullable=False)
    
    trimester_id: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., "Q1_2026"
    
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    courses: Mapped["Course"] = relationship("Course", back_populates="physical_tests")
    children: Mapped["Child"] = relationship("Child", back_populates="physical_tests")

    def __repr__(self) -> str:
        return f"<PhysicalTest(id={self.id!r}, test_type={self.test_type!r}, child_id={self.child_id!r})>"


class PsychologicalForm(Base):
    __tablename__ = "psychological_forms"

    __table_args__ = (
        CheckConstraint("creativity_score >= 0 AND creativity_score <= 10", name="chk_creativity_valido"),
        CheckConstraint("teamwork_score >= 0 AND teamwork_score <= 10", name="chk_teamwork_valido"),
        CheckConstraint("stress_management_score >= 0 AND stress_management_score <= 10", name="chk_stress_valido"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False
    )

    child_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False
    )

    trimester_id: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., "Q1_2026"
    
    creativity_score: Mapped[int] = mapped_column(Integer)
    teamwork_score: Mapped[int] = mapped_column(Integer)
    stress_management_score: Mapped[int] = mapped_column(Integer)

    coach_notes: Mapped[str] = mapped_column(String(255), nullable=True)
    ai_recommended_sport: Mapped[str] = mapped_column(Text, nullable=True) # Computed at end of trimester

    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    courses: Mapped["Course"] = relationship("Course", back_populates="psychological_forms")
    children: Mapped["Child"] = relationship("Child", back_populates="psychological_forms")

    def __repr__(self) -> str:
        return f"<PsychologicalForm(id={self.id!r}, child_id={self.child_id!r}, trimester={self.trimester_id!r})>"
