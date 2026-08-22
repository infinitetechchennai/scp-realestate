import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.payment import Payment
from app.models.channel_partner import ChannelPartner
from app.models.booking import Booking
from app.models.plot import Plot
from app.schemas.payment import PaymentResponse, PaymentWebhookPayload
from app.utils.audit import log_audit_event

router = APIRouter()


@router.get("", response_model=list[PaymentResponse])
@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    customer_id: Optional[uuid.UUID] = None,
    channel_partner_id: Optional[uuid.UUID] = None,
    booking_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    List all payment transaction audits from PostgreSQL app.payments.
    """
    stmt = select(Payment).order_by(desc(Payment.payment_date))

    if customer_id:
        stmt = stmt.where(Payment.customer_id == customer_id)
    if channel_partner_id:
        stmt = stmt.where(Payment.channel_partner_id == channel_partner_id)
    if booking_id:
        stmt = stmt.where(Payment.booking_id == booking_id)

    res = await db.execute(stmt)
    payments = res.scalars().all()

    result = []
    for p in payments:
        cust_name = None
        if p.customer:
            cust_name = f"{p.customer.first_name} {p.customer.last_name or ''}".strip()

        partner_name = None
        if p.channel_partner:
            partner_name = p.channel_partner.company_name or f"{p.channel_partner.first_name or ''} {p.channel_partner.last_name or ''}".strip()

        plot_no = None
        if p.booking and p.booking.plot:
            plot_no = p.booking.plot.plot_number

        result.append(
            PaymentResponse(
                id=p.id,
                payment_reference=p.payment_reference,
                booking_id=p.booking_id,
                customer_id=p.customer_id,
                channel_partner_id=p.channel_partner_id,
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
                channel_partner_name=partner_name,
                plot_number=plot_no,
            )
        )

    return result


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    payload: PaymentWebhookPayload = Body(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Automated Webhook endpoint called by Merchant Bank / PSP / Google Pay
    Processes UPI QR payments and updates PostgreSQL in real-time.
    """
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y%m%d")
    txn_ref = payload.transaction_id or payload.bank_reference_no or f"UPI-{uuid.uuid4().hex[:8].upper()}"
    pay_amount = Decimal(str(payload.amount if payload.amount else 500.00))

    # Check for idempotency (avoid duplicate recording)
    existing_stmt = select(Payment).where(Payment.gateway_transaction_id == txn_ref)
    existing_res = await db.execute(existing_stmt)
    if existing_res.scalar_one_or_none():
        return {"success": True, "message": "Payment already recorded (idempotent)", "status": "duplicate"}

    # 1. CHANNEL PARTNER KYC REGISTRATION FEE (₹500)
    target_partner: Optional[ChannelPartner] = None
    if payload.partner_id:
        try:
            p_uuid = uuid.UUID(payload.partner_id)
            res = await db.execute(select(ChannelPartner).where(ChannelPartner.id == p_uuid))
            target_partner = res.scalar_one_or_none()
        except Exception:
            pass

    if not target_partner and payload.reference_id:
        ref = payload.reference_id.strip()
        # Extract UUID if contained in reference_id like KYC_e0000001...
        clean_ref = ref.replace("KYC_", "").replace("PAY_", "").replace("CP_", "")
        try:
            p_uuid = uuid.UUID(clean_ref)
            res = await db.execute(select(ChannelPartner).where(ChannelPartner.id == p_uuid))
            target_partner = res.scalar_one_or_none()
        except Exception:
            # Fallback: check partner code
            res = await db.execute(select(ChannelPartner).where(ChannelPartner.partner_code == ref))
            target_partner = res.scalar_one_or_none()

    if target_partner:
        # Update Channel Partner registration status
        target_partner.registration_paid = True
        target_partner.registration_fee = pay_amount
        target_partner.updated_at = now

        # Insert Payment record
        pay_rec = Payment(
            payment_reference=f"PAY-KYC-{date_str}-{uuid.uuid4().hex[:4].upper()}",
            channel_partner_id=target_partner.id,
            customer_id=None,
            booking_id=None,
            payment_type="registration_fee",
            payment_method="upi",
            amount=pay_amount,
            currency=payload.currency or "INR",
            status="completed",
            gateway_transaction_id=txn_ref,
            gateway_name="Google Pay (12204885695@okbizaxis)",
            payment_date=now,
        )
        db.add(pay_rec)
        await log_audit_event(
            db=db,
            action="PAYMENT_RECEIVED",
            resource_type="payment",
            actor_user_id=target_partner.user_id,
            resource_id=pay_rec.id,
            new_values={
                "payment_reference": pay_rec.payment_reference,
                "amount": float(pay_amount),
                "type": "registration_fee",
                "partner": target_partner.company_name,
                "method": "upi",
                "gateway_txn": txn_ref,
            },
        )
        await db.commit()
        await db.refresh(pay_rec)

        return {
            "success": True,
            "message": f"Channel Partner KYC payment of ₹{pay_amount} successfully confirmed & recorded in database.",
            "payment_reference": pay_rec.payment_reference,
            "partner_id": str(target_partner.id),
            "registration_paid": True
        }

    # 2. PLOT BOOKING BALANCE / TOKEN PAYMENT
    target_booking: Optional[Booking] = None
    if payload.booking_id:
        try:
            b_uuid = uuid.UUID(payload.booking_id)
            res = await db.execute(select(Booking).where(Booking.id == b_uuid))
            target_booking = res.scalar_one_or_none()
        except Exception:
            pass

    if target_booking:
        new_paid = target_booking.amount_paid + pay_amount
        new_bal = max(Decimal("0.00"), target_booking.total_amount - new_paid)
        target_booking.amount_paid = new_paid
        target_booking.balance_amount = new_bal

        if new_bal == Decimal("0.00"):
            target_booking.status = "sold"
            target_booking.sold_at = now
            if target_booking.plot:
                target_booking.plot.status = "sold"
        else:
            target_booking.status = "confirmed"
            if target_booking.plot:
                target_booking.plot.status = "confirmed"

        pay_rec = Payment(
            payment_reference=f"PAY-PLT-{date_str}-{uuid.uuid4().hex[:4].upper()}",
            booking_id=target_booking.id,
            customer_id=target_booking.customer_id,
            payment_type="balance_payment",
            payment_method="upi",
            amount=pay_amount,
            currency="INR",
            status="completed",
            gateway_transaction_id=txn_ref,
            gateway_name="Google Pay (12204885695@okbizaxis)",
            payment_date=now,
        )
        db.add(pay_rec)
        await log_audit_event(
            db=db,
            action="PAYMENT_RECEIVED",
            resource_type="payment",
            resource_id=pay_rec.id,
            new_values={
                "payment_reference": pay_rec.payment_reference,
                "amount": float(pay_amount),
                "type": "balance_payment",
                "booking_reference": target_booking.booking_reference,
                "remaining_balance": float(new_bal),
                "method": "upi",
                "gateway_txn": txn_ref,
            },
        )
        await db.commit()
        await db.refresh(pay_rec)

        return {
            "success": True,
            "message": f"Plot booking payment of ₹{pay_amount} confirmed & applied to booking {target_booking.booking_reference}.",
            "payment_reference": pay_rec.payment_reference,
            "remaining_balance": float(new_bal)
        }

    return {
        "success": False,
        "message": "Webhook received but could not link to a Channel Partner or Plot Booking.",
        "received_payload": payload.model_dump()
    }


@router.get("/partner-fee-status/{partner_id}")
async def get_partner_fee_status(
    partner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Real-time polling endpoint for frontend to check if ₹500 KYC payment has cleared.
    """
    res = await db.execute(select(ChannelPartner).where(ChannelPartner.id == partner_id))
    partner = res.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel partner not found")

    return {
        "partner_id": str(partner.id),
        "company_name": partner.company_name,
        "registration_paid": partner.registration_paid,
        "registration_fee": float(partner.registration_fee or 500.00),
        "status": partner.status
    }


@router.post("/confirm-partner-fee/{partner_id}")
async def confirm_partner_fee_direct(
    partner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Direct confirmation endpoint for Channel Partner ₹500 KYC payment.
    """
    res = await db.execute(select(ChannelPartner).where(ChannelPartner.id == partner_id))
    partner = res.scalar_one_or_none()

    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel partner not found")

    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y%m%d")
    partner.registration_paid = True
    partner.registration_fee = Decimal("500.00")
    partner.updated_at = now

    pay_rec = Payment(
        payment_reference=f"PAY-KYC-{date_str}-{uuid.uuid4().hex[:4].upper()}",
        channel_partner_id=partner.id,
        customer_id=None,
        booking_id=None,
        payment_type="registration_fee",
        payment_method="upi",
        amount=Decimal("500.00"),
        currency="INR",
        status="completed",
        gateway_transaction_id=f"GPAY-{uuid.uuid4().hex[:8].upper()}",
        gateway_name="Google Pay (12204885695@okbizaxis)",
        payment_date=now,
    )
    db.add(pay_rec)
    await db.commit()

    return {
        "success": True,
        "partner_id": str(partner.id),
        "registration_paid": True,
        "payment_reference": pay_rec.payment_reference,
        "amount": 500.00
    }
