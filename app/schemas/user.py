from datetime import datetime
from pydantic.main import BaseModel
from pydantic.networks import EmailStr
from pydantic.fields import Field
from pydantic.config import ConfigDict
from app.models.user import UserRoleEnum
from typing import Optional
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    password : str = Field(..., min_length=8, max_length=255)
    first_name: str = Field(max_length=255)
    last_name: str = Field(max_length=255)


class UserUpdate(BaseModel):
    password: Optional[str] = Field(default=None, min_length=8, max_length=255)
    first_name: Optional[str] = Field(default=None, max_length=255)
    last_name: Optional[str] = Field(default=None, max_length=255)


class UserResponse(BaseModel):
    id : UUID
    email : EmailStr
    first_name: str = Field(max_length=255)
    last_name: str = Field(max_length=255)
    role : UserRoleEnum
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



