import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    address_line_1: Optional[str] = None
    city: Optional[str] = "Hyderabad"
    state: Optional[str] = "Telangana"
    postal_code: Optional[str] = "500081"
    country_code: Optional[str] = "IN"
    total_area_sqft: Optional[float] = 1067220.00
    total_plots: Optional[int] = 184
    default_price_per_sqft: Optional[float] = 2500.00
    default_token_amount: Optional[float] = 100000.00
    image_url: Optional[str] = "/blueprint.png"
    blueprint_url: Optional[str] = "/blueprint.png"


class ProjectResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    address_line_1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: str
    imageUrl: Optional[str] = None
    blueprintUrl: Optional[str] = None
    totalArea: Optional[str] = "24.5 Acres"
    totalPlots: int = 0
    availablePlots: int = 0
    tokenBookedPlots: int = 0
    confirmedPlots: int = 0
    soldPlots: int = 0
    totalValue: float = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
