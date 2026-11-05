from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import Optional, Literal
from uuid import UUID

BillingPeriodType = Literal["trimestrale", "mensile", "annuale", "quota_unica"]


class CourseCreate(BaseModel):
    name: str = Field(max_length=100)
    min_age: int = Field(ge=5)
    max_age: int = Field(le=13)
    # Quando il club (o lo staff) crea il corso, inserisce il prezzo pattuito per il club (es. 9000 = 90€)
    club_price_cents: int = Field(default=9000, ge=0, description="Prezzo concordato col club in centesimi")
    # Se parent_price_cents non viene specificato in creazione, nel service puoi inizializzarlo
    # uguale a club_price_cents o con un markup di default, finché l'Admin Athlos non lo imposta (es. 9500 = 95€)
    parent_price_cents: Optional[int] = Field(default=None, ge=0)
    max_participants: int = Field(default=20, ge=1, le=500)
    billing_period: BillingPeriodType = "trimestrale"


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    min_age: Optional[int] = Field(default=None, ge=5)
    max_age: Optional[int] = Field(default=None, le=13)
    # Il club può aggiornare il proprio prezzo concordato o la capienza, ma NON parent_price_cents
    club_price_cents: Optional[int] = Field(default=None, ge=0)
    max_participants: Optional[int] = Field(default=None, ge=1, le=500)
    billing_period: Optional[BillingPeriodType] = None


class AdminCoursePricingUpdate(BaseModel):
    """
    Schema usato ESCLUSIVAMENTE da un dipendente/Admin Athlos per impostare:
    - club_price_cents (es. 9000 -> 90,00 € che vedrà il club)
    - parent_price_cents (es. 9500 -> 95,00 € che vedrà e pagherà il genitore)
    """
    club_price_cents: int = Field(..., ge=0)
    parent_price_cents: int = Field(..., ge=0)


class _CourseBaseResponse(BaseModel):
    id: UUID
    clubs_id: UUID
    name: str
    min_age: int
    max_age: int
    max_participants: int
    billing_period: str
    enrolled_count: int = 0
    distance_km: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class CourseParentResponse(_CourseBaseResponse):
    """
    Schema restituito AI GENITORI (GET /courses/).
    Espone `price_cents` leggendo `parent_price_cents` (es. 9500).
    NON include mai `club_price_cents` nel JSON!
    """
    parent_price_cents: int = Field(exclude=True)  # Letto dall'ORM ma escluso dal JSON finale

    @computed_field
    @property
    def price_cents(self) -> int:
        return self.parent_price_cents


class CourseClubResponse(_CourseBaseResponse):
    """
    Schema restituito AI CLUB SPORTIVI (GET /courses/my, POST /courses, PATCH /courses/{id}).
    Espone `price_cents` leggendo `club_price_cents` (es. 9000).
    NON include mai `parent_price_cents` nel JSON!
    """
    club_price_cents: int = Field(exclude=True)  # Letto dall'ORM ma escluso dal JSON finale

    @computed_field
    @property
    def price_cents(self) -> int:
        return self.club_price_cents


class CourseAdminResponse(_CourseBaseResponse):
    """
    Schema restituito SOLO AGLI ADMIN ATHLOS.
    Mostra entrambi i prezzi e il margine di Athlos.
    """
    club_price_cents: int
    parent_price_cents: int

#In FastAPI usiamo gli schemi Pydantic per convertire i dati in JSON da inviare al frontend (React).
# Di base, se definisci una @property in una classe Pydantic, Pydantic la ignora e non la inserisce nel JSON generato.
#Mettendo @computed_field sopra a @property:
#Dici a Pydantic: "Esegui questa funzione e includi il risultato nel
# JSON di risposta come se fosse un vero campo del database
#Nel nostro caso, lo usiamo per il trucco del Dual-Pricing