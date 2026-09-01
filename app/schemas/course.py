from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID


class CourseCreate(BaseModel):

    name : str = Field(max_length=255)
    min_age : int = Field(ge=5)
    max_age : int = Field(le=13)


class CourseUpdate(BaseModel):

    name: Optional[str] = Field(default=None, max_length=255)
    min_age: Optional[int] = Field(default=None, ge=5)
    max_age: Optional[int] = Field(default=None, le=13)


class CourseResponse(CourseCreate):
    id : UUID
    clubs_id : UUID

    model_config = ConfigDict(from_attributes=True)