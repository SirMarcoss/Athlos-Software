from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.networks import EmailStr
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID


from app.schemas.address import Address


class ClubCreate(BaseModel):
    name : str = Field(max_length=255)
    email_contact : EmailStr
    address : Optional[Address] = None
    phone_number : str = Field(max_length=20)
    logo_url : Optional[str] = Field(default=None, max_length=255)
    latitude : Optional[float] = None
    longitude : Optional[float] = None


class ClubUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    email_contact: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(default=None, max_length=20)
    address: Optional[Address] = None
    logo_url: Optional[str] = Field(default=None, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ClubResponse(ClubCreate):
    id : UUID
    user_id : UUID

    model_config = ConfigDict(from_attributes=True)
    # questo JSON nasce da un oggetto del database SQLAlchemy, leggilo correttamente