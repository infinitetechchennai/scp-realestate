import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import Role, User, UserRole
from app.models.project import Project
from app.models.plot import Plot
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

        # Seed default project if not exists
        proj_uuid = uuid.UUID("c0000001-0000-0000-0000-000000000001")
        stmt_proj = select(Project).where(Project.id == proj_uuid)
        res_proj = await session.execute(stmt_proj)
        proj = res_proj.scalar_one_or_none()

        if not proj:
            proj = Project(
                id=proj_uuid,
                code="SCP-2026",
                name="SCP Farm Layout (184 Plots)",
                description="Master township cadastral development featuring 184 residential plots, 20ft wide arterial roads, and Suramriver riverfront boundary.",
                address_line_1="Main Highway Layout, Hyderabad",
                city="Hyderabad",
                state="Telangana",
                postal_code="500081",
                country_code="IN",
                total_area_sqft=1067220.00,
                total_plots=184,
                default_price_per_sqft=2500.00,
                default_token_amount=100000.00,
                status="active",
                image_url="/blueprint.png",
                blueprint_url="/blueprint.png",
            )
            session.add(proj)
            await session.flush()

        # Seed initial 184 plots if plots table is empty
        stmt_plots_cnt = select(func.count()).select_from(Plot).where(Plot.project_id == proj.id)
        res_plots_cnt = await session.execute(stmt_plots_cnt)
        plots_count = res_plots_cnt.scalar() or 0

        if plots_count == 0:
            for i in range(1, 185):
                plot_num = f"P-{i:03d}" if i >= 100 else (f"P-0{i}" if i >= 10 else f"P-00{i}")
                area = 2200.0 if i in [1, 2, 183, 184] else (1880.0 if i % 7 == 0 else (1750.0 if i % 5 == 0 else 1500.0))
                rate = 2500.0
                total_price = area * rate
                facing = "South" if i <= 15 else ("North" if i <= 80 else ("East" if i % 2 == 0 else "West"))
                road_width = "16' wide road" if i <= 15 else ("Main 20' Wide Road" if (63 < i <= 87) else "20 ft")

                p = Plot(
                    project_id=proj.id,
                    plot_number=plot_num,
                    area_sqft=area,
                    dimensions="30x50",
                    facing=facing,
                    road_width_ft=16.0 if i <= 15 else 20.0,
                    price_per_sqft=rate,
                    total_price=total_price,
                    token_required=20000.0,
                    status="available",
                )
                session.add(p)

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

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
