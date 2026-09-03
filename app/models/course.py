import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.club import Club
    from app.models.evaluation import Evaluation

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

    coach_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    name : Mapped[str] = mapped_column(String(100), nullable=False)

    min_age: Mapped[int]

    max_age : Mapped[int]


    clubs : Mapped["Club"] = relationship("Club", back_populates="courses")

    evaluations : Mapped[list["Evaluation"]] = relationship("Evaluation", back_populates="courses",
                                      cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Course(id={self.id!r}, name={self.name!r}, club_id={self.clubs_id!r})>"
