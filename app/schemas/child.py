from datetime import date
from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID


class ChildCreate(BaseModel):
    first_name : str = Field(max_length=255)
    last_name : str = Field(max_length=255)
    date_of_birth : date
    gender : str = Field(max_length=10)
    sport : str = Field(max_length=255)
    skills : list[str]
    fiscal_code : str = Field(max_length=100)
    medical_notes : Optional[str] = Field(default=None, max_length=255)
    info : Optional[str] = Field(default=None, max_length=255)


class ChildUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=255)
    last_name: Optional[str] = Field(default=None, max_length=255)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=10)
    sport: Optional[str] = Field(default=None, max_length=255)
    skills: Optional[list[str]] = None
    fiscal_code: Optional[str] = Field(default=None, max_length=100)
    medical_notes: Optional[str] = Field(default=None, max_length=255)
    info: Optional[str] = Field(default=None, max_length=255)


class ChildResponse(ChildCreate):
    id : UUID
    parent_id : UUID

    model_config = ConfigDict(from_attributes=True)