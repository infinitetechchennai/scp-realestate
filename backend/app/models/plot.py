import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Plot(Base):
    __tablename__ = "plots"
    __table_args__ = {"schema": "app"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("app.projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plot_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    area_sqft: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    dimensions: Mapped[str | None] = mapped_column(String(255), nullable=True)
    facing: Mapped[str | None] = mapped_column(String(50), nullable=True)
    road_width_ft: Mapped[str | None] = mapped_column(String(50), default="20 ft", nullable=True)
    price_per_sqft: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    token_required: Mapped[float | None] = mapped_column(Numeric(12, 2), default=10000.0, nullable=True)

    token_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), default=0.0, nullable=True)
    token_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    amount_paid: Mapped[float | None] = mapped_column(Numeric(16, 2), default=0.0, nullable=True)
    balance_amount: Mapped[float | None] = mapped_column(Numeric(16, 2), default=0.0, nullable=True)
    balance_due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    row_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    col_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    blueprint_coords: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="available", nullable=False, index=True)

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
    project = relationship("Project", back_populates="plots", lazy="selectin")
