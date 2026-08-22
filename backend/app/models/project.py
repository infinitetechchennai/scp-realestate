import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Integer, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_line_1: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address_line_2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    country_code: Mapped[str] = mapped_column(String(2), default="IN", nullable=False)
    total_area: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_area_sqft: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    total_plots: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    default_price_per_sqft: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    default_token_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    blueprint_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    plots = relationship("Plot", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
