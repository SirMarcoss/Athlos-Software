from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRoleEnum
from app.api.deps import require_role
from app.core.database import get_db
from app.schemas.evaluation import EvaluationCreate, EvaluationResponse
from app.services.evaluation_service import EvaluationService
from app.services.club_service import ClubService
from app.services.parent_service import ParentService

router = APIRouter()

# --- 1. LATO CLUB: Invia la valutazione e genera il consiglio AI ---

@router.post("/course/{course_id}/child/{child_id}", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def submit_evaluation(
    course_id: UUID,
    child_id: UUID,
    payload: EvaluationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB, UserRoleEnum.COACH)) # 👈 Club o Coach assegnato!
):
    """L'allenatore (o il Club) invia i voti: il server interroga l'AI e genera lo sport consigliato."""
    club_service = ClubService(db)
    eval_service = EvaluationService(db)

    club_id = None
    if current_user.role == UserRoleEnum.CLUB:
        club = await club_service.get_club_by_user_id(current_user.id)
        if not club:
            raise HTTPException(status_code=400, detail="Profilo società sportiva non trovato")
        club_id = club.id

    try:
        evaluation = await eval_service.create_evaluation(
            eval_in=payload,
            course_id=course_id,
            child_id=child_id,
            user=current_user,
            club_id=club_id
        )
        return evaluation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore generazione valutazione AI: {str(e)}")


# --- 2. LATO GENITORE: Consulta le pagelle del proprio figlio ---

@router.get("/child/{child_id}", response_model=List[EvaluationResponse])
async def get_child_evaluations(
    child_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT)) # 👈 I GENITORI leggono le pagelle!
):
    """Il genitore consulta lo storico delle pagelle e i consigli AI per il proprio figlio."""
    parent_service = ParentService(db)
    eval_service = EvaluationService(db)

    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(status_code=400, detail="Profilo genitore non trovato")

    try:
        return await eval_service.get_evaluations_for_child(child_id=child_id, parent_id=parent.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))