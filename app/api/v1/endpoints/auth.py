from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRoleEnum
from app.api.deps import get_current_user, require_role
from app.schemas.user import UserCreate, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.services.user_service import UserService
from app.core.database import get_db
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.core.security import create_access_token
from uuid import UUID
from datetime import timedelta

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
        if "ACCOUNT_DELETED" in str(e):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e).replace("ACCOUNT_DELETED: ", "")
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# LOGIN
class Token(BaseModel):
    access_token: str
    token_type: str

# validazione pydantic per il token JWT


@router.post("/login", response_model=Token)
async def login_user(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: AsyncSession = Depends(get_db)
):
    """
    Endpoint per autenticare un utente e restituire un JWT.
    """
    user_service = UserService(db)
    try:
        user = await user_service.authenticate_user(form_data.username, form_data.password)
    except ValueError as e:
        if "ACCOUNT_DELETED" in str(e):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e).replace("ACCOUNT_DELETED: ", "")
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenziali non valide o utente non trovato",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": str(user.id)})
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
        if "ACCOUNT_DELETED" in str(e):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(e).replace("ACCOUNT_DELETED: ", "")
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/users", response_model=list[UserResponse], status_code=status.HTTP_200_OK)
async def list_all_users(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(require_role(UserRoleEnum.ADMIN))
):
    """Restituisce la lista di tutti gli utenti (Solo per ADMIN)."""

    user_service = UserService(db)
    return await user_service.get_all_users()


@router.post("/impersonate/{user_id}", response_model=Token, status_code=status.HTTP_200_OK)
async def impersonate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRoleEnum.ADMIN))
):
    """Genera un token JWT per entrare nell'account di qualsiasi Genitore o Club (Solo per ADMIN)."""

    user_service = UserService(db)
    target_user = await user_service.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente da impersonare non trovato"
        )

    if target_user.role == UserRoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Non è consentito impersonare un altro amministratore'
        )



    # 1. Generazione del JWT per l'utente scelto (target_user):
    # - "sub" (Subject) indica chi è il titolare del token. Inserendo l'ID di target_user,
    #   la dipendenza get_current_user (in deps.py) caricherà automaticamente dal DB
    #   il profilo di quel Genitore o di quel Club in tutte le chiamate successive.
    # - Forziamo str() perché target_user.id è un oggetto UUID di PostgreSQL, mentre
    #   la libreria crittografica JOSE richiede una stringa JSON valida.
    access_token = create_access_token(data={"sub": str(target_user.id),
                                             "impersonated_by": str(current_user.id)},
                                       expires_delta=timedelta(minutes=30))

    # 2. Restituzione del token secondo lo standard OAuth2 (validato dallo schema Token):
    # - "access_token": la stringa JWT firmata con la SECRET_KEY che il Front-End userà temporaneamente.
    # - "token_type": "bearer" ("al portatore"), indica al Front-End di inviare il token
    #   nell'header HTTP "Authorization: Bearer <access_token>".
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
        payload: ForgotPasswordRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Endpoint per richiedere il codice di recupero password via email.
    Risponde sempre con esito generico positivo per prevenire l'enumerazione degli utenti.
    """
    user_service = UserService(db)
    try:
        await user_service.request_password_reset(payload.email)
    except Exception as e:
        print(f"[Auth] Errore invio email reset password: {e}")

    return {
        "message": "Se l'indirizzo email è registrato, riceverai un'email con il codice di sicurezza."
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
        payload: ResetPasswordRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Endpoint chiamato dallo Step 2 del modal Front-End per verificare il codice e salvare la nuova password.
    """
    user_service = UserService(db)
    try:
        await user_service.reset_password(
            email=payload.email,
            token=payload.token,
            new_password=payload.new_password
        )
        return {"message": "Password aggiornata con successo. Ora puoi effettuare il login."}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


