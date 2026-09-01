import re
import uuid
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest, ProjectResponse

router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
@router.get("/", response_model=List[ProjectResponse])
async def get_projects(db: AsyncSession = Depends(get_db)) -> Any:
    """
    Fetch all projects dynamically with computed plot statistics from app.plots.
    """
    sql = text("""
        SELECT 
            p.id,
            p.code,
            p.name,
            p.description,
            NULLIF(CONCAT_WS(', ', NULLIF(p.address_line_1, ''), NULLIF(p.address_line_2, ''), NULLIF(p.city, ''), NULLIF(p.state, ''), NULLIF(p.postal_code, '')), '') as location,
            p.address_line_1,
            p.address_line_2,
            p.city,
            p.state,
            p.postal_code,
            p.country_code,
            p.status,
            COALESCE(p.image_url, '/blueprint.png') as "imageUrl",
            COALESCE(p.blueprint_url, '/blueprint.png') as "blueprintUrl",
            COALESCE(p.total_area, '24.5 Acres') as "totalArea",
            p.total_area_sqft,
            COALESCE(p.default_price_per_sqft, 2500.00) as "defaultPricePerSqft",
            COALESCE(p.default_token_amount, 10000.00) as "defaultTokenAmount",
            COALESCE(stats.total_plots, 0) as "totalPlots",
            COALESCE(stats.available_plots, 0) as "availablePlots",
            COALESCE(stats.token_booked_plots, 0) as "tokenBookedPlots",
            COALESCE(stats.confirmed_plots, 0) as "confirmedPlots",
            COALESCE(stats.sold_plots, 0) as "soldPlots",
            COALESCE(stats.total_valuation, 0.0) as "totalValue",
            p.created_at
        FROM app.projects p
        LEFT JOIN (
            SELECT 
                project_id,
                count(*) as total_plots,
                count(*) filter (where status = 'available') as available_plots,
                count(*) filter (where status = 'token_booked') as token_booked_plots,
                count(*) filter (where status = 'confirmed') as confirmed_plots,
                count(*) filter (where status = 'sold') as sold_plots,
                sum(total_price) as total_valuation
            FROM app.plots
            GROUP BY project_id
        ) stats ON p.id = stats.project_id
        ORDER BY p.created_at ASC;
    """)
    result = await db.execute(sql)
    rows = result.mappings().all()

    items = []
    for r in rows:
        items.append(
            ProjectResponse(
                id=r["id"],
                code=r["code"],
                name=r["name"],
                description=r["description"],
                location=r["location"] or "Chennai, Tamil Nadu",
                address_line_1=r["address_line_1"],
                address_line_2=r["address_line_2"],
                city=r["city"],
                state=r["state"],
                postal_code=r["postal_code"],
                country_code=r["country_code"] or "IN",
                status=r["status"],
                imageUrl=r["imageUrl"],
                blueprintUrl=r["blueprintUrl"],
                totalArea=r["totalArea"],
                total_area_sqft=float(r["total_area_sqft"]) if r["total_area_sqft"] else None,
                defaultPricePerSqft=float(r["defaultPricePerSqft"]),
                defaultTokenAmount=float(r["defaultTokenAmount"]),
                totalPlots=r["totalPlots"],
                availablePlots=r["availablePlots"],
                tokenBookedPlots=r["tokenBookedPlots"],
                confirmedPlots=r["confirmedPlots"],
                soldPlots=r["soldPlots"],
                totalValue=float(r["totalValue"] or 0.0),
                created_at=r["created_at"],
            )
        )
    return items


@router.patch("/{project_id}")
@router.put("/{project_id}")
async def update_project(
    project_id: uuid.UUID,
    req: ProjectUpdateRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update project details in PostgreSQL and cascade updated location to all 184 plots in app.plots.
    """
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if req.name is not None and req.name.strip():
        project.name = req.name.strip()
    if req.code is not None and req.code.strip():
        project.code = req.code.strip()
    if req.description is not None:
        project.description = req.description
    if req.address_line_1 is not None:
        project.address_line_1 = req.address_line_1.strip()
    if req.address_line_2 is not None:
        project.address_line_2 = req.address_line_2.strip()
    if req.city is not None:
        project.city = req.city.strip()
    if req.state is not None:
        project.state = req.state.strip()
    if req.postal_code is not None:
        project.postal_code = req.postal_code.strip()
    if req.country_code is not None:
        project.country_code = req.country_code.strip()
    if req.default_price_per_sqft is not None:
        project.default_price_per_sqft = req.default_price_per_sqft
    if req.default_token_amount is not None:
        project.default_token_amount = req.default_token_amount
    if req.status is not None:
        project.status = req.status
    if req.image_url is not None:
        project.image_url = req.image_url
    if req.blueprint_url is not None:
        project.blueprint_url = req.blueprint_url

    if req.total_area is not None and req.total_area.strip():
        project.total_area = req.total_area.strip()
        # Auto-compute total_area_sqft if formatted in acres
        match = re.search(r"([0-9]+(?:\.[0-9]+)?)", req.total_area)
        if match:
            acres = float(match.group(1))
            project.total_area_sqft = acres * 43560.0

    # Build formatted full location string
    loc_parts = [
        p for p in [
            project.address_line_1,
            project.address_line_2,
            project.city,
            project.state,
            project.postal_code
        ] if p and p.strip()
    ]
    full_location = ", ".join(loc_parts) if loc_parts else (project.city or "Hyderabad")

    # Cascade full location to all plots under this project in app.plots
    await db.execute(
        text("""
            UPDATE app.plots 
            SET location = :loc,
                updated_at = CURRENT_TIMESTAMP 
            WHERE project_id = :pid;
        """),
        {"loc": full_location, "pid": str(project_id)}
    )

    await db.commit()
    await db.refresh(project)

    return {
        "success": True,
        "message": "Project details updated and cascaded to all plots in PostgreSQL.",
        "project": {
            "id": str(project.id),
            "name": project.name,
            "code": project.code,
            "location": full_location,
            "address_line_1": project.address_line_1,
            "address_line_2": project.address_line_2,
            "city": project.city,
            "state": project.state,
            "postal_code": project.postal_code,
            "totalArea": getattr(project, 'total_area', '24.5 Acres'),
            "total_area_sqft": float(project.total_area_sqft) if project.total_area_sqft else None
        }
    }


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    req: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create a new project master in PostgreSQL.
    """
    new_project = Project(
        code=req.code,
        name=req.name,
        description=req.description,
        address_line_1=req.address_line_1,
        address_line_2=req.address_line_2,
        city=req.city,
        state=req.state,
        postal_code=req.postal_code,
        country_code=req.country_code or "IN",
        total_area=req.total_area or "24.5 Acres",
        total_area_sqft=req.total_area_sqft,
        total_plots=req.total_plots or 0,
        default_price_per_sqft=req.default_price_per_sqft,
        default_token_amount=req.default_token_amount,
        image_url=req.image_url,
        blueprint_url=req.blueprint_url,
        status="active",
    )

    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    loc_parts = [p for p in [new_project.address_line_1, new_project.city, new_project.state] if p]
    loc_str = ", ".join(loc_parts) if loc_parts else "Hyderabad"

    return ProjectResponse(
        id=new_project.id,
        code=new_project.code,
        name=new_project.name,
        description=new_project.description,
        location=loc_str,
        address_line_1=new_project.address_line_1,
        address_line_2=new_project.address_line_2,
        city=new_project.city,
        state=new_project.state,
        postal_code=new_project.postal_code,
        country_code=new_project.country_code,
        status=new_project.status,
        imageUrl=new_project.image_url,
        blueprintUrl=new_project.blueprint_url,
        totalArea=new_project.total_area or "24.5 Acres",
        total_area_sqft=float(new_project.total_area_sqft) if new_project.total_area_sqft else None,
        defaultPricePerSqft=float(new_project.default_price_per_sqft or 2500),
        defaultTokenAmount=float(new_project.default_token_amount or 10000),
        totalPlots=new_project.total_plots,
        availablePlots=new_project.total_plots,
        tokenBookedPlots=0,
        confirmedPlots=0,
        soldPlots=0,
        totalValue=float((new_project.total_plots or 0) * (new_project.default_price_per_sqft or 2500) * 1800),
        created_at=new_project.created_at,
    )
