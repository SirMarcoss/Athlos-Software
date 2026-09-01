import bcrypt
from jose import jwt, ExpiredSignatureError
from jose.exceptions import JWTError
from datetime import datetime, timedelta, timezone
from app.core.config import settings

# --- NUOVA GESTIONE BCRYPT (Senza passlib) ---

def hash_password(password: str) -> str:
    # 1. Convertiamo in byte
    pwd_bytes = password.encode('utf-8')
    # 2. Creiamo il "sale" (salt) crittografico e hash
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    # 3. Ritorniamo come stringa per salvarlo nel database
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 1. Convertiamo entrambe in byte
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    # 2. bcrypt fa il confronto sicuro
    return bcrypt.checkpw(plain_bytes, hashed_bytes)

# --- IL RESTO RIMANE UGUALE (JWT Token) ---

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "sub": str(data.get("sub")),
        "iat": datetime.now(timezone.utc),
        "exp": expire
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_access_token(token: str)-> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None or sub == "None":
            raise ValueError("Token missing 'sub' claim")
        return payload
    except ExpiredSignatureError:
        raise ValueError("Token expired")
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")