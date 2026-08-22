import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Any, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.booking import Booking
    from app.models.customer import Customer


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_reference: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    booking_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.bookings.id"), nullable=True)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.customers.id"), nullable=True)
    channel_partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.channel_partners.id"), nullable=True)

    payment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'registration_fee', 'token_advance', 'continue_payment', 'full_payment', 'balance_payment', 'refund'
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # 'upi', 'bank_transfer', 'cash', 'card', 'cheque', 'other'
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="completed", nullable=False)  # 'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'

    gateway_transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    gateway_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payment_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    receipt_file_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.files.id"), nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column("metadata", JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    booking: Mapped[Optional["Booking"]] = relationship("Booking", back_populates="payments", lazy="selectin")
    customer: Mapped[Optional["Customer"]] = relationship("Customer", foreign_keys=[customer_id], lazy="selectin")
    channel_partner: Mapped[Optional["ChannelPartner"]] = relationship("ChannelPartner", foreign_keys=[channel_partner_id], lazy="selectin")
