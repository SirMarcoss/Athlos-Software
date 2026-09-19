import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.course import Course

class Sport(Base):
    __tablename__ = "sports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    
    # Storytelling fields for the Wiki
    storytelling_description: Mapped[str] = mapped_column(String(1000), nullable=True)
    fun_facts: Mapped[str] = mapped_column(String(500), nullable=True)
    benefits_summary: Mapped[str] = mapped_column(String(500), nullable=True)
    introductory_video_url: Mapped[str] = mapped_column(String(255), nullable=True)

    courses: Mapped[list["Course"]] = relationship("Course", back_populates="sport")

    def __repr__(self) -> str:
        return f"<Sport(name={self.name!r})>"
