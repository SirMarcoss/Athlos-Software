from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID

from app.schemas.address import Address

class ParentCreate(BaseModel):
    first_name: str = Field(max_length=255)
    last_name: str = Field(max_length=255)
    phone_number : str = Field(max_length=20)
    fiscal_code: str = Field(max_length=100)
    info: Optional[str] = Field(default=None, max_length=255)
    address: Optional[Address] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ParentUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=255)
    last_name: Optional[str] = Field(default=None, max_length=255)
    phone_number: Optional[str] = Field(default=None, max_length=20)
    fiscal_code: Optional[str] = Field(default=None, max_length=100)
    info: Optional[str] = Field(default=None, max_length=255)
    address: Optional[Address] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ParentResponse(ParentCreate):
    id : UUID
    user_id : UUID

    model_config = ConfigDict(from_attributes=True)