from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User, UserRoleEnum
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password
from app.core.security import create_password_reset_token, verify_password_reset_token
from app.services.email_service import EmailService
import uuid


class UserService:
    """
    Gestisce tutta la logica di business relativa agli utenti.
    Richiede una AsyncSession iniettata al momento dell'istanziazione.
    """


    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_user_by_email(self, email: str, include_deleted: bool = False) -> User | None:
        """
        Cerca un utente nel database tramite la sua email.
        Di default esclude gli utenti soft-deleted (deleted_at IS NOT NULL).
        """
        stmt = select(User).where(func.lower(User.email) == email.strip().lower())
        if not include_deleted:
            stmt = stmt.where(User.deleted_at.is_(None))

        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_deleted_user_by_email(self, email: str) -> User | None:
        """Cerca se esiste un utente disattivato/eliminato tramite email."""
        stmt = select(User).where(
            func.lower(User.email) == email.strip().lower(),
            User.deleted_at.isnot(None)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_user_by_id(self, user_id: str | uuid.UUID, include_deleted: bool = False) -> User | None:
        """
        Cerca un utente nel database tramite l'ID.
        Di default esclude gli utenti soft-deleted.
        """
        stmt = select(User).where(User.id == user_id)
        if not include_deleted:
            stmt = stmt.where(User.deleted_at.is_(None))
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def create_user(self, user_in: UserCreate, role: UserRoleEnum = UserRoleEnum.PARENT) -> User:
        """
        Crea un nuovo utente.
        Implementa la validazione logica (email duplicata) e l'hashing della password.
        """
        # 1. Validazione di Business: L'email esiste già tra gli account attivi?
        existing_user = await self.get_user_by_email(user_in.email)
        if existing_user:
            raise ValueError("Un utente con questa email è già registrato.")

        # Controllo account precedentemente disattivato/eliminato (Scelta 1)
        deleted_user = await self.get_deleted_user_by_email(user_in.email)
        if deleted_user:
            raise ValueError("ACCOUNT_DELETED: Questa email appartiene a un account precedentemente disattivato. Contatta l'assistenza Athlos per richiederne la riattivazione.")

        # 2. Sicurezza: Hash della password in chiaro in arrivo da Pydantic
        hashed_pwd = hash_password(user_in.password)

        # 3. Mappatura: Creazione dell'oggetto SQLAlchemy
        db_user = User(
            email=user_in.email.strip().lower(),
            password_hash=hashed_pwd,
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            role = role
        )

        # 4. Persistenza: Transazione asincrona
        self.db.add(db_user)
        await self.db.commit()  # Salva fisicamente su disco RAM --> commit --> SQLAlchemy --> PostgreSQL --> Disco

        # Se tu restituissi al frontend l'oggetto new_order subito dopo il commit, senza fare il refresh,
        # FastAPI andrebbe in crash, dicendo: "Non riesco a leggere 'created_at', l'oggetto è scaduto".
        # per motivi di estrema sicurezza, SQLAlchemy fa scadere (expire) l'oggetto Python che hai in memoria RAM.
        await self.db.refresh(db_user)  # Ricarica l'oggetto per ottenere l'ID (UUID) generato dal DB

        return db_user


    async def authenticate_user(self, email: str, password: str) -> User | None:
        """
        Verifica le credenziali di un utente per il login.
        Ritorna l'utente se le credenziali sono valide, solleva ValueError se eliminato, altrimenti None.
        """
        # 1. Cerchiamo l'utente attivo
        user = await self.get_user_by_email(email)
        if not user:
            # Controllo se l'email appartiene a un account eliminato
            deleted_user = await self.get_deleted_user_by_email(email)
            if deleted_user:
                raise ValueError("ACCOUNT_DELETED: Questo account risulta eliminato. Contatta l'assistenza Athlos per richiederne la riattivazione.")
            return None

        # 2. Verifichiamo la password confrontando l'hash
        if not verify_password(password, user.password_hash):
            return None

        return user


    async def get_all_users(self) ->list[User]:
        """Restituisce tutti gli utenti attivi registrati (usato dalla dashboard Admin)."""

        stmt = select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


    async def request_password_reset(self, email: str) -> None:
        """
        Cerca l'utente per email, genera il token monouso di reset e invia l'email tramite Resend.
        Seguendo le linee guida OWASP, se l'email non esiste ritorna silenziosamente per evitare user enumeration.
        """
        # 1. Cerchiamo l'utente nel database tramite l'email inserita nel form
        user = await self.get_user_by_email(email.strip())
        if not user:
            return

        # 2. Generiamo il token JWT temporaneo (15 min) firmato con l'impronta della password attuale
        token = create_password_reset_token(user.email, user.password_hash)

        # 3. Istanziamo EmailService (con le parentesi () per eseguire __init__ e caricare RESEND_API_KEY)
        #    e spediamo l'email con il codice di recupero
        email_service = EmailService()
        await email_service.send_password_reset_email(
            to_email=user.email,
            first_name=user.first_name,
            reset_token=token
        )


    async def reset_password(self, email: str, token: str, new_password: str) -> User:
        """
        Verifica il token di reset ricevuto via email e aggiorna la password dell'utente nel database.
        """
        # 1. Cerchiamo l'utente nel database tramite l'email
        user = await self.get_user_by_email(email.strip())
        if not user:
            raise ValueError("Nessun account trovato con questo indirizzo email.")

        # 2. Verifichiamo che il codice OTP a 6 cifre sia autentico, non sia scaduto (max 15 min)
        #    e non sia già stato usato (confrontando l'HMAC con user.password_hash attuale)
        payload = verify_password_reset_token(
            token=token,
            current_password_hash=user.password_hash,
            email=user.email
        )

        # 3. Verifichiamo che il token sia stato emesso proprio per questa email ("sub")
        token_email = str(payload.get("sub", "")).strip().lower()
        if token_email != user.email.strip().lower():
            raise ValueError("Il codice inserito non corrisponde a questo indirizzo email.")

        # 4. Eseguiamo l'hash sicuro (bcrypt) della nuova password scelta dall'utente
        hashed_pwd = hash_password(new_password)

        # 5. Salviamo il nuovo hash nel database: da questo istante il vecchio token diventa inutilizzabile!
        user.password_hash = hashed_pwd
        await self.db.commit()
        await self.db.refresh(user)

        return user