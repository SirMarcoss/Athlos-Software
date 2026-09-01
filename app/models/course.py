import uuid
from typing import TYPE_CHECKING
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

    name : Mapped[str] = mapped_column(String(100), nullable=False)

    min_age: Mapped[int]

    max_age : Mapped[int]


    clubs : Mapped["Club"] = relationship("Club", back_populates="courses")

    evaluations : Mapped[list["Evaluation"]] = relationship("Evaluation", back_populates="courses",
                                      cascade="all, delete-orphan")
