import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field


class PaymentBase(BaseModel):
    booking_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    channel_partner_id: Optional[uuid.UUID] = None
    payment_type: str = "token_advance"
    payment_method: str = "upi"
    amount: Decimal = Field(..., gt=0)
    currency: str = "INR"
    status: str = "completed"
    gateway_transaction_id: Optional[str] = None
    gateway_name: Optional[str] = None
    failure_reason: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None


class PaymentCreate(BaseModel):
    booking_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    channel_partner_id: Optional[uuid.UUID] = None
    plot_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    payment_type: str = "token_advance"
    payment_method: str = "upi"
    amount: Decimal = Field(..., gt=0)
    gateway_transaction_id: Optional[str] = None
    gateway_name: Optional[str] = None
    notes: Optional[str] = None


class PaymentWebhookPayload(BaseModel):
    event: Optional[str] = "payment.success"
    transaction_id: Optional[str] = None
    bank_reference_no: Optional[str] = None
    vpa: Optional[str] = "12204885695@okbizaxis"
    amount: float = 500.00
    currency: str = "INR"
    status: str = "SUCCESS"
    partner_id: Optional[str] = None
    booking_id: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    payment_reference: str
    booking_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    channel_partner_id: Optional[uuid.UUID] = None
    payment_type: str
    payment_method: str
    amount: Decimal
    currency: str
    status: str
    gateway_transaction_id: Optional[str] = None
    gateway_name: Optional[str] = None
    payment_date: datetime
    receipt_file_id: Optional[uuid.UUID] = None
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Display extras
    customer_name: Optional[str] = None
    channel_partner_name: Optional[str] = None
    plot_number: Optional[str] = None
