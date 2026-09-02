from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate
import uuid

class CourseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_course_by_id(self, course_id: uuid.UUID) -> Course | None:
        """Trova un corso dato il suo ID."""
        stmt = select(Course).where(Course.id == course_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def create_course(self, course_in: CourseCreate, club_id: uuid.UUID) -> Course:
        """Crea un nuovo corso per un determinato club."""

        # Per Parent e Club facevamo il controllo di esistenza perché sono relazioni 1-a-1:
        # un utente può avere UN SOLO profilo genitore e UN SOLO club.
        # E lì cercavamo tramite user_id (che già conoscevamo dal token). Perché NON ha senso per Course?
        # La relazione tra Club e Corsi è 1-a-Molti (1-to-N): una società sportiva può (e deve!) creare tanti corsi

        stmt = select(Course).where(Course.clubs_id == club_id).where(Course.name == course_in.name)
        result = await self.db.execute(stmt)
        if result.scalars().first():
            raise ValueError("Hai già creato un corso con questo nome")

        db_course = Course(
            clubs_id=club_id,
            name=course_in.name,
            min_age=course_in.min_age,
            max_age=course_in.max_age
        )
        self.db.add(db_course)
        await self.db.commit()
        await self.db.refresh(db_course)
        return db_course


    async def get_courses_by_club(self, club_id: uuid.UUID) -> list[Course]:
        """Restituisce tutti i corsi appartenenti a un club specifico."""

        stmt = select(Course).where(Course.clubs_id == club_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_courses(self, skip: int = 0, limit: int = 20) -> list[Course]:
        """Restituisce il catalogo generale dei corsi con paginazione."""
        # Ecco come si fa la paginazione in SQLAlchemy 2.0:
        stmt = select(Course).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


    async def update_course(self, course_id: uuid.UUID, course_in: CourseUpdate, club_id: uuid.UUID) -> Course:
        """Aggiorna un corso, verificando che appartenga al club loggato."""

        stmt = select(Course).where(Course.id == course_id).where(Course.clubs_id == club_id)
        result = await self.db.execute(stmt)
        course = result.scalars().first()
        if not course:
            raise ValueError("Corso non trovato o non autorizzato")

        update_data = course_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(course, key, value)

        await self.db.commit()
        await self.db.refresh(course)
        return course


    async def delete_course(self, course_id: uuid.UUID, club_id: uuid.UUID) -> None:
        """Elimina un corso verificando l'ownership."""

        stmt = select(Course).where(Course.id == course_id).where(Course.clubs_id == club_id)
        result = await self.db.execute(stmt)
        course = result.scalars().first()
        if not course:
            raise ValueError("Corso non trovato o non autorizzato")

        await self.db.delete(course)
        await self.db.commit()


