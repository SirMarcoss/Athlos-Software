from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.parent import ParentCreate, ParentResponse, ParentUpdate
from app.services.parent_service import ParentService

router = APIRouter()

@router.post("/", response_model=ParentResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    payload: ParentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
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
    current_user: User = Depends(get_current_user)
):
    """Elimina il profilo del genitore loggato (e a cascata i suoi figli)."""

    parent_service = ParentService(db)
    try:
        await parent_service.delete_parent(current_user.id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
        )


# Ecco perché si usa /me (che in inglese significa "Me stesso / Il mio"): È una convenzione universale.
# Dice all'API: "Non ti passo nessun ID nell'URL. Guarda chi è l'utente autenticato dentro il Token JWT
# che ti ho allegato negli Headers,e fai l'operazione sul SUO profilo