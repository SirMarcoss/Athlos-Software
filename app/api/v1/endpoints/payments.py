from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User, UserRoleEnum
from app.schemas.payment import (
    CheckoutSessionCreateRequest,
    CheckoutSessionResponse,
    PaymentParentResponse,
    PaymentClubResponse,
)
from app.services.payment_service import PaymentService
from app.services.parent_service import ParentService
from app.services.club_service import ClubService

router = APIRouter()


@router.post("/checkout-session", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(
    payload: CheckoutSessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """
    Avvia il pagamento per l'iscrizione di un figlio a un corso (riservato ai GENITORI).
    Restituisce l'URL di Stripe Checkout per pagare il prezzo Genitore (es. 95€).
    """
    parent_service = ParentService(db)
    payment_service = PaymentService(db)
    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profilo genitore non trovato")

    try:
        return await payment_service.create_checkout_session(parent.id, payload.course_id, payload.child_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint chiamato direttamente dai server di Stripe (Server-to-Server).
    Legge i byte grezzi per verificare la firma HMAC-SHA256 e conferma l'iscrizione.
    """

    paylode_bytes = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    payment_service = PaymentService(db)
    try:
        return await payment_service.handle_stripe_webhook(paylode_bytes, sig_header)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/parent/me", response_model=List[PaymentParentResponse])
async def list_my_parent_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """
    Restituisce lo storico ricevute del GENITORE loggato.
    Ogni ricevuta mostra esclusivamente il prezzo pagato dal genitore (es. 95€).
    """
    parent_service = ParentService(db)
    payment_service = PaymentService(db)
    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profilo genitore non trovato")
    return await payment_service.get_parent_payments(parent.id)


@router.get("/club/me", response_model=List[PaymentClubResponse])
async def list_my_club_payments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """
    Restituisce il registro incassi in arrivo per il CLUB SPORTIVO loggato.
    Ogni movimento mostra esclusivamente l'importo concordato col club (es. 90€).
    """
    club_service, payment_service = ClubService(db), PaymentService(db)
    club = await club_service.get_club_by_user_id(current_user.id)
    if club is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profilo club non trovato")
    return await payment_service.get_club_payments(club.id)