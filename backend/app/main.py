from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import Role, User, UserRole
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed default roles and admin if not already present
    async with AsyncSessionLocal() as session:
        # Seed standard roles with both code and name
        roles_to_seed = [
            ("super_admin", "Super Admin", "Super Administrator with full portal privileges"),
            ("channel_partner", "Channel Partner", "Channel Partner / Real Estate Broker"),
            ("customer", "Customer", "End customer / Plot buyer"),
        ]
        for role_code, role_name, desc in roles_to_seed:
            stmt = select(Role).where((Role.code == role_code) | (Role.name == role_name))
            res = await session.execute(stmt)
            if not res.scalar_one_or_none():
                new_role = Role(code=role_code, name=role_name, description=desc)
                session.add(new_role)

        await session.flush()

        # Seed default super admin user if not exists
        stmt_admin = select(User).where(User.email == "admin@example.com")
        res_admin = await session.execute(stmt_admin)
        admin_user = res_admin.scalar_one_or_none()

        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),
                first_name="Suresh",
                last_name="Admin",
                phone="9876543200",
                is_active=True,
            )
            session.add(admin_user)
            await session.flush()

            # Assign super_admin role
            stmt_super_role = select(Role).where((Role.code == "super_admin") | (Role.name == "super_admin") | (Role.name == "Super Admin"))
            res_super_role = await session.execute(stmt_super_role)
            super_role = res_super_role.scalar_one_or_none()

            if super_role:
                user_role = UserRole(user_id=admin_user.id, role_id=super_role.id)
                session.add(user_role)

        await session.commit()
    
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Master Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Seven Circle Property API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
