import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from app.core.database import get_db
from app.models.booking import Booking
from app.models.payment import Payment
from app.models.plot import Plot
from app.models.customer import Customer
from app.models.channel_partner import ChannelPartner
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse, BookingUpdate
from app.utils.audit import log_audit_event

router = APIRouter()


@router.get("", response_model=list[BookingResponse])
@router.get("/", response_model=list[BookingResponse])
async def list_bookings(
    channel_partner_id: Optional[uuid.UUID] = None,
    customer_id: Optional[uuid.UUID] = None,
    plot_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    List all bookings with live plot, customer, and channel partner details.
    """
    stmt = select(Booking).order_by(desc(Booking.created_at))

    if channel_partner_id:
        stmt = stmt.where(Booking.channel_partner_id == channel_partner_id)
    if customer_id:
        stmt = stmt.where(Booking.customer_id == customer_id)
    if plot_id:
        stmt = stmt.where(Booking.plot_id == plot_id)

    res = await db.execute(stmt)
    bookings = res.scalars().all()

    result = []
    for b in bookings:
        c_name = f"{b.customer.first_name} {b.customer.last_name or ''}".strip() if b.customer else "Client"
        cp_name = None
        if b.channel_partner:
            cp_name = b.channel_partner.company_name or f"{b.channel_partner.first_name} {b.channel_partner.last_name or ''}".strip()

        booked_by_name = None
        booked_by_email = None
        booked_by_role = None
        if b.booked_by_user:
            booked_by_name = f"{b.booked_by_user.first_name} {b.booked_by_user.last_name or ''}".strip()
            booked_by_email = b.booked_by_user.email
            if b.booked_by_user.roles and len(b.booked_by_user.roles) > 0:
                first_r = b.booked_by_user.roles[0].role
                booked_by_role = first_r.name if first_r else "Employee"
            else:
                booked_by_role = "Employee / Staff"
            
            # If no channel partner linked yet, but booked by a channel partner user
            if not cp_name and (booked_by_role == "channel_partner" or booked_by_role == "Channel Partner"):
                cp_name = booked_by_name
        elif b.channel_partner:
            booked_by_name = cp_name
            booked_by_role = "Channel Partner"

        result.append(
            BookingResponse(
                id=b.id,
                booking_reference=b.booking_reference,
                plot_id=b.plot_id,
                customer_id=b.customer_id,
                channel_partner_id=b.channel_partner_id,
                booked_by_user_id=b.booked_by_user_id,
                status=b.status,
                total_amount=b.total_amount,
                token_amount=b.token_amount,
                amount_paid=b.amount_paid,
                balance_amount=b.balance_amount if b.balance_amount is not None else max(Decimal("0.00"), (b.total_amount or Decimal("0.00")) - (b.amount_paid or Decimal("0.00"))),
                token_paid_at=b.token_paid_at,
                token_expires_at=b.token_expires_at,
                confirmed_at=b.confirmed_at,
                payment_deadline_at=b.payment_deadline_at,
                sold_at=b.sold_at,
                cancelled_at=b.cancelled_at,
                cancellation_reason=b.cancellation_reason,
                notes=b.notes,
                created_at=b.created_at,
                updated_at=b.updated_at,
                plot_number=b.plot.plot_number if b.plot else None,
                project_name=b.plot.project.name if (b.plot and b.plot.project) else "SCP Farm Layout",
                customer_name=c_name,
                customer_phone=b.customer.phone if b.customer else None,
                customer_email=b.customer.email if b.customer else None,
                channel_partner_name=cp_name,
                booked_by_name=booked_by_name,
                booked_by_email=booked_by_email,
                booked_by_role=booked_by_role,
            )
        )

    return result


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    req: BookingCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Create a new booking, record the payment transaction, and update the plot status atomically.
    """
    # 1. Fetch Plot (support both UUID and plot_number like 'P-001' / 'p-001' / '1')
    p_str = str(req.plot_id).strip()
    try:
        p_uuid = uuid.UUID(p_str)
        stmt = select(Plot).where(or_(Plot.id == p_uuid, Plot.plot_number.ilike(p_str)))
    except Exception:
        p_num = f"P-{int(p_str):03d}" if p_str.isdigit() else p_str
        stmt = select(Plot).where(or_(Plot.plot_number.ilike(p_str), Plot.plot_number.ilike(p_num)))

    res = await db.execute(stmt)
    plot = res.scalar_one_or_none()

    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plot '{p_str}' not found in layout database."
        )

    if plot.status == "sold":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plot is already sold."
        )

    # Check if this plot already has an active ongoing booking
    active_booking_stmt = (
        select(Booking)
        .where(
            Booking.plot_id == plot.id,
            Booking.status.in_(["token_paid", "partial_paid", "confirmed"])
        )
        .order_by(Booking.created_at.desc())
    )
    b_res = await db.execute(active_booking_stmt)
    existing_booking = b_res.scalar_one_or_none()

    if existing_booking:
        # Verify customer match
        booking_cust_phone = existing_booking.customer.phone if existing_booking.customer else None
        booking_cust_email = existing_booking.customer.email if existing_booking.customer else None
        req_phone = (req.customer_phone or "").strip()
        req_email = (req.customer_email or "").strip().lower()

        is_owner_match = (
            (req.customer_id and req.customer_id == existing_booking.customer_id) or
            (req_phone and booking_cust_phone and req_phone == booking_cust_phone) or
            (req_email and booking_cust_email and req_email == booking_cust_email.lower()) or
            (req.customer_name and existing_booking.customer and req.customer_name.strip().lower() == f"{existing_booking.customer.first_name} {existing_booking.customer.last_name or ''}".strip().lower())
        )

        if not is_owner_match:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Plot is already booked under active hold by another customer. Only the booking owner can make subsequent balance payments."
            )

        # Valid balance payment by original customer: append to existing booking
        now = datetime.now(timezone.utc)
        payment_amount = Decimal(str(req.amount_paid)) if req.amount_paid else Decimal("20000.00")
        new_total_paid = existing_booking.amount_paid + payment_amount
        new_balance = max(Decimal("0.00"), existing_booking.total_amount - new_total_paid)

        existing_booking.amount_paid = new_total_paid

        if new_balance == Decimal("0.00"):
            existing_booking.status = "sold"
            existing_booking.sold_at = now
            plot.status = "sold"
        else:
            existing_booking.status = "confirmed"
            if not existing_booking.confirmed_at:
                existing_booking.confirmed_at = now
            if not existing_booking.payment_deadline_at:
                existing_booking.payment_deadline_at = now + timedelta(days=90)
            plot.status = "confirmed"

        date_str = datetime.now().strftime("%Y%m%d")
        pay_ref = f"PAY-{date_str}-{uuid.uuid4().hex[:6].upper()}"
        pay_type = "full_payment" if new_balance == Decimal("0.00") else "balance_payment"
        payment = Payment(
            payment_reference=pay_ref,
            booking_id=existing_booking.id,
            customer_id=existing_booking.customer_id,
            payment_type=pay_type,
            payment_method=req.payment_method or "upi",
            amount=payment_amount,
            currency="INR",
            status="completed",
            gateway_transaction_id=req.transaction_id or f"UPI-{uuid.uuid4().hex[:8].upper()}",
            gateway_name="GooglePay / UPI",
            payment_date=now,
        )
        db.add(payment)
        await db.commit()
        await db.refresh(existing_booking)

        c_name = f"{existing_booking.customer.first_name} {existing_booking.customer.last_name or ''}".strip() if existing_booking.customer else "Client"
        cp_name = existing_booking.channel_partner.company_name if existing_booking.channel_partner else None

        return BookingResponse(
            id=existing_booking.id,
            booking_reference=existing_booking.booking_reference,
            plot_id=existing_booking.plot_id,
            customer_id=existing_booking.customer_id,
            channel_partner_id=existing_booking.channel_partner_id,
            status=existing_booking.status,
            total_amount=existing_booking.total_amount,
            token_amount=existing_booking.token_amount,
            amount_paid=existing_booking.amount_paid,
            balance_amount=existing_booking.balance_amount,
            token_paid_at=existing_booking.token_paid_at,
            token_expires_at=existing_booking.token_expires_at,
            confirmed_at=existing_booking.confirmed_at,
            payment_deadline_at=existing_booking.payment_deadline_at,
            sold_at=existing_booking.sold_at,
            cancelled_at=existing_booking.cancelled_at,
            cancellation_reason=existing_booking.cancellation_reason,
            notes=existing_booking.notes,
            created_at=existing_booking.created_at,
            updated_at=existing_booking.updated_at,
            plot_number=plot.plot_number,
            project_name=plot.project.name if plot.project else "SCP Farm Layout",
            customer_name=c_name,
            customer_phone=existing_booking.customer.phone if existing_booking.customer else None,
            customer_email=existing_booking.customer.email if existing_booking.customer else None,
            channel_partner_name=cp_name,
        )

    # 2. Resolve Channel Partner ID (support both ChannelPartner.id and User.id)
    cp_id = None
    if req.channel_partner_id:
        cp_stmt = select(ChannelPartner).where(or_(ChannelPartner.id == req.channel_partner_id, ChannelPartner.user_id == req.channel_partner_id))
        cp_res = await db.execute(cp_stmt)
        cp_obj = cp_res.scalar_one_or_none()
        if cp_obj:
            cp_id = cp_obj.id

    # 2.2 Resolve Booked-by User ID (Employee / Staff / Admin / Channel Partner)
    booked_by_uid = None
    booked_by_user_obj = None
    if req.booked_by_user_id:
        try:
            b_uid = uuid.UUID(str(req.booked_by_user_id).strip())
            u_stmt = select(User).where(User.id == b_uid)
            u_res = await db.execute(u_stmt)
            booked_by_user_obj = u_res.scalar_one_or_none()
            if booked_by_user_obj:
                booked_by_uid = booked_by_user_obj.id
                if not cp_id:
                    cp_u_stmt = select(ChannelPartner).where(ChannelPartner.user_id == booked_by_uid)
                    cp_u_res = await db.execute(cp_u_stmt)
                    cp_u_obj = cp_u_res.scalar_one_or_none()
                    if cp_u_obj:
                        cp_id = cp_u_obj.id
        except Exception:
            pass

    # 2.5 Lookup or Auto-create Customer in app.customers for new booking
    cust_id = req.customer_id
    if not cust_id:
        phone = (req.customer_phone or "").strip()
        name = (req.customer_name or "Valued Client").strip()
        email = (req.customer_email or "").strip()

        existing_cust = None
        conditions = []
        if email and not email.endswith("@scp.local"):
            conditions.append(Customer.email.ilike(email))
        if phone:
            conditions.append(Customer.phone == phone)

        if conditions:
            c_stmt = select(Customer).where(or_(*conditions)).order_by(Customer.user_id.is_not(None).desc())
            c_res = await db.execute(c_stmt)
            existing_cust = c_res.scalars().first()

        if existing_cust:
            cust_id = existing_cust.id
            if not cp_id and existing_cust.assigned_channel_partner_id:
                cp_id = existing_cust.assigned_channel_partner_id
        else:
            # Check app.users if a registered account exists for this email
            user_id = None
            if email and not email.endswith("@scp.local"):
                u_stmt = select(User).where(User.email.ilike(email))
                u_res = await db.execute(u_stmt)
                user_obj = u_res.scalar_one_or_none()
                if user_obj:
                    user_id = user_obj.id

            parts = name.split(maxsplit=1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else None

            new_cust = Customer(
                user_id=user_id,
                first_name=first_name,
                last_name=last_name,
                email=email or f"client_{uuid.uuid4().hex[:6]}@scp.local",
                phone=phone or f"+91{uuid.uuid4().int % 10000000000:010d}",
                assigned_channel_partner_id=cp_id,
                status="active",
            )
            db.add(new_cust)
            await db.flush()
            cust_id = new_cust.id
    elif not cp_id:
        c_stmt = select(Customer).where(Customer.id == cust_id)
        c_res = await db.execute(c_stmt)
        c_obj = c_res.scalar_one_or_none()
        if c_obj and c_obj.assigned_channel_partner_id:
            cp_id = c_obj.assigned_channel_partner_id

    # 3. Calculate Amounts, Statuses, and Timestamps
    now = datetime.now(timezone.utc)
    total_price = plot.total_price
    amount_paid = Decimal(str(req.amount_paid)) if req.amount_paid else Decimal("20000.00")
    balance_amount = max(Decimal("0.00"), total_price - amount_paid)

    if req.booking_type == "token_advance" or amount_paid < (total_price * Decimal("0.5")):
        plot_db_status = "token_booked"
        booking_db_status = "token_paid"
        token_paid_at = now
        token_expires_at = now + timedelta(days=7)
        confirmed_at = None
        payment_deadline_at = None
        sold_at = None
        db_payment_type = "token_advance"
    elif amount_paid < total_price:
        plot_db_status = "confirmed"
        booking_db_status = "confirmed"
        token_paid_at = now
        token_expires_at = None
        confirmed_at = now
        payment_deadline_at = now + timedelta(days=90)
        sold_at = None
        db_payment_type = "continue_payment"
    else:
        plot_db_status = "sold"
        booking_db_status = "sold"
        token_paid_at = now
        token_expires_at = None
        confirmed_at = now
        payment_deadline_at = None
        sold_at = now
        db_payment_type = "full_payment"

    # 4. Generate Unique Booking Reference
    date_str = datetime.now().strftime("%Y%m%d")
    ref_suffix = uuid.uuid4().hex[:4].upper()
    booking_ref = f"BK-{date_str}-{plot.plot_number}-{ref_suffix}"

    # 5. Insert into app.bookings
    booking = Booking(
        booking_reference=booking_ref,
        plot_id=plot.id,
        customer_id=cust_id,
        channel_partner_id=cp_id,
        booked_by_user_id=booked_by_uid,
        status=booking_db_status,
        total_amount=total_price,
        token_amount=amount_paid if booking_db_status == "token_paid" else Decimal("0.00"),
        amount_paid=amount_paid,
        balance_amount=balance_amount,
        token_paid_at=token_paid_at,
        token_expires_at=token_expires_at,
        confirmed_at=confirmed_at,
        payment_deadline_at=payment_deadline_at,
        sold_at=sold_at,
        notes=req.notes,
    )
    db.add(booking)
    await db.flush()

    # 6. Insert Payment Record into app.payments
    pay_ref = f"PAY-{date_str}-{uuid.uuid4().hex[:6].upper()}"
    payment = Payment(
        payment_reference=pay_ref,
        booking_id=booking.id,
        customer_id=cust_id,
        payment_type=db_payment_type,
        payment_method=req.payment_method or "upi",
        amount=amount_paid,
        currency="INR",
        status="completed",
        gateway_transaction_id=req.transaction_id or f"UPI-{uuid.uuid4().hex[:8].upper()}",
        gateway_name="GooglePay / UPI",
        payment_date=now,
    )
    db.add(payment)

    # 7. Update Plot Status in app.plots
    plot.status = plot_db_status

    # Record audit log
    booked_by_str = f"{booked_by_user_obj.first_name} {booked_by_user_obj.last_name or ''}".strip() if booked_by_user_obj else "System / Direct"
    await log_audit_event(
        db=db,
        action="BOOKING_CREATED",
        resource_type="booking",
        resource_id=booking.id,
        new_values={
            "booking_reference": booking.booking_reference,
            "plot_number": plot.plot_number,
            "status": booking.status,
            "amount_paid": float(amount_paid),
            "customer": req.customer_name or "Client",
            "booked_by": booked_by_str,
        },
    )

    # Commit all 3 tables atomically
    await db.commit()
    await db.refresh(booking)

    # Build response with relations
    c_stmt = select(Customer).where(Customer.id == cust_id)
    c_res = await db.execute(c_stmt)
    customer = c_res.scalar_one_or_none()

    c_name = f"{customer.first_name} {customer.last_name or ''}".strip() if customer else (req.customer_name or "Client")
    
    booked_by_name = None
    booked_by_email = None
    booked_by_role = None
    if booked_by_user_obj:
        booked_by_name = f"{booked_by_user_obj.first_name} {booked_by_user_obj.last_name or ''}".strip()
        booked_by_email = booked_by_user_obj.email
        booked_by_role = "Employee"

    return BookingResponse(
        id=booking.id,
        booking_reference=booking.booking_reference,
        plot_id=booking.plot_id,
        customer_id=booking.customer_id,
        channel_partner_id=booking.channel_partner_id,
        booked_by_user_id=booking.booked_by_user_id,
        status=booking.status,
        total_amount=booking.total_amount,
        token_amount=booking.token_amount,
        amount_paid=booking.amount_paid,
        balance_amount=booking.balance_amount,
        token_paid_at=booking.token_paid_at,
        token_expires_at=booking.token_expires_at,
        confirmed_at=booking.confirmed_at,
        payment_deadline_at=booking.payment_deadline_at,
        sold_at=booking.sold_at,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
        plot_number=plot.plot_number,
        project_name=plot.project.name if plot.project else "SCP Farm Layout",
        customer_name=c_name,
        customer_phone=customer.phone if customer else req.customer_phone,
        customer_email=customer.email if customer else req.customer_email,
        channel_partner_name=None,
        booked_by_name=booked_by_name,
        booked_by_email=booked_by_email,
        booked_by_role=booked_by_role,
    )
