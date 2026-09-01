from typing import Optional
from sqlalchemy import Enum as SAEnum, DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql.functions import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql.schema import Index
from datetime import datetime
import enum
import uuid
from app.models.base import Base


class UserRoleEnum(enum.Enum):
    PARENT = "parent" #Regular buyer
    CLUB = "club" #Store manager (inventory, orders)
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"


    __table_args__ = (
        Index("idx_users_email", "email", unique=True, postgresql_where=text("deleted_at IS NULL")),
    )


    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[UserRoleEnum] = mapped_column(
        SAEnum(
            UserRoleEnum,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
            name="user_role_enum",
        ),
        nullable=False,
        server_default="parent",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


    def __repr__(self) -> str:
        return f"<User(id={self.id!r}, email={self.email!r}, role={self.role.value!r})>"
    # __repr__ makes the object human-readable when printed in the terminal.
    # Without it, Python would show a useless memory address like:
    # <app.models.product_variants.ProductVariant object at 0x10f3a2b50>
    # With it, you see the actual data — very useful for debugging.
    # -> str is a return type hint: it tells Python (and the developer) that this function returns a string.

