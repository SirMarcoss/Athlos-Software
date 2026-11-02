import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql.functions import func
from app.models.base import Base


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "pending"       # Sessione Stripe creata, in attesa che il genitore paghi
    COMPLETED = "completed"   # Pagamento confermato dal Webhook Stripe -> Iscrizione attiva!
    FAILED = "failed"         # Pagamento fallito o sessione scaduta
    REFUNDED = "refunded"     # Eventuale rimborso


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    # Chi ha pagato, per quale figlio, in quale club e per quale corso
    parent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("parents.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("children.id", ondelete="RESTRICT"), nullable=False
    )
    club_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clubs.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False
    )

    # --- SNAPSHOT DUAL-PRICING AL MOMENTO DELL'ACQUISTO ---
    # 1. Quanto ha pagato il genitore (es. 9500 = 95,00 €) -> mostrato SOLO al Genitore
    parent_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    # 2. Quanto spetta al club (es. 9000 = 90,00 €) -> mostrato SOLO al Club come "denaro in arrivo"
    club_amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    # 3. Margine trattenuto da Athlos (es. 500 = 5,00 €) -> per la contabilità interna Athlos
    athlos_fee_cents: Mapped[int] = mapped_column(Integer, nullable=False)

    currency: Mapped[str] = mapped_column(String(3), nullable=False, server_default=text("'eur'"))

    status: Mapped[PaymentStatusEnum] = mapped_column(
        Enum(PaymentStatusEnum, name="payment_status_enum"),
        nullable=False,
        default=PaymentStatusEnum.PENDING
    )

    # --- RIFERIMENTI STRIPE (Per riconciliazione e idempotenza) ---
    # unique=True impedisce che un webhook inviato due volte da Stripe processi due volte lo stesso pagamento
    stripe_checkout_session_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True
    )

    # Numero ricevuta leggibile (es. "ATH-2026-A1B2C3")
    receipt_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )