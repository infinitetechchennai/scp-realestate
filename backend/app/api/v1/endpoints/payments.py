import uuid
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.payment import Payment
from app.schemas.payment import PaymentResponse

router = APIRouter()


@router.get("", response_model=list[PaymentResponse])
@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    customer_id: Optional[uuid.UUID] = None,
    booking_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    List all payment transaction audits from PostgreSQL app.payments.
    """
    stmt = select(Payment).order_by(desc(Payment.payment_date))

    if customer_id:
        stmt = stmt.where(Payment.customer_id == customer_id)
    if booking_id:
        stmt = stmt.where(Payment.booking_id == booking_id)

    res = await db.execute(stmt)
    payments = res.scalars().all()

    result = []
    for p in payments:
        cust_name = None
        if p.customer:
            cust_name = f"{p.customer.first_name} {p.customer.last_name or ''}".strip()

        plot_no = None
        if p.booking and p.booking.plot:
            plot_no = p.booking.plot.plot_number

        result.append(
            PaymentResponse(
                id=p.id,
                payment_reference=p.payment_reference,
                booking_id=p.booking_id,
                customer_id=p.customer_id,
                payment_type=p.payment_type,
                payment_method=p.payment_method,
                amount=p.amount,
                currency=p.currency,
                status=p.status,
                gateway_transaction_id=p.gateway_transaction_id,
                gateway_name=p.gateway_name,
                payment_date=p.payment_date,
                receipt_file_id=p.receipt_file_id,
                failure_reason=p.failure_reason,
                created_at=p.created_at,
                updated_at=p.updated_at,
                customer_name=cust_name,
                plot_number=plot_no,
            )
        )

    return result
