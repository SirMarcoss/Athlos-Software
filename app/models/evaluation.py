import uuid
from typing import TYPE_CHECKING
from sqlalchemy import  ForeignKey, text
from sqlalchemy.sql.sqltypes import Integer, String, Text
from sqlalchemy.sql.schema import CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.child import Child

class Evaluation(Base):
    __tablename__ = "evaluations"


    __table_args__ = (
        CheckConstraint("agility_score >= 0 AND agility_score <= 10", name="chk_agility_valido"),
        CheckConstraint("teamwork_score >= 0 AND teamwork_score <= 10", name="chk_teamwork_valido"),
        CheckConstraint("discipline_score >= 0 AND discipline_score <= 10", name="chk_discipline_valido"),
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

    child_id : Mapped[uuid.UUID] = mapped_column(
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False
    )

    agility_score : Mapped[int] = mapped_column(Integer)

    teamwork_score : Mapped[int] = mapped_column(Integer)

    discipline_score : Mapped[int] = mapped_column(Integer)

    ai_recommended_sport : Mapped[str] = mapped_column(Text, nullable=False)

    coach_notes : Mapped[str] = mapped_column(String(255), nullable=True)

    courses : Mapped["Course"] = relationship("Course", back_populates="evaluations",)
    children : Mapped["Child"] = relationship("Child", back_populates="evaluations",)

    # i cascade non vanno dalla parte dei figli ma solo da quella dei genitori

    def __repr__(self) -> str:
        return f"<Evaluation(id={self.id!r}, child_id={self.child_id!r}, course_id={self.course_id!r})>"
