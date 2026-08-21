import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CustomerCreateRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: Optional[str] = None
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: Optional[str] = Field(default="customer123", min_length=6)
    address_line_1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    assigned_channel_partner_id: Optional[uuid.UUID] = None


class CustomerListItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    first_name: str
    last_name: Optional[str] = None
    email: str
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    assigned_partner_id: Optional[uuid.UUID] = None
    assigned_partner_name: Optional[str] = None
    total_paid: float = 0.0
    total_balance: float = 0.0
    allocated_plots_count: int = 0
    status: str = "active"
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerDetail(CustomerListItem):
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    postal_code: Optional[str] = None
    country_code: Optional[str] = "IN"
    aadhar_last4: Optional[str] = None
    pan_last4: Optional[str] = None
