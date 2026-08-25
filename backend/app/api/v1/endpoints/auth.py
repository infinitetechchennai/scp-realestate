import uuid
import random
import hashlib
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, Role, UserRole
from app.models.channel_partner import ChannelPartner, ChannelPartnerBankAccount
from app.schemas.auth import LoginRequest, TokenResponse, RegisterPartnerRequest, KycStatusResponse, UserProfile
from app.api.deps import get_current_user
from app.utils.audit import log_audit_event

router = APIRouter()


@router.post("/login")
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Authenticate user and handle role-based KYC gatekeeping.
    """
    # 1. Fetch user by email
    stmt = select(User).where(User.email == login_data.email.lower(), User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 2. Check Role (matches code and name case-insensitively)
    user_roles = []
    for ur in user.roles:
        if ur.role:
            if ur.role.code:
                user_roles.append(ur.role.code.lower())
            if ur.role.name:
                user_roles.append(ur.role.name.lower())
                user_roles.append(ur.role.name.lower().replace(" ", "_"))
    
    # Verify requested role matches user's actual roles
    req_role = login_data.role.lower()
    has_role_match = (
        req_role in user_roles
        or "super_admin" in user_roles
        or (req_role in ["user", "employee"] and any(r in user_roles for r in ["user", "employee", "customer"]))
    )
    if not has_role_match:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User is not registered with role '{login_data.role}'",
        )

    primary_role = "user" if req_role in ["user", "employee"] else req_role

    # 3. Channel Partner KYC Verification Gatekeeping
    if primary_role == "channel_partner":
        stmt_partner = select(ChannelPartner).where(ChannelPartner.user_id == user.id)
        res_partner = await db.execute(stmt_partner)
        partner = res_partner.scalar_one_or_none()

        if not partner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Channel partner profile not found. Please complete registration.",
            )

        # Check KYC Status
        if partner.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "status": "pending",
                    "message": "Your KYC documents (Aadhaar & PAN) are currently pending verification by Admin.",
                    "company_name": partner.company_name,
                    "email": user.email,
                    "aadhar_number": partner.aadhaar_encrypted or (f"XXXX-XXXX-{partner.aadhaar_last4}" if partner.aadhaar_last4 else None),
                    "pan_number": partner.pan_encrypted or (f"XXXXXX{partner.pan_last4}" if partner.pan_last4 else None),
                }
            )

        if partner.status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "status": "rejected",
                    "message": "Your KYC application was rejected by Admin. Please re-submit your documents.",
                    "rejection_reason": partner.rejection_reason or "Document verification failed",
                    "company_name": partner.company_name,
                    "email": user.email,
                }
            )

        if partner.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "status": "suspended",
                    "message": "Your Channel Partner account is currently suspended. Please contact Admin.",
                    "company_name": partner.company_name,
                    "email": user.email,
                }
            )

    # 4. Generate JWT Token
    access_token = create_access_token(subject=user.id, role=primary_role)

    # Record login audit event
    await log_audit_event(
        db=db,
        action="USER_LOGIN",
        resource_type="auth",
        actor_user_id=user.id,
        new_values={"email": user.email, "role": primary_role, "status": "SUCCESS"},
    )
    await db.commit()

    user_profile = UserProfile(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        role=primary_role
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=primary_role,
        user=user_profile
    )


@router.post("/register-partner", response_model=KycStatusResponse, status_code=status.HTTP_201_CREATED)
async def register_channel_partner(
    req: RegisterPartnerRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Register a new Channel Partner with Aadhaar & PAN KYC and Commission Bank details.
    """
    # 1. Check if email already registered
    stmt_check = select(User).where(User.email == req.email.lower())
    res_check = await db.execute(stmt_check)
    if res_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    clean_aadhar = req.aadhar_number.replace(" ", "")
    clean_pan = req.pan_number.upper()
    aadhaar_hash = hashlib.sha256(clean_aadhar.encode("utf-8")).hexdigest()
    pan_hash = hashlib.sha256(clean_pan.encode("utf-8")).hexdigest()

    # Check duplicate Aadhaar
    dup_a = await db.execute(select(ChannelPartner.id).where(ChannelPartner.aadhaar_hash == aadhaar_hash).limit(1))
    if dup_a.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A Channel Partner with this Aadhaar number is already registered.",
        )

    # Check duplicate PAN
    dup_p = await db.execute(select(ChannelPartner.id).where(ChannelPartner.pan_hash == pan_hash).limit(1))
    if dup_p.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A Channel Partner with this PAN number is already registered.",
        )

    # 2. Find or create 'channel_partner' role
    stmt_role = select(Role).where((Role.code == "channel_partner") | (Role.name == "channel_partner") | (Role.name == "Channel Partner"))
    res_role = await db.execute(stmt_role)
    cp_role = res_role.scalar_one_or_none()
    
    if not cp_role:
        cp_role = Role(code="channel_partner", name="Channel Partner", description="External Real Estate Channel Partner / Broker")
        db.add(cp_role)
        await db.flush()

    # 3. Create User record
    new_user = User(
        email=req.email.lower(),
        password_hash=get_password_hash(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        phone=req.phone,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    # 4. Assign Role
    user_role = UserRole(user_id=new_user.id, role_id=cp_role.id)
    db.add(user_role)

    # 5. Create Channel Partner Profile (status: pending)
    partner_code = f"CP-{random.randint(1000, 9999)}"

    new_partner = ChannelPartner(
        user_id=new_user.id,
        partner_code=partner_code,
        company_name=req.company_name,
        first_name=req.first_name,
        last_name=req.last_name,
        email=req.email.lower(),
        phone=req.phone,
        aadhaar_encrypted=clean_aadhar,
        aadhaar_hash=aadhaar_hash,
        aadhaar_last4=clean_aadhar[-4:] if len(clean_aadhar) >= 4 else clean_aadhar,
        pan_encrypted=clean_pan,
        pan_hash=pan_hash,
        pan_last4=clean_pan[-4:] if len(clean_pan) >= 4 else clean_pan,
        address_line_1=req.office_address,
        city=req.city,
        state=req.state,
        postal_code=req.pincode,
        status="pending",
        registration_paid=False,
        registration_fee=500.00,
    )
    db.add(new_partner)
    await db.flush()

    # 6. Add Bank Account Details if provided
    if req.bank_name and req.account_number and req.ifsc_code:
        acc_hash = hashlib.sha256(req.account_number.encode("utf-8")).hexdigest()
        bank_acc = ChannelPartnerBankAccount(
            channel_partner_id=new_partner.id,
            bank_name=req.bank_name,
            account_number_encrypted=req.account_number,
            account_number_hash=acc_hash,
            ifsc_code=req.ifsc_code.upper(),
            account_holder_name=f"{req.first_name} {req.last_name or ''}".strip(),
            is_primary=True,
        )
        db.add(bank_acc)

    await db.commit()

    return KycStatusResponse(
        partner_id=new_partner.id,
        status="pending",
        message="Channel Partner registration and KYC submitted successfully. Please complete ₹500 KYC onboarding payment.",
        company_name=req.company_name,
        email=req.email,
        aadhar_number=req.aadhar_number,
        pan_number=req.pan_number.upper(),
    )


@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current logged-in user profile.
    """
    user_roles = [ur.role.name for ur in current_user.roles if ur.role]
    primary_role = user_roles[0] if user_roles else "customer"

    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        role=primary_role
    )
