from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRoleEnum
from app.api.deps import require_role
from app.core.database import get_db
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services.course_service import CourseService
from app.services.club_service import ClubService

router = APIRouter()


# --- 1. CATALOGO PUBBLICO / PER GENITORI ---

@router.get("/", response_model=List[CourseResponse])
async def list_all_courses(
        skip: int = 0,
        limit: int = 20,
        db: AsyncSession = Depends(get_db)
):
    """Catalogo pubblico con paginazione: chiunque può vedere i corsi attivi."""

    course_service = CourseService(db)
    return await course_service.get_all_courses(skip=skip, limit=limit)


# --- 2. GESTIONE CORSI PER I CLUB ---

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
        payload: CourseCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.CLUB))  # 👈 Solo i CLUB!
):
    """Crea un nuovo corso offerto dal Club loggato."""

    club_service = ClubService(db)
    course_service = CourseService(db)

    # 1. Recuperiamo il profilo club dell'utente loggato
    club = await club_service.get_club_by_user_id(current_user.id)
    if not club:
        raise HTTPException(status_code=400, detail="Devi prima creare il profilo della società sportiva")

    # 2. Creiamo il corso associandolo al suo club
    return await course_service.create_course(payload, club.id)


@router.get("/my", response_model=List[CourseResponse])
async def list_my_club_courses(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Restituisce solo i corsi creati dalla società loggata."""

    club_service = ClubService(db)
    course_service = CourseService(db)

    club = await club_service.get_club_by_user_id(current_user.id)
    if not club:
        raise HTTPException(status_code=400, detail="Profilo club non trovato")

    return await course_service.get_courses_by_club(club.id)


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_my_course(
        course_id: UUID,
        payload: CourseUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Aggiorna un corso del club."""

    club_service = ClubService(db)
    course_service = CourseService(db)

    club = await club_service.get_club_by_user_id(current_user.id)
    if not club:
        raise HTTPException(status_code=400, detail="Profilo club mancante")

    try:
        course = await course_service.update_course(course_id, payload, club.id)
        return course
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_course(
        course_id: UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """Elimina un corso del club."""

    club_service = ClubService(db)
    course_service = CourseService(db)

    club = await club_service.get_club_by_user_id(current_user.id)
    if not club:
        raise HTTPException(status_code=400, detail="Profilo club mancante")

    try:
        course = await course_service.delete_course(course_id, club.id)
        return course
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND)