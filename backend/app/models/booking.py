import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text, Numeric, BigInteger, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.plot import Plot
    from app.models.customer import Customer
    from app.models.channel_partner import ChannelPartner
    from app.models.payment import Payment


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_reference: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    plot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app.plots.id"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app.customers.id"), nullable=False)
    channel_partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.channel_partners.id"), nullable=True)

    status: Mapped[str] = mapped_column(String(30), default="token_paid", nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    token_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    balance_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)

    token_paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    payment_deadline_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sold_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    version: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    plot: Mapped["Plot"] = relationship("Plot", foreign_keys=[plot_id], lazy="selectin")
    customer: Mapped["Customer"] = relationship("Customer", foreign_keys=[customer_id], lazy="selectin")
    channel_partner: Mapped[Optional["ChannelPartner"]] = relationship("ChannelPartner", foreign_keys=[channel_partner_id], lazy="selectin")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="booking", lazy="selectin")
