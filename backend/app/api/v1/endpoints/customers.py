import uuid
import hashlib
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, Role, UserRole
from app.models.customer import Customer
from app.models.channel_partner import ChannelPartner
from app.schemas.customer import CustomerCreateRequest, CustomerUpdateRequest, CustomerListItem, CustomerDetail

router = APIRouter()


@router.get("", response_model=List[CustomerListItem])
async def list_customers(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    List registered customer accounts directly from PostgreSQL app.customers with assigned partner details.
    """
    stmt = select(Customer).where(Customer.user_id.is_not(None)).order_by(Customer.created_at.desc())

    if search:
        search_pattern = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Customer.first_name.ilike(search_pattern),
                Customer.last_name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
            )
        )

    if status_filter and status_filter != "all":
        stmt = stmt.where(Customer.status == status_filter)

    result = await db.execute(stmt)
    customers = result.scalars().all()

    items = []
    for c in customers:
        full_name = f"{c.first_name} {c.last_name or ''}".strip()
        partner_name = c.channel_partner.company_name if c.channel_partner else "Direct"

        plot_count = 0
        total_paid = 0.0
        total_balance = 0.0
        if c.bookings:
            active_b = [b for b in c.bookings if b.status != "cancelled"]
            plot_count = len(active_b)
            total_paid = sum(float(b.amount_paid or 0) for b in active_b)
            total_balance = sum(float(b.balance_amount or 0) for b in active_b)

        items.append(
            CustomerListItem(
                id=c.id,
                user_id=c.user_id,
                name=full_name,
                first_name=c.first_name,
                last_name=c.last_name,
                email=c.email,
                phone=c.phone,
                address=c.address_line_1,
                city=c.city,
                state=c.state,
                assigned_partner_id=c.assigned_channel_partner_id,
                assigned_partner_name=partner_name,
                total_paid=total_paid,
                total_balance=total_balance,
                allocated_plots_count=plot_count,
                status=c.status,
                created_at=c.created_at,
            )
        )

    return items


@router.post("", response_model=CustomerListItem, status_code=status.HTTP_201_CREATED)
async def create_customer(
    req: CustomerCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    1. Checks if User exists in app.users. If not, creates User with hashed password & 'customer' role.
    2. Inserts customer record in app.customers.
    3. The created customer can immediately login using their email and password!
    """
    req_email = req.email.lower().strip()

    # 1. Check if user already exists
    user_stmt = select(User).where(User.email == req_email)
    res = await db.execute(user_stmt)
    existing_user = res.scalar_one_or_none()

    if existing_user:
        # Check if already a customer
        cust_stmt = select(Customer).where(Customer.user_id == existing_user.id)
        cust_res = await db.execute(cust_stmt)
        if cust_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Customer with email '{req_email}' already exists.",
            )
        target_user = existing_user
    else:
        # Create new User account
        target_user = User(
            email=req_email,
            password_hash=get_password_hash(req.password or "customer123"),
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip() if req.last_name else None,
            phone=req.phone.strip(),
            is_active=True,
        )
        db.add(target_user)
        await db.flush()

        # Assign 'customer' role
        role_stmt = select(Role).where(
            or_(Role.code == "customer", Role.name == "Customer")
        )
        role_res = await db.execute(role_stmt)
        customer_role = role_res.scalar_one_or_none()

        if customer_role:
            user_role = UserRole(user_id=target_user.id, role_id=customer_role.id)
            db.add(user_role)
            await db.flush()

    # 2. Hash sensitive PII if provided
    pan_clean = req.pan_number.upper().strip() if req.pan_number else None
    pan_hash = hashlib.sha256(pan_clean.encode("utf-8")).hexdigest() if pan_clean else None
    pan_last4 = pan_clean[-4:] if pan_clean and len(pan_clean) >= 4 else None

    aadhar_clean = req.aadhar_number.replace(" ", "").strip() if req.aadhar_number else None
    aadhar_hash = hashlib.sha256(aadhar_clean.encode("utf-8")).hexdigest() if aadhar_clean else None
    aadhar_last4 = aadhar_clean[-4:] if aadhar_clean and len(aadhar_clean) >= 4 else None

    # 3. Create Customer Record in PostgreSQL
    new_customer = Customer(
        user_id=target_user.id,
        first_name=req.first_name.strip(),
        last_name=req.last_name.strip() if req.last_name else None,
        email=req_email,
        phone=req.phone.strip(),
        address_line_1=req.address_line_1,
        city=req.city,
        state=req.state,
        postal_code=req.postal_code,
        pan_encrypted=pan_clean,
        pan_hash=pan_hash,
        pan_last4=pan_last4,
        aadhaar_encrypted=aadhar_clean,
        aadhaar_hash=aadhar_hash,
        aadhaar_last4=aadhar_last4,
        assigned_channel_partner_id=req.assigned_channel_partner_id,
        status="active",
    )
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)

    full_name = f"{new_customer.first_name} {new_customer.last_name or ''}".strip()
    partner_name = new_customer.channel_partner.company_name if new_customer.channel_partner else "Direct"

    return CustomerListItem(
        id=new_customer.id,
        user_id=new_customer.user_id,
        name=full_name,
        first_name=new_customer.first_name,
        last_name=new_customer.last_name,
        email=new_customer.email,
        phone=new_customer.phone,
        address=new_customer.address_line_1,
        city=new_customer.city,
        state=new_customer.state,
        assigned_partner_id=new_customer.assigned_channel_partner_id,
        assigned_partner_name=partner_name,
        total_paid=0.0,
        total_balance=0.0,
        allocated_plots_count=0,
        status=new_customer.status,
        created_at=new_customer.created_at,
    )


@router.get("/{customer_id}", response_model=CustomerListItem)
async def get_customer_detail(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(Customer).where(Customer.id == customer_id)
    res = await db.execute(stmt)
    customer = res.scalar_one_or_none()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    full_name = f"{customer.first_name} {customer.last_name or ''}".strip()
    partner_name = customer.channel_partner.company_name if customer.channel_partner else "Direct"

    return CustomerListItem(
        id=customer.id,
        user_id=customer.user_id,
        name=full_name,
        first_name=customer.first_name,
        last_name=customer.last_name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address_line_1,
        city=customer.city,
        state=customer.state,
        assigned_partner_id=customer.assigned_channel_partner_id,
        assigned_partner_name=partner_name,
        total_paid=0.0,
        total_balance=0.0,
        allocated_plots_count=0,
        status=customer.status,
        created_at=customer.created_at,
    )


@router.patch("/{customer_id}", response_model=CustomerListItem)
async def update_customer(
    customer_id: uuid.UUID,
    req: CustomerUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    stmt = select(Customer).where(Customer.id == customer_id)
    res = await db.execute(stmt)
    customer = res.scalar_one_or_none()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    if req.first_name is not None:
        customer.first_name = req.first_name.strip()
    if req.last_name is not None:
        customer.last_name = req.last_name.strip()
    if req.email is not None:
        customer.email = req.email.lower().strip()
    if req.phone is not None:
        customer.phone = req.phone.strip()
    if req.address_line_1 is not None:
        customer.address_line_1 = req.address_line_1.strip()
    if req.city is not None:
        customer.city = req.city.strip()
    if req.state is not None:
        customer.state = req.state.strip()
    if req.postal_code is not None:
        customer.postal_code = req.postal_code.strip()
    if req.status is not None:
        customer.status = req.status
    if req.assigned_channel_partner_id is not None:
        customer.assigned_channel_partner_id = req.assigned_channel_partner_id

    # If linked user exists, keep User name and email synchronized
    if customer.user_id:
        user_stmt = select(User).where(User.id == customer.user_id)
        user_res = await db.execute(user_stmt)
        user_obj = user_res.scalar_one_or_none()
        if user_obj:
            if req.first_name is not None:
                user_obj.first_name = req.first_name.strip()
            if req.last_name is not None:
                user_obj.last_name = req.last_name.strip()
            if req.email is not None:
                user_obj.email = req.email.lower().strip()
            if req.phone is not None:
                user_obj.phone = req.phone.strip()

    await db.commit()
    await db.refresh(customer)

    full_name = f"{customer.first_name} {customer.last_name or ''}".strip()
    partner_name = customer.channel_partner.company_name if customer.channel_partner else "Direct"

    plot_count = 0
    total_paid = 0.0
    total_balance = 0.0
    if customer.bookings:
        active_b = [b for b in customer.bookings if b.status != "cancelled"]
        plot_count = len(active_b)
        total_paid = sum(float(b.amount_paid or 0) for b in active_b)
        total_balance = sum(float(b.balance_amount or 0) for b in active_b)

    return CustomerListItem(
        id=customer.id,
        user_id=customer.user_id,
        name=full_name,
        first_name=customer.first_name,
        last_name=customer.last_name,
        email=customer.email,
        phone=customer.phone,
        address=customer.address_line_1,
        city=customer.city,
        state=customer.state,
        assigned_partner_id=customer.assigned_channel_partner_id,
        assigned_partner_name=partner_name,
        total_paid=total_paid,
        total_balance=total_balance,
        allocated_plots_count=plot_count,
        status=customer.status,
        created_at=customer.created_at,
    )
