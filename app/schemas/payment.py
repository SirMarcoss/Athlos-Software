from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.payment import PaymentStatusEnum


class CheckoutSessionCreateRequest(BaseModel):
    """Payload inviato dal Genitore per avviare il pagamento di un corso per un figlio."""
    course_id : UUID
    child_id : UUID


class CheckoutSessionResponse(BaseModel):
    """Risposta che restituisce al frontend l'URL di pagamento Stripe."""
    checkout_url : str
    session_id : str
    payment_id : UUID


class PaymentParentResponse(BaseModel):
    """
    Schema ricevuta per il GENITORE (vede solo quanto ha pagato lui, es. 95€).
    """

    id : UUID
    course_id : UUID
    course_name : str
    club_name : str
    child_id : UUID
    child_name : str
    child_fiscal_code: str
    amount_cents : int              #(conterrà parent_amount_cents, es. 9500)
    billing_period : str
    status: PaymentStatusEnum
    receipt_number : str
    created_at : datetime
    completed_at : Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaymentClubResponse(BaseModel):
    """
    Schema incasso per il CLUB SPORTIVO (vede solo il denaro in arrivo a lui, es. 90€).
    """

    id : UUID
    course_id : UUID
    course_name : str
    child_id : UUID
    child_name : str
    child_fiscal_code : str
    parent_fiscal_code: Optional[str] = None
    parent_name : str
    parent_email : str
    amount_cents : int              #(conterrà club_amount_cents, es. 9000)
    billing_period : str
    status: PaymentStatusEnum
    receipt_number : str
    created_at : datetime
    completed_at : Optional[datetime] = None


    model_config = ConfigDict(from_attributes=True)