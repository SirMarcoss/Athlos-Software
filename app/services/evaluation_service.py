from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.parent import Parent
from app.services.email_service import EmailService
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

        # 4. PREPARAZIONE SPORT DISPONIBILI (Discipline attive nel centro sportivo e strutture limitrofe)
        stmt_names = select(Course.name).distinct()
        res_names = await self.db.execute(stmt_names)
        active_sports = [row[0] for row in res_names.all() if row[0]]

        available_sports = active_sports if active_sports else ["Basket", "Calcio", "Pallavolo", "Nuoto", "Ginnastica Artistica", "Judo", "Scherma", "Tennis"]
        
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
            leadership_score=session_in.psychological_form.leadership_score,
            game_reading_score=session_in.psychological_form.game_reading_score,
            motivation_score=session_in.psychological_form.motivation_score,
            available_sports=available_sports,
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
            leadership_score=session_in.psychological_form.leadership_score,
            game_reading_score=session_in.psychological_form.game_reading_score,
            motivation_score=session_in.psychological_form.motivation_score,
            coach_notes=session_in.coach_notes,
            ai_recommended_sport=ai_sport
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


    async def get_physical_tests_for_child(self, child_id: uuid.UUID, parent_id: uuid.UUID) -> list[PhysicalTest]:
        stmt_child = select(Child).where(Child.id == child_id).where(Child.parent_id == parent_id)
        res_child = await self.db.execute(stmt_child)
        if not res_child.scalars().first():
            raise ValueError("Bambino non trovato o non autorizzato")

        stmt_eval = select(PhysicalTest).where(PhysicalTest.child_id == child_id)
        res_eval = await self.db.execute(stmt_eval)
        return list(res_eval.scalars().all())

    async def get_evaluations_for_course(self, course_id: uuid.UUID, club_id: uuid.UUID) -> list[PsychologicalForm]:
        """Restituisce le schede trimestrali salvate per un determinato corso verificando la proprietà."""
        stmt_course = select(Course).where(Course.id == course_id)
        res_course = await self.db.execute(stmt_course)
        course = res_course.scalars().first()
        if not course:
            raise ValueError("Corso non trovato")
        if course.clubs_id != club_id:
            raise ValueError("Non sei autorizzato a visualizzare i dati di questo corso")

        stmt = select(PsychologicalForm).where(PsychologicalForm.course_id == course_id)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


    async def get_physical_tests_for_course(self, course_id: uuid.UUID, club_id: uuid.UUID) -> list[PhysicalTest]:
        """Restituisce tutti i test motori registrati per un determinato corso verificando la proprietà."""
        stmt_course = select(Course).where(Course.id == course_id)
        res_course = await self.db.execute(stmt_course)
        course = res_course.scalars().first()
        if not course:
            raise ValueError("Corso non trovato")
        if course.clubs_id != club_id:
            raise ValueError("Non sei autorizzato a visualizzare i dati di questo corso")

        stmt = select(PhysicalTest).where(PhysicalTest.course_id == course_id)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


    async def send_evaluation_email_to_parent(
        self,
        evaluation_id: uuid.UUID,
        club_id: uuid.UUID,
        user: User
    ) -> bool:
        """
        Recupera la scheda di valutazione, verifica i permessi del club,
        trova il genitore associato al bambino e invia l'email tramite EmailService.
        """
        # 1. Recupera la PsychologicalForm per ID
        stmt_eval = select(PsychologicalForm).where(PsychologicalForm.id == evaluation_id)
        res_eval = await self.db.execute(stmt_eval)
        eval_form = res_eval.scalars().first()
        if not eval_form:
            raise ValueError("Scheda di valutazione non trovata")

        # 2. Recupera il corso e verifica la sicurezza multi-tenancy del club
        stmt_course = select(Course).where(Course.id == eval_form.course_id)
        res_course = await self.db.execute(stmt_course)
        course = res_course.scalars().first()
        if not course:
            raise ValueError("Corso associato alla valutazione non trovato")

        if user.role == UserRoleEnum.CLUB and course.clubs_id != club_id:
            raise ValueError("Non autorizzato a inviare l'email per un corso di un'altra società")
        elif user.role not in [UserRoleEnum.CLUB, UserRoleEnum.ADMIN]:
            raise ValueError("Ruolo non autorizzato all'invio")

        # 3. Recupera l'atleta (Child)
        stmt_child = select(Child).where(Child.id == eval_form.child_id)
        res_child = await self.db.execute(stmt_child)
        child = res_child.scalars().first()
        if not child:
            raise ValueError("Atleta non trovato")

        # 4. Recupera il profilo genitore (Parent) e l'account collegato (User) per avere l'email
        stmt_parent = select(Parent).where(Parent.id == child.parent_id)
        res_parent = await self.db.execute(stmt_parent)
        parent = res_parent.scalars().first()
        if not parent:
            raise ValueError("Profilo genitore non associato a questo atleta")

        stmt_user = select(User).where(User.id == parent.user_id)
        res_user = await self.db.execute(stmt_user)
        parent_user = res_user.scalars().first()
        if not parent_user or not parent_user.email:
            raise ValueError("Indirizzo email del genitore non presente nel database")

        # 5. Recupera i test motori svolti per questo corso e trimestre
        stmt_tests = select(PhysicalTest).where(
            PhysicalTest.course_id == eval_form.course_id,
            PhysicalTest.child_id == eval_form.child_id,
            PhysicalTest.trimester_id == eval_form.trimester_id
        )
        res_tests = await self.db.execute(stmt_tests)
        tests = res_tests.scalars().all()
        if tests:
            physical_summary = ", ".join([f"{t.test_type}: {t.score_value}" for t in tests])
        else:
            physical_summary = "Nessun test motorio registrato per questo trimestre."

        # 6. Prepara il dizionario con tutti e 6 i punteggi
        scores = {
            "creativity": eval_form.creativity_score,
            "teamwork": eval_form.teamwork_score,
            "stress": eval_form.stress_management_score,
            "leadership": eval_form.leadership_score,
            "game_reading": eval_form.game_reading_score,
            "motivation": eval_form.motivation_score,
        }

        # 7. Invio effettivo tramite EmailService
        email_service = EmailService()
        return email_service.send_evaluation_email_to_parent(
            parent_email=parent_user.email,
            parent_name=f"{parent.first_name} {parent.last_name}",
            child_name=f"{child.first_name} {child.last_name}",
            course_name=course.name,
            trimester_id=eval_form.trimester_id,
            scores=scores,
            physical_summary=physical_summary,
            ai_recommendation=eval_form.ai_recommended_sport or "Valutazione completata con successo.",
            coach_notes=eval_form.coach_notes
        )
