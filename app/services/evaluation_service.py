from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
import uuid

from app.models.evaluation import PhysicalTest, PsychologicalForm
from app.models.course import Course
from app.models.child import Child
from app.models.user import User, UserRoleEnum
from app.schemas.evaluation import EvaluationSessionCreate, EvaluationSessionResponse
from app.services.ai_service import AIService

class EvaluationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.ai_service = AIService()

    async def submit_evaluation_session(
        self,
        session_in: EvaluationSessionCreate,
        course_id: uuid.UUID,
        child_id: uuid.UUID,
        user: User,
        club_id: uuid.UUID | None = None
    ) -> EvaluationSessionResponse:
        """
        Riceve i test fisici e il form psicologico compilati nello stesso giorno dall'allenatore.
        Verifica i permessi, chiama Gemini con il vincolo geografico e salva tutto nel database.
        """

        # 1. VERIFICA CORSO E PERMESSI
        stmt_course = select(Course).where(Course.id == course_id)
        res_course = await self.db.execute(stmt_course)
        course = res_course.scalars().first()
        if not course:
            raise ValueError("Corso non trovato")

        if user.role == UserRoleEnum.CLUB:
            if course.clubs_id != club_id:
                raise ValueError("Corso non appartenente alla tua società sportiva")
        elif user.role != UserRoleEnum.ADMIN:
            raise ValueError("Non autorizzato a valutare")

        # 2. VERIFICA ATLETA
        stmt_child = select(Child).where(Child.id == child_id)
        res_child = await self.db.execute(stmt_child)
        child = res_child.scalars().first()
        if not child:
            raise ValueError("Atleta non trovato")

        # 3. CALCOLO ETÀ IN ANNI
        today = date.today()
        dob = child.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        # 4. PREPARAZIONE DATI PER L'AI (Filtro Geografico)
        # Mock per ora: in produzione faremo query spaziale (PostGIS) sui club nel raggio di 20km
        available_sports_mock = ["Mini-Basket", "Scuola Calcio", "Ginnastica Artistica", "Scherma", "Judo", "Nuoto Formativo"]
        
        # Sintesi dei test fisici da passare all'AI in formato stringa leggibile
        physical_summary = ", ".join([f"{pt.test_type}: {pt.score_value}" for pt in session_in.physical_tests])
        if not physical_summary:
            physical_summary = "Nessun dato fisico inserito"

        # 5. CHIAMATA A GEMINI AI
        ai_sport = await self.ai_service.generate_sport_recommendation(
            child_name=child.first_name,
            child_age=age,
            current_sport=course.name,
            skills=child.skills,
            physical_summary=physical_summary,
            creativity_score=session_in.psychological_form.creativity_score,
            teamwork_score=session_in.psychological_form.teamwork_score,
            stress_management_score=session_in.psychological_form.stress_management_score,
            available_sports=available_sports_mock,
            coach_notes=session_in.coach_notes
        )

        # 6. SALVATAGGIO NEL DATABASE
        # A) Salvataggio PhysicalTests
        saved_tests_count = 0
        for pt_in in session_in.physical_tests:
            db_pt = PhysicalTest(
                course_id=course_id,
                child_id=child_id,
                trimester_id=session_in.session_id,
                test_type=pt_in.test_type,
                score_value=pt_in.score_value
            )
            self.db.add(db_pt)
            saved_tests_count += 1

        # B) Salvataggio PsychologicalForm con il verdetto AI
        db_pf = PsychologicalForm(
            course_id=course_id,
            child_id=child_id,
            trimester_id=session_in.session_id,
            creativity_score=session_in.psychological_form.creativity_score,
            teamwork_score=session_in.psychological_form.teamwork_score,
            stress_management_score=session_in.psychological_form.stress_management_score,
            coach_notes=session_in.coach_notes,
            ai_recommended_sport=ai_sport # 👈 Il verdetto di Gemini costretto ai club locali!
        )
        self.db.add(db_pf)
        
        await self.db.commit()
        await self.db.refresh(db_pf)
        
        return EvaluationSessionResponse(
            session_id=session_in.session_id,
            child_id=child_id,
            physical_tests_saved=saved_tests_count,
            psychological_form_id=db_pf.id,
            ai_recommendation=ai_sport
        )

    async def get_evaluations_for_child(self, child_id: uuid.UUID, parent_id: uuid.UUID) -> list[PsychologicalForm]:
        """Restituisce le schede di valutazione finali per la dashboard famiglia."""
        stmt_child = select(Child).where(Child.id == child_id).where(Child.parent_id == parent_id)
        res_child = await self.db.execute(stmt_child)
        if not res_child.scalars().first():
            raise ValueError("Bambino non trovato o non autorizzato")

        stmt_eval = select(PsychologicalForm).where(PsychologicalForm.child_id == child_id)
        res_eval = await self.db.execute(stmt_eval)
        return list(res_eval.scalars().all())