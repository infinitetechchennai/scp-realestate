import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, update, delete
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User, Role, UserRole
from app.models.channel_partner import ChannelPartner
from app.models.customer import Customer
from app.models.notification import Notification, NotificationRecipient
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationRecipientItem,
)
from app.utils.audit import log_audit_event

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    List notifications.
    Super Admins see all broadcasted & target notifications.
    Channel Partners & Customers see their personal / broadcast inbox.
    """
    user_roles = [ur.role.name for ur in current_user.roles if ur.role]
    is_admin = "super_admin" in user_roles or "Super Admin" in user_roles

    if is_admin:
        # Super Admin: Fetch all created notifications
        stmt = select(Notification).order_by(desc(Notification.created_at))
        if category and category != "all":
            stmt = stmt.where(Notification.notification_type == category)
        res = await db.execute(stmt)
        notifs = res.scalars().all()

        results = []
        for n in notifs:
            recipients = n.recipients or []
            r_count = len(recipients)
            
            # Form friendly target label
            target_label = "Everyone (Broadcast)"
            if n.entity_type == "all_channel_partners":
                target_label = "All Channel Partners"
            elif n.entity_type == "all_customers":
                target_label = "All Customers"
            elif n.entity_type == "specific_user" and recipients:
                target_label = f"Specific User ({recipients[0].user.first_name if recipients[0].user else 'Target'})"

            recipients_preview = []
            for r in recipients[:10]:
                u_name = f"{r.user.first_name} {r.user.last_name or ''}".strip() if r.user else "User"
                u_email = r.user.email if r.user else ""
                r_role = r.user.roles[0].role.name if (r.user and r.user.roles and r.user.roles[0].role) else "user"
                recipients_preview.append(
                    NotificationRecipientItem(
                        user_id=r.user_id,
                        user_name=u_name,
                        user_email=u_email,
                        role=r_role,
                        read_at=r.read_at,
                    )
                )

            results.append(
                NotificationResponse(
                    id=n.id,
                    notification_type=n.notification_type,
                    title=n.title,
                    message=n.message,
                    entity_type=n.entity_type,
                    entity_id=n.entity_id,
                    created_at=n.created_at,
                    target_label=target_label,
                    recipient_count=r_count,
                    is_read=True,
                    recipients_preview=recipients_preview,
                )
            )
        return results

    else:
        # Non-admin user: Fetch only their notifications from app.notification_recipients
        stmt = (
            select(Notification, NotificationRecipient)
            .join(NotificationRecipient, Notification.id == NotificationRecipient.notification_id)
            .where(NotificationRecipient.user_id == current_user.id)
            .order_by(desc(Notification.created_at))
        )
        if category and category != "all":
            stmt = stmt.where(Notification.notification_type == category)

        res = await db.execute(stmt)
        rows = res.all()

        results = []
        for n, r in rows:
            results.append(
                NotificationResponse(
                    id=n.id,
                    notification_type=n.notification_type,
                    title=n.title,
                    message=n.message,
                    entity_type=n.entity_type,
                    entity_id=n.entity_id,
                    created_at=n.created_at,
                    target_label="Direct Message",
                    recipient_count=1,
                    is_read=r.read_at is not None,
                    read_at=r.read_at,
                )
            )
        return results


@router.post("", response_model=NotificationResponse)
@router.post("/", response_model=NotificationResponse)
async def create_notification(
    payload: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to create and distribute a notification / offer.
    Supports broadcast to all partners, all customers, everyone, or specific users.
    """
    now = datetime.now(timezone.utc)

    # 1. Determine list of recipient user_ids
    target_user_ids: List[uuid.UUID] = []

    if payload.target_audience == "specific_user" and payload.target_user_id:
        target_user_ids = [payload.target_user_id]
    elif payload.target_user_ids:
        target_user_ids = payload.target_user_ids
    elif payload.target_audience == "all_channel_partners":
        # Get user_ids of all channel partners
        cp_stmt = select(ChannelPartner.user_id).where(ChannelPartner.status == "approved")
        cp_res = await db.execute(cp_stmt)
        target_user_ids = [uid for uid in cp_res.scalars().all() if uid]
        if not target_user_ids:
            # Fallback to all channel partners regardless of status
            cp_stmt2 = select(ChannelPartner.user_id)
            cp_res2 = await db.execute(cp_stmt2)
            target_user_ids = [uid for uid in cp_res2.scalars().all() if uid]
    elif payload.target_audience == "all_customers":
        # Get user_ids of all customers
        cust_stmt = select(Customer.user_id).where(Customer.user_id.is_not(None))
        cust_res = await db.execute(cust_stmt)
        target_user_ids = [uid for uid in cust_res.scalars().all() if uid]
    else:
        # broadcast_all: All active users in the system
        u_stmt = select(User.id).where(User.is_active == True)
        u_res = await db.execute(u_stmt)
        target_user_ids = list(u_res.scalars().all())

    # 2. Insert parent Notification record
    new_notif = Notification(
        notification_type=payload.notification_type,
        title=payload.title,
        message=payload.message,
        entity_type=payload.target_audience,
        entity_id=payload.target_user_id if payload.target_audience == "specific_user" else None,
        created_at=now,
    )
    db.add(new_notif)
    await db.flush()

    # 3. Insert NotificationRecipient rows
    for uid in set(target_user_ids):
        rec = NotificationRecipient(
            notification_id=new_notif.id,
            user_id=uid,
            delivered_at=now,
        )
        db.add(rec)

    await log_audit_event(
        db=db,
        action="BROADCAST_NOTIFICATION",
        resource_type="notification",
        actor_user_id=current_admin.id,
        resource_id=new_notif.id,
        new_values={
            "title": new_notif.title,
            "type": new_notif.notification_type,
            "target": payload.target_audience,
            "recipients_count": len(target_user_ids),
        },
    )

    await db.commit()
    await db.refresh(new_notif)

    # Friendly target label
    target_label = "Everyone (Broadcast)"
    if payload.target_audience == "all_channel_partners":
        target_label = "All Channel Partners"
    elif payload.target_audience == "all_customers":
        target_label = "All Customers"
    elif payload.target_audience == "specific_user":
        target_label = "Specific User"

    return NotificationResponse(
        id=new_notif.id,
        notification_type=new_notif.notification_type,
        title=new_notif.title,
        message=new_notif.message,
        entity_type=new_notif.entity_type,
        entity_id=new_notif.entity_id,
        created_at=new_notif.created_at,
        target_label=target_label,
        recipient_count=len(target_user_ids),
        is_read=True,
    )


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Mark a notification as read by current user.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        update(NotificationRecipient)
        .where(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == current_user.id,
        )
        .values(read_at=now)
    )
    await db.execute(stmt)
    await db.commit()
    return {"success": True, "notification_id": str(notification_id), "read_at": now.isoformat()}


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Mark all unread notifications for current user as read.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        update(NotificationRecipient)
        .where(
            NotificationRecipient.user_id == current_user.id,
            NotificationRecipient.read_at.is_(None),
        )
        .values(read_at=now)
    )
    await db.execute(stmt)
    await db.commit()
    return {"success": True, "read_at": now.isoformat()}


@router.get("/users-dropdown")
async def get_audience_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Helper for Super Admin dropdown to select a specific Channel Partner or Customer.
    """
    users_stmt = select(User).where(User.is_active == True).order_by(User.first_name)
    res = await db.execute(users_stmt)
    all_users = res.scalars().all()

    options = []
    for u in all_users:
        r_name = u.roles[0].role.name if (u.roles and u.roles[0].role) else "User"
        display_name = f"{u.first_name} {u.last_name or ''}".strip()
        options.append({
            "user_id": str(u.id),
            "name": display_name or u.email,
            "email": u.email,
            "role": r_name,
            "label": f"{display_name} ({u.email}) — [{r_name}]"
        })

    return options
