from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRoleEnum
from app.api.deps import require_role, get_optional_current_user
from app.core.database import get_db
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services.course_service import CourseService
from app.services.club_service import ClubService
from app.services.parent_service import ParentService

router = APIRouter()


# --- 1. CATALOGO CORSI (CON FILTRO GEOGRAFICO A 20 KM PER GENITORI) ---

@router.get("/", response_model=List[CourseResponse])
async def list_all_courses(
        skip: int = 0,
        limit: int = 20,
        latitude: Optional[float] = Query(None, description="Latitudine di ricerca opzionale"),
        longitude: Optional[float] = Query(None, description="Longitudine di ricerca opzionale"),
        max_distance_km: float = Query(20.0, ge=1.0, le=100.0, description="Raggio massimo in km"),
        db: AsyncSession = Depends(get_db),
        current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Catalogo corsi:
    - Se l'utente è un genitore loggato (o specifica coordinate), visualizza solo i corsi
      delle società sportive entro il raggio stabilito (default 20 km), calcolati con la formula di Haversine in SQL.
    - Altrimenti, restituisce il catalogo generale paginato.
    """
    course_service = CourseService(db)

    search_lat = latitude
    search_lon = longitude

    # Se non sono state passate coordinate esplicite ma c'è un genitore loggato, usiamo quelle del suo profilo
    if search_lat is None or search_lon is None:
        if current_user and current_user.role == UserRoleEnum.PARENT:
            parent_service = ParentService(db)
            parent = await parent_service.get_parent_by_user_id(current_user.id)
            if parent and parent.latitude is not None and parent.longitude is not None:
                search_lat = parent.latitude
                search_lon = parent.longitude
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Il tuo profilo genitore non ha ancora un indirizzo con coordinate. Aggiorna il tuo profilo per visualizzare i corsi entro 20 km."
                )

    # Se abbiamo coordinate valide, filtriamo con Haversine nel raggio massimo
    if search_lat is not None and search_lon is not None:
        results = await course_service.get_courses_within_radius(
            lat=search_lat,
            lon=search_lon,
            max_km=max_distance_km,
            skip=skip,
            limit=limit
        )
        courses_response = []
        for course, dist in results:
            resp = CourseResponse.model_validate(course)
            resp.distance_km = round(dist, 1)
            courses_response.append(resp)
        return courses_response

    # Nessuna coordinata: catalogo generale
    courses = await course_service.get_all_courses(skip=skip, limit=limit)
    return [CourseResponse.model_validate(c) for c in courses]


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