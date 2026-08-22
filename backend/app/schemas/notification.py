import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    message: str = Field(..., min_length=2)
    notification_type: str = "offer"  # 'offer', 'announcement', 'reminder', 'system'
    target_audience: str = "broadcast_all"  # 'broadcast_all', 'all_channel_partners', 'all_customers', 'specific_user'
    target_user_id: Optional[uuid.UUID] = None
    target_user_ids: Optional[List[uuid.UUID]] = None


class NotificationRecipientItem(BaseModel):
    user_id: uuid.UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    role: Optional[str] = None
    read_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    notification_type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    # Extra fields for UI display
    target_label: Optional[str] = "Everyone"
    recipient_count: int = 0
    is_read: bool = False
    read_at: Optional[datetime] = None
    recipients_preview: Optional[List[NotificationRecipientItem]] = None
