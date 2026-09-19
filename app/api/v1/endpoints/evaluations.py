from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRoleEnum
from app.api.deps import require_role
from app.core.database import get_db
from app.schemas.evaluation import EvaluationSessionCreate, EvaluationSessionResponse, PsychologicalFormResponse
from app.services.evaluation_service import EvaluationService
from app.services.club_service import ClubService
from app.services.parent_service import ParentService

router = APIRouter()

# --- LATO CLUB: Invia tutta la sessione di valutazione in un colpo solo ---

@router.post("/course/{course_id}/child/{child_id}/session", response_model=EvaluationSessionResponse, status_code=status.HTTP_201_CREATED)
async def submit_evaluation_session(
    course_id: UUID,
    child_id: UUID,
    payload: EvaluationSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.CLUB))
):
    """
    L'allenatore inserisce i test fisici eseguiti in giornata e compila il form psicologico.
    Il backend unisce i dati, interroga Gemini con il vincolo geografico e salva la scheda ufficiale.
    """
    club_service = ClubService(db)
    eval_service = EvaluationService(db)

    club_id = None
    if current_user.role == UserRoleEnum.CLUB:
        club = await club_service.get_club_by_user_id(current_user.id)
        if not club:
            raise HTTPException(status_code=400, detail="Profilo società sportiva non trovato")
        club_id = club.id

    try:
        session_response = await eval_service.submit_evaluation_session(
            session_in=payload,
            course_id=course_id,
            child_id=child_id,
            user=current_user,
            club_id=club_id
        )
        return session_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore generazione Passaporto AI: {str(e)}")


# --- LATO GENITORE: Consulta le pagelle del proprio figlio ---

@router.get("/child/{child_id}", response_model=List[PsychologicalFormResponse])
async def get_child_evaluations(
    child_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.PARENT)) 
):
    """Il genitore consulta lo storico delle schede psicologiche trimestrali con il consiglio AI per il proprio figlio."""
    parent_service = ParentService(db)
    eval_service = EvaluationService(db)

    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(status_code=400, detail="Profilo genitore non trovato")

    try:
        return await eval_service.get_evaluations_for_child(child_id=child_id, parent_id=parent.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))