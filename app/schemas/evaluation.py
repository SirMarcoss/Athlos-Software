from pydantic.main import BaseModel
from pydantic.fields import Field
from pydantic.config import ConfigDict
from typing import Optional
from uuid import UUID


class EvaluationCreate(BaseModel):
    agility_score : int = Field(ge=0, le=10)
    teamwork_score : int = Field(ge=0, le=10)
    discipline_score : int = Field(ge=0, le=10)
    coach_notes : Optional[str] = Field(default=None, max_length=255)


class EvaluationUpdate(BaseModel):
    agility_score: Optional[int] = Field(default=None, ge=0, le=10)
    teamwork_score: Optional[int] = Field(default=None, ge=0, le=10)
    discipline_score: Optional[int] = Field(default=None, ge=0, le=10)
    coach_notes: Optional[str] = Field(default=None, max_length=255)


class EvaluationResponse(EvaluationCreate):
    id : UUID
    course_id : UUID
    child_id : UUID
    ai_recommended_sport : Optional[str] = None

    model_config = ConfigDict(from_attributes=True)