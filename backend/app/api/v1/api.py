from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.channel_partners import router as channel_partners_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.customers import router as customers_router
from app.api.v1.endpoints import plots, projects, bookings, payments

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & KYC"])
api_router.include_router(channel_partners_router, prefix="/admin/channel-partners", tags=["Admin Channel Partners"])
api_router.include_router(documents_router, prefix="/documents", tags=["KYC Document Storage"])
api_router.include_router(customers_router, prefix="/customers", tags=["Customers Management"])
api_router.include_router(plots.router, prefix="/plots", tags=["Plots Management"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects Master Plans"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings Pipeline"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments Audit Trail"])
