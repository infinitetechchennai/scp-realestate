import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'offer', 'announcement', 'reminder', 'booking_update', 'system'
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # 'broadcast', 'channel_partner', 'customer', 'plot', 'booking'
    entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    recipients: Mapped[List["NotificationRecipient"]] = relationship(
        "NotificationRecipient",
        back_populates="notification",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class NotificationRecipient(Base):
    __tablename__ = "notification_recipients"

    notification_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app.notifications.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("app.users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=True)

    # Relationships
    notification: Mapped["Notification"] = relationship("Notification", back_populates="recipients", lazy="selectin")
    user: Mapped["User"] = relationship("User", lazy="selectin")
