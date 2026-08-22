import uuid
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = Field(..., description="super_admin, channel_partner, or customer")

class UserProfile(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserProfile

class RegisterPartnerRequest(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str = Field(..., min_length=10, max_length=15)
    office_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    # KYC Identification
    aadhar_number: str = Field(..., min_length=12, max_length=14)
    pan_number: str = Field(..., min_length=10, max_length=10)
    
    # Payout Bank details
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None

class KycStatusResponse(BaseModel):
    partner_id: Optional[uuid.UUID] = None
    status: str # 'pending', 'rejected', 'approved', 'suspended'
    message: str
    company_name: str
    email: str
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    rejection_reason: Optional[str] = None
