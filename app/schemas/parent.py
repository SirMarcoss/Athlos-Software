from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID

from app.schemas.address import Address

class ParentCreate(BaseModel):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone_number : str = Field(max_length=20)
    fiscal_code: str = Field(min_length=16, max_length=16)
    info: Optional[str] = Field(default=None, max_length=255)
    address: Optional[Address] = None
    referral_code: Optional[str] = Field(default=None, max_length=50)


class ParentUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    phone_number: Optional[str] = Field(default=None, max_length=20)
    fiscal_code: Optional[str] = Field(default=None, min_length=16, max_length=16)
    info: Optional[str] = Field(default=None, max_length=255)
    address: Optional[Address] = None

class ParentResponse(ParentCreate):
    id : UUID
    user_id : UUID

    model_config = ConfigDict(from_attributes=True)