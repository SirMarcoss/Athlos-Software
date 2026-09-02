from app.core.database import get_db
from app.services.user_service import UserService
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_access_token
from app.models.user import User, UserRoleEnum


# Questo è il "segugio" di FastAPI.
# tokenUrl indica a FastAPI dove si trova la porta d'ingresso.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db)
):
    """
    Dipendenza che legge il token, lo verifica e restituisce l'utente autenticato.
    """

    # Centralizziamo l'errore per rispettare il principio DRY (Don't Repeat Yourself)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide o token scaduto",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_service = UserService(db)
    try:
        verified_token = verify_access_token(token)
        user_id = verified_token.get("sub")
        if user_id is None:
            raise credentials_exception

    except ValueError:  # Cattura l'errore che lancia la tua verify_access_token
        raise credentials_exception

    # 3. Cerca l'utente nel database tramite l'ID (user_id)
    # Suggerimento: dovrai creare un metodo get_user_by_id nel UserService
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise credentials_exception
    return user


def require_role(*allowed_roles: UserRoleEnum):
    """
    Dipendenza riutilizzabile per proteggere gli endpoint in base al ruolo.
    Uso: Depends(require_role(UserRoleEnum.PARENT))
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Se l'utente è un ADMIN, lo lasciamo passare sempre (superpoteri!)
        if current_user.role == UserRoleEnum.ADMIN:
            return current_user

        # Se il suo ruolo non è tra quelli ammessi, blocchiamo la richiesta
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accesso negato. Questa azione richiede uno dei seguenti ruoli: {[r.value for r in allowed_roles]}"
            )
        return current_user

    return role_checker