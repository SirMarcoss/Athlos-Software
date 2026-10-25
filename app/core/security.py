import bcrypt
import hashlib
import hmac
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
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": expire
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_access_token(token: str)-> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") == "password_reset":
            raise ValueError("Un token di recupero password non può essere usato come token di accesso.")
        sub: str = payload.get("sub")
        if sub is None or sub == "None":
            raise ValueError("Token missing 'sub' claim")
        return payload
    except ExpiredSignatureError:
        raise ValueError("Token expired")
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


# --- RECUPERO PASSWORD (CODICE OTP BREVE E LEGGIBILE, STATELESS E MONOUSO) ---

# Protezione anti-brute-force in memoria: traccia i timestamp dei tentativi errati per ciascuna email
_OTP_FAILED_ATTEMPTS: dict[str, list[float]] = {}


def _compute_otp_for_minute(email: str, current_password_hash: str, minute_bucket: int) -> str:
    """
    Genera un codice numerico a 6 cifre (o alfanumerico breve) deterministico per uno specifico minuto,
    firmato crittograficamente con HMAC-SHA256 usando:
    - SECRET_KEY del server
    - email dell'utente
    - password_hash attuale dell'utente (così appena cambia la password, il codice diventa subito invalido/monouso!)
    - minute_bucket (il minuto Unix in cui è stato generato)
    """
    clean_email = email.strip().lower()
    message = f"pwd_reset:{clean_email}:{current_password_hash}:{minute_bucket}".encode("utf-8")
    digest = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        message,
        hashlib.sha256
    ).digest()
    # Estraiamo un intero a 32 bit dal digest HMAC (come nello standard RFC 6238 TOTP) e formattiamo a 6 cifre
    code_int = int.from_bytes(digest[:4], byteorder="big") % 1_000_000
    return f"{code_int:06d}"


def create_password_reset_token(email: str, current_password_hash: str, expires_minutes: int = 15) -> str:
    """
    Genera un codice OTP breve e leggibile a 6 cifre (es. '482910'), valido per 15 minuti e monouso.
    Non richiede tabelle extra nel database perché è firmato con HMAC-SHA256 sull'hash della password attuale.
    """
    current_minute = int(datetime.now(timezone.utc).timestamp() // 60)
    return _compute_otp_for_minute(email, current_password_hash, current_minute)


def verify_password_reset_token(
    token: str,
    current_password_hash: str | None = None,
    email: str | None = None,
    expires_minutes: int = 15
) -> dict:
    """
    Verifica il codice OTP a 6 cifre ricevuto via email controllando la finestra temporale degli ultimi 15 minuti.
    Non appena la password viene aggiornata nel DB, `current_password_hash` cambia e il codice diventa
    immediatamente inutilizzabile una seconda volta (monouso).
    """
    cleaned_token = token.strip().replace(" ", "").replace("-", "")
    if not cleaned_token.isdigit() or len(cleaned_token) != 6:
        raise ValueError("Il codice di recupero deve essere composto da 6 cifre numeriche.")

    if not email or not current_password_hash:
        raise ValueError("Dati utente mancanti per la verifica del codice.")

    now_ts = datetime.now(timezone.utc).timestamp()
    email_key = email.strip().lower()
    recent_failures = [
        t for t in _OTP_FAILED_ATTEMPTS.get(email_key, [])
        if now_ts - t < expires_minutes * 60
    ]
    _OTP_FAILED_ATTEMPTS[email_key] = recent_failures
    if len(recent_failures) >= 5:
        raise ValueError("Troppi tentativi errati. Attendi 15 minuti o richiedi un nuovo codice.")

    current_minute = int(now_ts // 60)

    # Controlliamo se il codice corrisponde a uno qualsiasi degli ultimi `expires_minutes` minuti
    for offset in range(expires_minutes + 1):
        candidate_code = _compute_otp_for_minute(email, current_password_hash, current_minute - offset)
        if hmac.compare_digest(cleaned_token, candidate_code):
            _OTP_FAILED_ATTEMPTS.pop(email_key, None)
            return {"sub": email_key, "type": "password_reset"}

    _OTP_FAILED_ATTEMPTS.setdefault(email_key, []).append(now_ts)
    raise ValueError("Codice di recupero errato, scaduto (validità 15 minuti) o già utilizzato.")

