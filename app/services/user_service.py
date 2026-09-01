from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password


class UserService:
    """
    Gestisce tutta la logica di business relativa agli utenti.
    Richiede una AsyncSession iniettata al momento dell'istanziazione.
    """


    def __init__(self, db: AsyncSession):
        self.db = db


    async def get_user_by_email(self, email: str) -> User | None:
        """
        Cerca un utente nel database tramite la sua email.
        Ritorna l'oggetto User di SQLAlchemy se trovato, altrimenti None.
        """
        # Creiamo lo statement SQL (Sintassi SQLAlchemy 2.0)
        stmt = select(User).where(User.email == email)

        # Eseguiamo la query in modo asincrono
        result = await self.db.execute(stmt)

        # Estraiamo il primo risultato (o None se non esiste)
        return result.scalars().first()
        # perchè scalar: PostgreSQL restituisce i dati sotto forma di righe (Tuple)
        # scalar scompatta la tupla e ti restituisce l'oggetto Python pulito (User)


    async def get_user_by_id(self, user_id: str) -> User | None:
        """
        Cerca un utente nel database tramite l'ID.
        Ritorna l'oggetto User di SQLAlchemy se trovato, altrimenti None.
        """
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()


    async def create_user(self, user_in: UserCreate) -> User:
        """
        Crea un nuovo utente.
        Implementa la validazione logica (email duplicata) e l'hashing della password.
        """
        # 1. Validazione di Business: L'email esiste già?
        existing_user = await self.get_user_by_email(user_in.email)
        if existing_user:
            # Solleviamo un'eccezione di dominio pura, non un'eccezione HTTP.
            # Sarà il Router a catturarla e trasformarla in un 400 Bad Request.
            raise ValueError("Un utente con questa email è già registrato.")

        # 2. Sicurezza: Hash della password in chiaro in arrivo da Pydantic
        password_bytes = user_in.password.encode('utf-8')
        if len(password_bytes) > 72:
            # Tronca esattamente a 72 byte e ritrasforma in stringa
            safe_password = password_bytes[:72].decode('utf-8', errors='ignore')
        else:
            safe_password = user_in.password
        hashed_pwd = hash_password(safe_password)

        # 3. Mappatura: Creazione dell'oggetto SQLAlchemy
        db_user = User(
            email=user_in.email,
            password_hash=hashed_pwd,
            first_name=user_in.first_name,
            last_name=user_in.last_name
            # Il campo 'role' non viene passato, quindi PostgreSQL userà il server_default ('parent')
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
        Ritorna l'utente se le credenziali sono valide, altrimenti None.
        """
        # 1. Cerchiamo l'utente
        user = await self.get_user_by_email(email)
        if not user:
            return None

        # 2. Verifichiamo la password confrontando l'hash
        if not verify_password(password, user.password_hash):
            return None

        return user