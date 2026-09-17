from pydantic import BaseModel, Field
from typing import Optional


class GeoSearchResult(BaseModel):
    display_name: str
    street: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float
