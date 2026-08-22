import uuid
from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    actor_user_id: Optional[uuid.UUID] = None
    user_name: Optional[str] = "System"
    user_email: Optional[str] = None
    user_role: Optional[str] = "system"
    action: str
    resource_type: str
    resource_id: Optional[uuid.UUID] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = "127.0.0.1"
    user_agent: Optional[str] = None
    created_at: datetime
    description: Optional[str] = None


class AuditStatsResponse(BaseModel):
    total_logs: int
    modules_count: Dict[str, int]
    actions_count: Dict[str, int]
