import uuid
from typing import Optional, Any, Dict
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog


async def log_audit_event(
    db: AsyncSession,
    action: str,
    resource_type: str,
    actor_user_id: Optional[uuid.UUID] = None,
    resource_id: Optional[uuid.UUID] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Helper function to record an immutable audit log row into app.audit_logs in PostgreSQL.
    """
    client_ip = ip_address
    client_ua = user_agent

    if request:
        client_ip = client_ip or request.client.host if request.client else "127.0.0.1"
        client_ua = client_ua or request.headers.get("user-agent", "Unknown")

    # In case of local IPv6 / IPv4 loopback
    if client_ip in ("::1", "localhost"):
        client_ip = "127.0.0.1"

    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=client_ip if (client_ip and ":" not in client_ip) or (client_ip and client_ip.count(".") == 3) else "127.0.0.1",
        user_agent=client_ua,
    )
    db.add(entry)
    # Note: caller will commit or flush as part of transaction
    return entry
