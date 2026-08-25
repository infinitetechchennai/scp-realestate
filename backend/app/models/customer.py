import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.channel_partner import ChannelPartner
    from app.models.booking import Booking

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.users.id", ondelete="SET NULL"), nullable=True)
    
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    
    address_line_1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address_line_2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(2), default="IN", nullable=True)
    
    # Sensitive PII Hashes & Values
    pan_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pan_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    pan_last4: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    
    aadhaar_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aadhaar_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    aadhaar_last4: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    
    assigned_channel_partner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.channel_partners.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # 'active', 'inactive', 'lead'
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id], lazy="selectin")
    channel_partner: Mapped[Optional["ChannelPartner"]] = relationship("ChannelPartner", foreign_keys=[assigned_channel_partner_id], lazy="selectin")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="customer", lazy="selectin")
