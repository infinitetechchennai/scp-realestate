import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.channel_partner import ChannelPartner
from app.models.payment import Payment
from app.schemas.partner import PartnerListItem, PartnerKycDetail, PartnerApprovalRequest
from app.api.deps import require_role
from app.utils.audit import log_audit_event

router = APIRouter()


@router.get("", response_model=List[PartnerListItem])
async def list_channel_partners(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to list all channel partners with status filters.
    """
    stmt = select(ChannelPartner).join(User, ChannelPartner.user_id == User.id)

    if status_filter and status_filter != "all":
        stmt = stmt.where(ChannelPartner.status == status_filter)

    if search:
        search_pattern = f"%{search.lower()}%"
        stmt = stmt.where(
            (ChannelPartner.company_name.ilike(search_pattern)) |
            (User.first_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )

    stmt = stmt.order_by(ChannelPartner.created_at.desc())
    result = await db.execute(stmt)
    partners = result.scalars().all()

    # Fetch all partner IDs that have an actual completed payment in app.payments
    from app.models.payment import Payment
    pay_stmt = select(Payment.channel_partner_id).where(
        Payment.channel_partner_id.is_not(None),
        Payment.payment_type == "registration_fee",
        Payment.status == "completed"
    )
    pay_res = await db.execute(pay_stmt)
    paid_partner_ids = set(pay_res.scalars().all())

    items = []
    for p in partners:
        p_fname = p.first_name or (p.user.first_name if p.user else "")
        p_lname = p.last_name or (p.user.last_name if p.user else "")
        p_email = p.email or (p.user.email if p.user else "")
        p_phone = p.phone or (p.user.phone if p.user else None)
        is_paid = bool(p.registration_paid) or (p.id in paid_partner_ids)

        items.append(
            PartnerListItem(
                id=p.id,
                user_id=p.user_id,
                company_name=p.company_name,
                name=f"{p_fname} {p_lname}".strip() or p.company_name,
                email=p_email,
                phone=p_phone,
                aadhar_number=p.aadhaar_encrypted or (f"XXXX-XXXX-{p.aadhaar_last4}" if p.aadhaar_last4 else None),
                pan_number=p.pan_encrypted or (f"XXXXXX{p.pan_last4}" if p.pan_last4 else None),
                status=p.status,
                registration_fee_paid=is_paid,
                created_at=p.created_at,
            )
        )
    return items


@router.get("/{partner_id}", response_model=PartnerKycDetail)
async def get_channel_partner_kyc(
    partner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to inspect full KYC, document numbers, and banking details.
    """
    stmt = select(ChannelPartner).where(ChannelPartner.id == partner_id)
    result = await db.execute(stmt)
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel partner not found",
        )

    # Transform bank accounts for response schema
    bank_list = []
    for b in partner.bank_accounts:
        bank_list.append({
            "id": b.id,
            "bank_name": b.bank_name,
            "account_number": b.account_number_encrypted or "XXXX-XXXX",
            "ifsc_code": b.ifsc_code,
            "account_holder_name": b.account_holder_name,
            "is_primary": getattr(b, "is_primary", True),
        })

    p_fname = partner.first_name or (partner.user.first_name if partner.user else "")
    p_lname = partner.last_name or (partner.user.last_name if partner.user else "")
    p_email = partner.email or (partner.user.email if partner.user else "")
    p_phone = partner.phone or (partner.user.phone if partner.user else None)

    # Strictly check if an actual payment was recorded
    pay_chk = await db.execute(
        select(Payment.id).where(
            Payment.channel_partner_id == partner.id,
            Payment.payment_type == "registration_fee",
            Payment.status == "completed"
        ).limit(1)
    )
    is_paid = (pay_chk.scalar_one_or_none() is not None) or (partner.registration_paid is True)

    # Fetch uploaded document files from app.entity_documents
    from app.models.document import EntityDocument, File as FileModel
    doc_stmt = (
        select(EntityDocument, FileModel)
        .join(FileModel, EntityDocument.file_id == FileModel.id)
        .where(
            EntityDocument.entity_id == partner.id,
            EntityDocument.entity_type == "channel_partner"
        )
        .order_by(EntityDocument.created_at.desc())
    )
    doc_res = await db.execute(doc_stmt)
    rows = doc_res.all()

    aadhar_file_url = None
    aadhar_mime_type = None
    pan_file_url = None
    pan_mime_type = None
    for d, f in rows:
        if d.document_type in ["aadhaar", "aadhar"] and not aadhar_file_url:
            aadhar_file_url = f"/api/v1/documents/{d.file_id}/download"
            aadhar_mime_type = f.mime_type or ("application/pdf" if f.original_file_name.lower().endswith(".pdf") else "image/jpeg")
        elif d.document_type == "pan" and not pan_file_url:
            pan_file_url = f"/api/v1/documents/{d.file_id}/download"
            pan_mime_type = f.mime_type or ("application/pdf" if f.original_file_name.lower().endswith(".pdf") else "image/jpeg")

    return PartnerKycDetail(
        id=partner.id,
        user_id=partner.user_id,
        company_name=partner.company_name,
        first_name=p_fname,
        last_name=p_lname,
        email=p_email,
        phone=p_phone,
        office_address=partner.address_line_1,
        city=partner.city,
        state=partner.state,
        pincode=partner.postal_code,
        aadhar_number=partner.aadhaar_encrypted or (f"XXXX-XXXX-{partner.aadhaar_last4}" if partner.aadhaar_last4 else None),
        pan_number=partner.pan_encrypted or (f"XXXXXX{partner.pan_last4}" if partner.pan_last4 else None),
        aadhar_file_url=aadhar_file_url,
        aadhar_mime_type=aadhar_mime_type,
        pan_file_url=pan_file_url,
        pan_mime_type=pan_mime_type,
        status=partner.status,
        rejection_reason=None,
        registration_fee_paid=is_paid,
        created_at=partner.created_at,
        bank_accounts=bank_list,
    )


@router.post("/{partner_id}/approve")
async def approve_channel_partner(
    partner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to approve a Channel Partner KYC and unlock dashboard login.
    """
    stmt = select(ChannelPartner).where(ChannelPartner.id == partner_id)
    result = await db.execute(stmt)
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel partner not found",
        )

    partner.status = "approved"
    partner.approved_at = datetime.now(timezone.utc)
    partner.approved_by = current_admin.id

    await log_audit_event(
        db=db,
        action="PARTNER_APPROVED",
        resource_type="channel_partner",
        actor_user_id=current_admin.id,
        resource_id=partner.id,
        new_values={"company_name": partner.company_name, "status": "approved"},
    )
    await db.commit()

    return {
        "success": True,
        "message": f"Channel Partner '{partner.company_name}' has been approved and login is now active.",
        "partner_id": partner.id,
        "status": "approved"
    }


@router.post("/{partner_id}/reject")
async def reject_channel_partner(
    partner_id: uuid.UUID,
    req: PartnerApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to reject a Channel Partner KYC application with a reason.
    """
    stmt = select(ChannelPartner).where(ChannelPartner.id == partner_id)
    result = await db.execute(stmt)
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel partner not found",
        )

    partner.status = "rejected"
    await log_audit_event(
        db=db,
        action="PARTNER_REJECTED",
        resource_type="channel_partner",
        actor_user_id=current_admin.id,
        resource_id=partner.id,
        new_values={"company_name": partner.company_name, "status": "rejected", "reason": req.rejection_reason},
    )
    await db.commit()

    return {
        "success": True,
        "message": f"Channel Partner '{partner.company_name}' has been rejected.",
        "partner_id": partner.id,
        "status": "rejected",
        "reason": req.rejection_reason or "Document verification failed."
    }


@router.post("/{partner_id}/suspend")
async def suspend_channel_partner(
    partner_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to suspend a Channel Partner account.
    """
    stmt = select(ChannelPartner).where(ChannelPartner.id == partner_id)
    result = await db.execute(stmt)
    partner = result.scalar_one_or_none()

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel partner not found",
        )

    partner.status = "suspended"
    await log_audit_event(
        db=db,
        action="PARTNER_SUSPENDED",
        resource_type="channel_partner",
        actor_user_id=current_admin.id,
        resource_id=partner.id,
        new_values={"company_name": partner.company_name, "status": "suspended"},
    )
    await db.commit()

    return {
        "success": True,
        "message": f"Channel Partner '{partner.company_name}' has been suspended.",
        "partner_id": partner.id,
        "status": "suspended"
    }
