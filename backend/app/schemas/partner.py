import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class PartnerBankAccountSchema(BaseModel):
    id: uuid.UUID
    bank_name: str
    account_number: str
    ifsc_code: str
    account_holder_name: Optional[str] = None
    is_primary: bool

    class Config:
        from_attributes = True

class PartnerListItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    company_name: str
    name: str
    email: str
    phone: Optional[str] = None
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    status: str
    registration_fee_paid: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PartnerKycDetail(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    company_name: str
    first_name: str
    last_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    registration_fee_paid: bool
    created_at: datetime
    
    bank_accounts: List[PartnerBankAccountSchema] = []

    class Config:
        from_attributes = True

class PartnerApprovalRequest(BaseModel):
    rejection_reason: Optional[str] = None
