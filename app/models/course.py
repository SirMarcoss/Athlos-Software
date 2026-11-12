import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text, UniqueConstraint, DateTime, Integer, select
from sqlalchemy.sql.functions import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, column_property
from app.models.base import Base
from datetime import datetime

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
        nullable=True,
        default=None
    )

    name : Mapped[str] = mapped_column(String(100), nullable=False)

    min_age: Mapped[int]

    max_age : Mapped[int]

    clubs : Mapped["Club"] = relationship("Club", back_populates="courses")
    sport: Mapped["Sport"] = relationship("Sport", back_populates="courses")

    physical_tests : Mapped[list["PhysicalTest"]] = relationship("PhysicalTest", back_populates="courses", cascade="all, delete-orphan")
    psychological_forms : Mapped[list["PsychologicalForm"]] = relationship("PsychologicalForm", back_populates="courses", cascade="all, delete-orphan")

    # Prezzo pattuito con il Club (in centesimi, es. 9000 = 90.00 €).
    # È l'unico importo che il Club vedrà nella propria interfaccia.
    club_price_cents: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("9000"))

    # Prezzo finale mostrato e addebitato al Genitore (in centesimi, es. 9500 = 95.00 €).
    # È l'unico importo che il Genitore vedrà e pagherà su Stripe.
    parent_price_cents : Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("9500"))

    max_participants: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("20"))

    billing_period: Mapped[str] = mapped_column(String(30), nullable=False, server_default=text("'trimestrale'"))


    def __repr__(self) -> str:
        return f"<Course(id={self.id!r}, name={self.name!r}, club_id={self.clubs_id!r})>"


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"
    __table_args__ = (
        UniqueConstraint("course_id", "child_id", name="uq_course_child_enrollment"),
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("children.id", ondelete="CASCADE"), nullable=False
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


# Calcola dinamicamente il numero di iscritti attivi a livello SQL per ogni corso
Course.enrolled_count = column_property(
    select(func.count(CourseEnrollment.id))
    .where(CourseEnrollment.course_id == Course.id)
    .correlate_except(CourseEnrollment)
    .scalar_subquery()
)
