from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.club import ClubCreate, ClubResponse
from app.services.club_service import ClubService

router = APIRouter()

@router.post("/", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
async def create_my_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crea un nuovo Club associato all'utente loggato."""

    club_service = ClubService(db)
    try:
        club = await club_service.create_club(payload, current_user.id)
        return club
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me", response_model=ClubResponse)
async def get_my_club(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Restituisce il Club dell'utente loggato."""

    club_service = ClubService(db)
    club = await club_service.get_club_by_user_id(current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
        detail="Club non esistente.")
    return club