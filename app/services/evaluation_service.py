from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
import uuid

from app.models.evaluation import Evaluation
from app.models.course import Course
from app.models.child import Child
from app.models.user import User, UserRoleEnum
from app.schemas.evaluation import EvaluationCreate
from app.services.ai_service import AIService

class EvaluationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = AIService()

    async def create_evaluation(
        self,
        eval_in: EvaluationCreate,
        course_id: uuid.UUID,
        child_id: uuid.UUID,
        user: User,
        club_id: uuid.UUID | None = None
    ) -> Evaluation:
        """Verifica le ownership (Club o Coach assegnato), interroga Gemini e archivia la valutazione."""

        # 1. VERIFICA CORSO E PERMESSI
        stmt_course = select(Course).where(Course.id == course_id)
        res_course = await self.db.execute(stmt_course)
        course = res_course.scalars().first()
        if not course:
            raise ValueError("Corso non trovato")

        if user.role == UserRoleEnum.CLUB:
            if course.clubs_id != club_id:
                raise ValueError("Corso non appartenente alla tua società sportiva")
        elif user.role == UserRoleEnum.COACH:
            if course.coach_id != user.id:
                raise ValueError("Non sei l'allenatore assegnato a questo corso")
        elif user.role != UserRoleEnum.ADMIN:
            raise ValueError("Non autorizzato a valutare")

        # 2. VERIFICA ATLETA: Il bambino esiste nel database?
        stmt_child = select(Child).where(Child.id == child_id)
        res_child = await self.db.execute(stmt_child)
        child = res_child.scalars().first()
        if not child:
            raise ValueError("Atleta non trovato")

        # 3. CALCOLO ETÀ IN ANNI
        today = date.today()
        dob = child.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # 4. CHIAMATA A GEMINI AI
        ai_sport = await self.ai_service.generate_sport_recommendation(
            child_name=child.first_name,
            child_age=age,
            current_sport=course.name,
            skills=child.skills,
            agility_score=eval_in.agility_score,
            teamwork_score=eval_in.teamwork_score,
            discipline_score=eval_in.discipline_score,
            coach_notes=eval_in.coach_notes
        )

        # 5. CREAZIONE RECORD EVALUATION
        db_eval = Evaluation(
            course_id=course_id,
            child_id=child_id,
            agility_score=eval_in.agility_score,
            teamwork_score=eval_in.teamwork_score,
            discipline_score=eval_in.discipline_score,
            coach_notes=eval_in.coach_notes,
            ai_recommended_sport=ai_sport # 👈 Il verdetto di Gemini!
        )

        self.db.add(db_eval)
        await self.db.commit()
        await self.db.refresh(db_eval)
        return db_eval

    async def get_evaluations_for_child(self, child_id: uuid.UUID, parent_id: uuid.UUID) -> list[Evaluation]:
        """Permette al genitore di vedere lo storico delle pagelle del proprio figlio."""
        # 1. Verifica che il bambino appartenga al genitore loggato
        stmt_child = select(Child).where(Child.id == child_id).where(Child.parent_id == parent_id)
        res_child = await self.db.execute(stmt_child)
        if not res_child.scalars().first():
            raise ValueError("Bambino non trovato o non autorizzato")

        # 2. Prendi tutte le valutazioni di quel bambino
        stmt_eval = select(Evaluation).where(Evaluation.child_id == child_id)
        res_eval = await self.db.execute(stmt_eval)
        return list(res_eval.scalars().all())