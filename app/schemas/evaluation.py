from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# --- Physical Tests ---
class PhysicalTestCreate(BaseModel):
    test_type: str = Field(max_length=100)
    score_value: float

class PhysicalTestResponse(PhysicalTestCreate):
    id: UUID
    course_id: UUID
    child_id: UUID
    trimester_id: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Psychological Forms ---
class PsychologicalFormCreate(BaseModel):
    creativity_score: int = Field(ge=0, le=10)
    teamwork_score: int = Field(ge=0, le=10)
    stress_management_score: int = Field(ge=0, le=10)

class PsychologicalFormResponse(PsychologicalFormCreate):
    id: UUID
    course_id: UUID
    child_id: UUID
    trimester_id: str
    coach_notes: Optional[str]
    date: datetime
    ai_recommended_sport: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Unified Session (What the coach sends on Evaluation Day) ---
class EvaluationSessionCreate(BaseModel):
    session_id: str = Field(max_length=50) # e.g. "Q1_2026"
    physical_tests: List[PhysicalTestCreate]
    psychological_form: PsychologicalFormCreate
    coach_notes: Optional[str] = Field(default=None, max_length=255)

class EvaluationSessionResponse(BaseModel):
    session_id: str
    child_id: UUID
    physical_tests_saved: int
    psychological_form_id: UUID
    ai_recommendation: Optional[str]

    model_config = ConfigDict(from_attributes=True)