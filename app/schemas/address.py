from pydantic.main import BaseModel
from pydantic.fields import Field
from typing import Optional


class Address(BaseModel):
    street: str = Field(..., min_length=1, max_length=255)
    number: Optional[str] = Field(default=None, max_length=20)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., pattern=r'^\d{5}$')  # Italian format 5 digits
    country: str = Field(default="Italy", max_length=100)
