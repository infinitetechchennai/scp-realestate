import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BookingBase(BaseModel):
    plot_id: uuid.UUID
    customer_id: uuid.UUID
    channel_partner_id: Optional[uuid.UUID] = None
    status: str = "token_paid"
    total_amount: Decimal = Field(..., ge=0)
    token_amount: Decimal = Field(default=Decimal("20000.00"), ge=0)
    amount_paid: Decimal = Field(default=Decimal("20000.00"), ge=0)
    balance_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class BookingCreate(BaseModel):
    plot_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_id: Optional[uuid.UUID] = None
    channel_partner_id: Optional[uuid.UUID] = None
    booking_type: str = "token_advance"  # 'token_advance', 'partial_payment', 'full_payment'
    amount_paid: Decimal = Field(default=Decimal("20000.00"), ge=0)
    payment_method: str = "upi"  # 'upi', 'bank_transfer', 'cash', 'card'
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    amount_paid: Optional[Decimal] = None
    balance_amount: Optional[Decimal] = None
    confirmed_at: Optional[datetime] = None
    payment_deadline_at: Optional[datetime] = None
    sold_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_reference: str
    plot_id: uuid.UUID
    customer_id: uuid.UUID
    channel_partner_id: Optional[uuid.UUID] = None
    status: str
    total_amount: Decimal
    token_amount: Decimal
    amount_paid: Decimal
    balance_amount: Optional[Decimal] = None
    token_paid_at: Optional[datetime] = None
    token_expires_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    payment_deadline_at: Optional[datetime] = None
    sold_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Flattened metadata for UI display
    plot_number: Optional[str] = None
    project_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    channel_partner_name: Optional[str] = None
