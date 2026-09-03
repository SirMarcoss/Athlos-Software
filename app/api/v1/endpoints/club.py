from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRoleEnum
from app.api.deps import require_role
from app.core.database import get_db
from app.schemas.club import ClubCreate, ClubResponse, ClubUpdate
from app.schemas.user import UserCreate, UserResponse
from app.services.club_service import ClubService
from app.services.user_service import UserService

router = APIRouter()

@router.post("/", response_model=ClubResponse, status_code=status.HTTP_201_CREATED)
async def create_my_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
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
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Restituisce il Club dell'utente loggato."""

    club_service = ClubService(db)
    club = await club_service.get_club_by_user_id(current_user.id)
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
        detail="Club non esistente.")
    return club


@router.patch("/me", response_model=ClubResponse)
async def update_my_club(
    payload: ClubUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Aggiorna parzialmente il Club dell'utente loggato."""

    club_service = ClubService(db)

    try:
        club = await club_service.update_club(payload, current_user.id)
        return club
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )



@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_club(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Elimina il Club dell'utente loggato (e i suoi corsi associati)."""

    club_service = ClubService(db)

    try:
        await club_service.delete_club(current_user.id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
        )


@router.post("/coaches", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_coach_for_club(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Il Club registra un nuovo account allenatore per il proprio staff."""
    user_service = UserService(db)
    try:
        coach_user = await user_service.create_user(payload, role=UserRoleEnum.COACH)
        return coach_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))