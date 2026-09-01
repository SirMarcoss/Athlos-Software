from passlib.context import CryptContext
from jose import jwt, ExpiredSignatureError
from jose.exceptions import JWTError
from datetime import datetime, timedelta, timezone
from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    hashed_password = pwd_context.hash(password)
    return hashed_password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "sub": str(data.get("sub")), # User ID
        "iat": datetime.now(timezone.utc),   # Quando è stato emesse issued at
        "exp": expire               # Quando scade
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