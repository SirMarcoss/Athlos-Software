from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.parent import ParentCreate, ParentResponse
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

