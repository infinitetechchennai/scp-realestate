from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RegisterPartnerRequest,
    KycStatusResponse,
    UserProfile,
)
from app.schemas.partner import (
    PartnerListItem,
    PartnerKycDetail,
    PartnerApprovalRequest,
)
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerListItem,
    CustomerDetail,
)
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectResponse,
)
from app.schemas.plot import (
    PlotCreateRequest,
    PlotResponse,
    PlotStatusUpdateRequest,
)
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
)
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "RegisterPartnerRequest",
    "KycStatusResponse",
    "UserProfile",
    "PartnerListItem",
    "PartnerKycDetail",
    "PartnerApprovalRequest",
    "CustomerCreateRequest",
    "CustomerListItem",
    "CustomerDetail",
    "ProjectCreateRequest",
    "ProjectResponse",
    "PlotCreateRequest",
    "PlotResponse",
    "PlotStatusUpdateRequest",
    "BookingCreate",
    "BookingUpdate",
    "BookingResponse",
    "PaymentCreate",
    "PaymentResponse",
]
