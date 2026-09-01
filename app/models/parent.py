import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.child import Child


class Parent(Base):
    __tablename__ = "parents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    first_name : Mapped[str] = mapped_column(String(100), nullable=False)

    last_name : Mapped[str] = mapped_column(String(100), nullable=False)

    phone_number : Mapped[str] = mapped_column(String(20), nullable=False)

    fiscal_code : Mapped[str] = mapped_column(String(16), nullable=False)

    info: Mapped[str] = mapped_column(String(255), nullable=True)

    children : Mapped[list["Child"]] = relationship("Child", back_populates="parents",
                                      cascade="all, delete-orphan")

    user: Mapped["User"] = relationship("User", back_populates="parents")


    def __repr__(self) -> str:
        return (
            f"Club_id = {self.id!r},"
            f"first_name = {self.first_name!r},"
            f"last_name = {self.last_name!r}"
            f"phone_number = {self.phone_number!r}"
        )