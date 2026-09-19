from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRoleEnum
from app.api.deps import require_role
from app.core.database import get_db
from app.schemas.parent import ParentCreate, ParentResponse, ParentUpdate
from app.schemas.club import ClubResponse
from app.services.parent_service import ParentService
from typing import List
from app.services.club_service import ClubService

router = APIRouter()

@router.post("/", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    payload: ParentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """Crea il profilo Genitore per l'utente attualmente loggato."""

    parent_service = ParentService(db)
    try:
        parent = await parent_service.create_parent(payload, current_user.id)
        return parent
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=ParentResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """Restituisce il profilo Genitore dell'utente attualmente loggato."""

    parent_service = ParentService(db)
    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profilo non trovato"
        )
    return parent


@router.patch("/me", response_model=ParentResponse)
async def update_my_profile(
    payload: ParentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """Aggiorna parzialmente il profilo del genitore loggato."""

    parent_service = ParentService(db)
    try:
        parent = await parent_service.update_parent(payload, current_user.id)
        return parent
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """Elimina il profilo del genitore loggato (e a cascata i suoi figli)."""

    parent_service = ParentService(db)
    try:
        await parent_service.delete_parent(current_user.id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
        )


@router.get("/me/referral")
async def get_my_referral(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    """
    Restituisce il link di invito univoco del genitore loggato.
    Se Tizio (referral 'A1B2C3') lo manda a Caio, Caio si iscriverà con ref=A1B2C3.
    """
    parent_service = ParentService(db)
    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent or not parent.referral_code:
        raise HTTPException(status_code=404, detail="Codice referral non trovato")

    # Restituiamo direttamente un link comodo da copiare
    referral_link = f"https://athlos.it/register?ref={parent.referral_code}"
    return {"referral_code": parent.referral_code, "link": referral_link}


# Ecco perché si usa /me (che in inglese significa "Me stesso / Il mio"): È una convenzione universale.
# Dice all'API: "Non ti passo nessun ID nell'URL. Guarda chi è l'utente autenticato dentro il Token JWT
# che ti ho allegato negli Headers,e fai l'operazione sul SUO profilo


@router.get("/me/nearby-clubs", response_model=List[ClubResponse])
async def get_my_nearby_clubs(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.PARENT))
):
    parent_service = ParentService(db)
    club_service = ClubService(db)

    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Genitore non trovato")

    # 1. Prevenzione crash: verifichiamo che l'indirizzo esista
    lat, lon = parent.latitude, parent.longitude
    if lat is None or lon is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Devi inserire il tuo indirizzo nel profilo per cercare i club limitrofi.")

    clubs = await club_service.get_nearby_clubs(lat, lon)

    return clubs
