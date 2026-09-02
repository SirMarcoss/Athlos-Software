from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRoleEnum
from app.api.deps import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService
from app.core.database import get_db
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.core.security import create_access_token


# Creiamo il router
router = APIRouter() # starta il router


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
# POST: richiesta di scrittura nel path ...marketplace.com\register
# response_model: specifica che la risposta deve essere un UserRead (pydantic validation)
# status_code: specifica il codice HTTP da restituire
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # Depends: richiede l'apertura di una sessione del db. tale verrà chiusa solo quando sarà ritornato un valore
    # HTTP specifico. Rimane aperta tramite lo yield
    # payload = informazioni effettive dell'utente. le verifica subito tramite la classe UserCreate (hash, pydantic...)
    user_service = UserService(db)
    try:
        # FastAPI "tenta" di eseguire la creazione
        user = await user_service.create_user(payload)
        return user

    except ValueError as e:
        # Se il Service lancia un ValueError, il codice salta immediatamente qui.
        # Catturiamo l'errore nella variabile 'e' e lo trasformiamo in un errore HTTP pulito.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)  # Questo stamperà esattamente la stringa definita nel Service
        )


# LOGIN
class Token(BaseModel):
    access_token: str
    token_type: str

# validazione pydantic per il token JWT


@router.post("/login", response_model=Token)
async def login_user(
        form_data: OAuth2PasswordRequestForm = Depends(), # standard per il login, richiede due campi:
        # username e password (da validare)
        db: AsyncSession = Depends(get_db) # richiede l'apertura di una sessione del db' 1 volta per tutte le richieste
):
    """
    Endpoint per autenticare un utente e restituire un JWT.
    """

    user_service = UserService(db) # istanziamo il service per l'autenticazione
    user = await user_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password",
                            headers={"WWW-Authenticate": "Bearer"})

    access_token = create_access_token(data={"sub": str(user.id)}) # creiamo il token JWT
    # forzo str perchè l'ID di PostgreSQL è un oggetto UUID ed è
    # sempre buona norma passare stringhe pulite alle librerie crittografiche come JOSE

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_profile(
        current_user: User = Depends(get_current_user)
):
    """
    Restituisce le informazioni del profilo dell'utente attualmente autenticato.
    FastAPI usa 'UserRead' per serializzare i dati, nascondendo l'hash della password.
    Nel momento in cui un utente aggiorna la pagina, il front-end rimarrebbe solo col token senza
    sapere di che utente sia. questo endpoint verrà subito richiamato all'apertura di una nuova
    pagina dal front-end in modo tale da autenticare l'utente
    """
    return current_user


@router.post("/register-club", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_club_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registra un account aziendale per una società sportiva."""
    user_service = UserService(db)
    try:
        user = await user_service.create_user(payload, role=UserRoleEnum.CLUB)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))