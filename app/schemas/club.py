from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.networks import EmailStr
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID


class Address(BaseModel):
    street: str = Field(..., min_length=1, max_length=255)
    number: str = Field(..., max_length=10)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., pattern=r'^\d{5}$')  # Italian format
    country: str = Field(default="Italy", max_length=100)


class ClubCreate(BaseModel):
    name : str = Field(max_length=255)
    email_contact : EmailStr
    address : Optional[Address] = None
    phone_number : str = Field(max_length=20)
    logo_url : Optional[str] = Field(default=None, max_length=255)


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    email_contact: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, max_length=20)
    address: Optional[Address] = None
    logo_url: Optional[str] = Field(default=None, max_length=255)


class ClubResponse(ClubCreate):
    id : UUID
    user_id : UUID

    model_config = ConfigDict(from_attributes=True)
    # questo JSON nasce da un oggetto del database SQLAlchemy, leggilo correttamente