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
]
