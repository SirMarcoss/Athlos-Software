import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text, UniqueConstraint, DateTime
from sqlalchemy.sql.functions import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
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
