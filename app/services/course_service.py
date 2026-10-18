from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.course import Course, CourseEnrollment
from app.models.child import Child
from app.models.club import Club
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


    async def get_courses_within_radius(
        self,
        lat: float,
        lon: float,
        max_km: float = 20.0,
        skip: int = 0,
        limit: int = 20
    ) -> list[tuple[Course, float]]:
        """
        Restituisce i corsi dei club entro il raggio chilometrico specificato (default 20 km),
        calcolato tramite la formula di Haversine / legge sferica dei coseni in SQL puro.
        Ritorna una lista di tuple (Course, distance_km) ordinate per distanza crescente.
        """
        cos_val = (
            func.sin(func.radians(lat)) * func.sin(func.radians(Club.latitude)) +
            func.cos(func.radians(lat)) * func.cos(func.radians(Club.latitude)) *
            func.cos(func.radians(Club.longitude) - func.radians(lon))
        )
        clamped_cos = func.least(1.0, func.greatest(-1.0, cos_val))
        distance_expr = (6371.0 * func.acos(clamped_cos)).label("distance_km")

        stmt = (
            select(Course, distance_expr)
            .join(Club, Course.clubs_id == Club.id)
            .where(Club.latitude.isnot(None))
            .where(Club.longitude.isnot(None))
            .where(distance_expr <= max_km)
            .order_by(distance_expr.asc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.all())


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


    async def enroll_child_in_course(
        self,
        course_id: uuid.UUID,
        child_id: uuid.UUID,
        club_id: uuid.UUID
    ) -> CourseEnrollment:
        """
        Iscrive un bambino a un corso sportivo verificando la proprietà del club
        ed evitando doppie iscrizioni.
        """
        # 1. Verifica che il corso esista e appartenga al club loggato
        course = await self.get_course_by_id(course_id)
        if not course:
            raise ValueError("Corso non trovato")
        if course.clubs_id != club_id:
            raise ValueError("Non autorizzato a modificare questo corso")

        # 2. Verifica che l'atleta esista nel database
        stmt_child = select(Child).where(Child.id == child_id)
        res_child = await self.db.execute(stmt_child)
        child = res_child.scalars().first()
        if not child:
            raise ValueError("Atleta non trovato")

        # 3. Verifica se è già iscritto
        stmt_check = select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.child_id == child_id
        )
        res_check = await self.db.execute(stmt_check)
        if res_check.scalars().first():
            raise ValueError(f"{child.first_name} {child.last_name} è già iscritto a questo corso")

        # 4. Creazione dell'iscrizione
        enrollment = CourseEnrollment(
            course_id=course_id,
            child_id=child_id
        )
        self.db.add(enrollment)
        await self.db.commit()
        await self.db.refresh(enrollment)
        return enrollment


    async def get_course_athletes(
        self,
        course_id: uuid.UUID,
        club_id: uuid.UUID
    ) -> list[Child]:
        """
        Restituisce tutti gli atleti (Child) iscritti a un determinato corso del club.
        """
        course = await self.get_course_by_id(course_id)
        if not course:
            raise ValueError("Corso non trovato")
        if course.clubs_id != club_id:
            raise ValueError("Non autorizzato a visualizzare gli atleti di questo corso")

        # Join tra Child e CourseEnrollment filtrato per course_id
        stmt = (
            select(Child)
            .join(CourseEnrollment, CourseEnrollment.child_id == Child.id)
            .where(CourseEnrollment.course_id == course_id)
            .order_by(Child.last_name, Child.first_name)
        )
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


    async def unenroll_child_from_course(
        self,
        course_id: uuid.UUID,
        child_id: uuid.UUID,
        club_id: uuid.UUID
    ) -> bool:
        """
        Rimuove un atleta dal corso sportivo.
        """
        course = await self.get_course_by_id(course_id)
        if not course:
            raise ValueError("Corso non trovato")
        if course.clubs_id != club_id:
            raise ValueError("Non autorizzato")

        stmt = select(CourseEnrollment).where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.child_id == child_id
        )
        res = await self.db.execute(stmt)
        enrollment = res.scalars().first()
        if not enrollment:
            raise ValueError("Iscrizione non trovata")

        await self.db.delete(enrollment)
        await self.db.commit()
        return True


