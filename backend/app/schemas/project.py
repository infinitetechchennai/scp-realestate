import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = "Hyderabad"
    state: Optional[str] = "Telangana"
    postal_code: Optional[str] = "500081"
    country_code: Optional[str] = "IN"
    total_area: Optional[str] = "24.5 Acres"
    total_area_sqft: Optional[float] = 1067220.00
    total_plots: Optional[int] = 184
    default_price_per_sqft: Optional[float] = 2500.00
    default_token_amount: Optional[float] = 10000.00
    image_url: Optional[str] = "/blueprint.png"
    blueprint_url: Optional[str] = "/blueprint.png"


class ProjectUpdateRequest(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = None
    total_area: Optional[str] = None
    total_area_sqft: Optional[float] = None
    default_price_per_sqft: Optional[float] = None
    default_token_amount: Optional[float] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    blueprint_url: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = "IN"
    status: str
    imageUrl: Optional[str] = None
    blueprintUrl: Optional[str] = None
    totalArea: Optional[str] = "24.5 Acres"
    total_area_sqft: Optional[float] = None
    defaultPricePerSqft: Optional[float] = 2500.00
    defaultTokenAmount: Optional[float] = 10000.00
    totalPlots: int = 0
    availablePlots: int = 0
    tokenBookedPlots: int = 0
    confirmedPlots: int = 0
    soldPlots: int = 0
    totalValue: float = 0.0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
