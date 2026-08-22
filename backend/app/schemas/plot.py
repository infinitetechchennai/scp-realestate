import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PlotCreateRequest(BaseModel):
    project_id: uuid.UUID
    plot_number: str
    row_name: Optional[str] = None
    area_sqft: float
    price_per_sqft: float
    total_price: float
    facing: Optional[str] = "North"
    road_width: Optional[str] = "20 ft"
    length_ft: Optional[float] = None
    breadth_ft: Optional[float] = None
    dimensions_text: Optional[str] = None
    status: Optional[str] = "available"


class PlotResponse(BaseModel):
    id: uuid.UUID
    projectId: uuid.UUID
    plotNumber: str
    projectName: Optional[str] = "SCP Farm Layout (184 Plots)"
    row: Optional[str] = "A"
    area: float
    facing: str = "North"
    roadWidth: str = "20 ft"
    length: Optional[float] = None
    breadth: Optional[float] = None
    dimensions: Optional[str] = None
    pricePerSqft: float
    totalPrice: float
    status: str
    tokenAmount: Optional[float] = 0.0
    tokenDate: Optional[str] = None
    tokenExpiry: Optional[str] = None
    amountPaid: Optional[float] = 0.0
    balanceAmount: Optional[float] = 0.0
    balanceDueDate: Optional[str] = None
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    partnerId: Optional[str] = None
    partnerName: Optional[str] = None

    class Config:
        from_attributes = True


class PlotStatusUpdateRequest(BaseModel):
    status: str
    token_amount: Optional[float] = None
    token_expiry: Optional[datetime] = None
    amount_paid: Optional[float] = None
    balance_amount: Optional[float] = None
    balance_due_date: Optional[datetime] = None
    customer_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    channel_partner_id: Optional[uuid.UUID] = None
    channel_partner_name: Optional[str] = None
