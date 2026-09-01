import uuid
from typing import Any, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.course import Course


class Club(Base):
    __tablename__ = "clubs"

    # 1. Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    # 2. Relazione con l'utente: Ogni club è gestito da un User
    # 'ondelete="CASCADE"' significa che se cancelli l'utente, sparisce anche il suo club.
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    name : Mapped[str] = mapped_column(String(100), nullable=False)

    address : Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=True)

    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)

    email_contact : Mapped[str] = mapped_column(String(255), nullable=False)

    logo_url: Mapped[str] = mapped_column(String(255), nullable=True)

    user : Mapped["User"] = relationship("User", back_populates="clubs")

    courses : Mapped[list["Course"]] = relationship("Course",
                                                    back_populates="clubs",
                                                    cascade="all, delete-orphan")



    def __repr__(self) -> str:
        return (
            f"Club_id = {self.id!r},"
            f" name = {self.name!r},"
            f"address = {self.address!r}"
        )
