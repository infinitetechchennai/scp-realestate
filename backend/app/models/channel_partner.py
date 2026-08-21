import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class ChannelPartner(Base):
    __tablename__ = "channel_partners"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app.users.id", ondelete="RESTRICT"), unique=True, nullable=False)
    partner_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    pan_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pan_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    pan_last4: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    
    aadhaar_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aadhaar_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    aadhaar_last4: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    
    address_line_1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address_line_2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country_code: Mapped[Optional[str]] = mapped_column(String(2), default="IN", nullable=True)
    
    registration_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=500.00)
    registration_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    commission_rate_percent: Mapped[float] = mapped_column(Numeric(5, 2), default=2.00)
    
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("app.users.id"), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="channel_partner_profile", foreign_keys=[user_id], lazy="selectin")
    bank_accounts: Mapped[List["ChannelPartnerBankAccount"]] = relationship("ChannelPartnerBankAccount", back_populates="partner", cascade="all, delete-orphan", lazy="selectin")


class ChannelPartnerBankAccount(Base):
    __tablename__ = "channel_partner_bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    channel_partner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app.channel_partners.id", ondelete="CASCADE"), nullable=False)
    
    account_holder_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    account_number_encrypted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    account_number_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship
    partner: Mapped["ChannelPartner"] = relationship("ChannelPartner", back_populates="bank_accounts")
