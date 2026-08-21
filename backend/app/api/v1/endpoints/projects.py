import uuid
from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreateRequest, ProjectResponse

router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
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
            COALESCE(p.address_line_1, 'Main Highway Layout, Hyderabad') as location,
            p.address_line_1,
            p.city,
            p.state,
            p.status,
            COALESCE(p.image_url, '/blueprint.png') as "imageUrl",
            COALESCE(p.blueprint_url, '/blueprint.png') as "blueprintUrl",
            '24.5 Acres' as "totalArea",
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
                location=r["location"],
                address_line_1=r["address_line_1"],
                city=r["city"],
                state=r["state"],
                status=r["status"],
                imageUrl=r["imageUrl"],
                blueprintUrl=r["blueprintUrl"],
                totalArea=r["totalArea"],
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
        city=req.city,
        state=req.state,
        postal_code=req.postal_code,
        country_code=req.country_code or "IN",
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

    return ProjectResponse(
        id=new_project.id,
        code=new_project.code,
        name=new_project.name,
        description=new_project.description,
        location=new_project.address_line_1 or f"{new_project.city}, {new_project.state}",
        address_line_1=new_project.address_line_1,
        city=new_project.city,
        state=new_project.state,
        status=new_project.status,
        imageUrl=new_project.image_url,
        blueprintUrl=new_project.blueprint_url,
        totalArea="24.5 Acres",
        totalPlots=new_project.total_plots,
        availablePlots=new_project.total_plots,
        tokenBookedPlots=0,
        confirmedPlots=0,
        soldPlots=0,
        totalValue=float((new_project.total_plots or 0) * (new_project.default_price_per_sqft or 2500) * 1800),
        created_at=new_project.created_at,
    )
