import uuid
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, or_
from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse, AuditStatsResponse

router = APIRouter()


@router.get("", response_model=List[AuditLogResponse])
@router.get("/", response_model=List[AuditLogResponse])
async def list_audit_logs(
    module: Optional[str] = Query(None, description="Filter by resource_type"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    search: Optional[str] = Query(None, description="Search by action, user name, or email"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to list immutable activity logs from PostgreSQL app.audit_logs.
    """
    stmt = (
        select(AuditLog)
        .outerjoin(User, AuditLog.actor_user_id == User.id)
        .order_by(desc(AuditLog.created_at))
    )

    if module and module != "all":
        stmt = stmt.where(AuditLog.resource_type == module)

    if action and action != "all":
        stmt = stmt.where(AuditLog.action == action)

    if search:
        search_pattern = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                AuditLog.action.ilike(search_pattern),
                AuditLog.resource_type.ilike(search_pattern),
                User.first_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
            )
        )

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    logs = res.scalars().all()

    results = []
    for log in logs:
        actor = log.actor
        actor_name = f"{actor.first_name} {actor.last_name or ''}".strip() if actor else "System Automated"
        actor_email = actor.email if actor else None
        actor_role = actor.roles[0].role.name if (actor and actor.roles and actor.roles[0].role) else "system"

        # Generate a human-readable description if needed
        desc_text = f"{log.action} executed on {log.resource_type}"
        if log.new_values and isinstance(log.new_values, dict):
            if "message" in log.new_values:
                desc_text = str(log.new_values["message"])
            elif "title" in log.new_values:
                desc_text = f"{log.action}: {log.new_values['title']}"
            elif "status" in log.new_values:
                desc_text = f"Status changed to {log.new_values['status']}"
            elif "company_name" in log.new_values:
                desc_text = f"Partner: {log.new_values['company_name']}"

        results.append(
            AuditLogResponse(
                id=log.id,
                actor_user_id=log.actor_user_id,
                user_name=actor_name,
                user_email=actor_email,
                user_role=actor_role,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                old_values=log.old_values,
                new_values=log.new_values,
                ip_address=str(log.ip_address) if log.ip_address else "127.0.0.1",
                user_agent=log.user_agent,
                created_at=log.created_at,
                description=desc_text,
            )
        )
    return results


@router.get("/stats", response_model=AuditStatsResponse)
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_role(["super_admin"])),
) -> Any:
    """
    Super Admin endpoint to get aggregate statistics of audit trails.
    """
    total_cnt = await db.execute(select(func.count(AuditLog.id)))
    total = total_cnt.scalar() or 0

    # Modules count
    mod_stmt = select(AuditLog.resource_type, func.count(AuditLog.id)).group_by(AuditLog.resource_type)
    mod_res = await db.execute(mod_stmt)
    modules_count = {row[0]: row[1] for row in mod_res.all()}

    # Actions count
    act_stmt = select(AuditLog.action, func.count(AuditLog.id)).group_by(AuditLog.action)
    act_res = await db.execute(act_stmt)
    actions_count = {row[0]: row[1] for row in act_res.all()}

    return AuditStatsResponse(
        total_logs=total,
        modules_count=modules_count,
        actions_count=actions_count,
    )
