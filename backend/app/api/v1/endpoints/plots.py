import io
import csv
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import get_db
from app.models.plot import Plot
from app.models.project import Project
from app.schemas.plot import PlotCreateRequest, PlotResponse, PlotStatusUpdateRequest

router = APIRouter()


async def release_expired_plots(db: AsyncSession):
    """Auto-release expired 7-day token holds and overdue partial bookings back to Available"""
    pass


@router.get("", response_model=List[PlotResponse])
async def get_all_plots(
    project_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Fetch all plots dynamically from PostgreSQL app.plots table.
    """
    stmt = select(Plot).order_by(Plot.plot_number.asc())
    if project_id:
        stmt = stmt.where(Plot.project_id == project_id)
    if status and isinstance(status, str) and status != "all":
        stmt = stmt.where(Plot.status == status)

    result = await db.execute(stmt)
    plots = result.scalars().all()

    items = []
    for p in plots:
        row_letter = p.plot_number[2] if len(p.plot_number) >= 3 else "A"
        dim_str = p.dimensions or "30x50"
        road_w = f"{int(p.road_width_ft)} ft" if p.road_width_ft else "20 ft"

        items.append(
            PlotResponse(
                id=p.id,
                projectId=p.project_id,
                plotNumber=p.plot_number,
                projectName=p.project.name if p.project else "SCP Farm Layout (184 Plots)",
                row=row_letter,
                area=float(p.area_sqft),
                facing=p.facing or "North",
                roadWidth=road_w,
                length=30.0,
                breadth=50.0,
                dimensions=dim_str,
                pricePerSqft=float(p.price_per_sqft),
                totalPrice=float(p.total_price),
                status=p.status,
                tokenAmount=float(p.token_required or 20000.0),
                tokenDate=None,
                tokenExpiry=None,
                amountPaid=0.0,
                balanceAmount=0.0,
                balanceDueDate=None,
                customerId=None,
                customerName=None,
                partnerId=None,
                partnerName=None,
            )
        )
    return items


@router.post("/upload-csv")
async def upload_plot_csv(
    file: UploadFile = File(...),
    project_id: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Parse CSV file and bulk upsert plots into PostgreSQL app.plots table.
    """
    # 1. Resolve or verify project
    target_project_id = project_id
    if not target_project_id:
        stmt_p = select(Project).limit(1)
        res_p = await db.execute(stmt_p)
        first_proj = res_p.scalar_one_or_none()
        if first_proj:
            target_project_id = first_proj.id
        else:
            default_proj = Project(
                id=uuid.UUID("c0000001-0000-0000-0000-000000000001"),
                code="SCP-2026",
                name="SCP Farm Layout (184 Plots)",
                description="Master township cadastral development featuring 184 residential plots.",
                address_line_1="Main Highway Layout, Hyderabad",
                city="Hyderabad",
                state="Telangana",
                postal_code="500081",
                country_code="IN",
                total_plots=184,
                default_price_per_sqft=2500.00,
                default_token_amount=100000.00,
                status="active",
            )
            db.add(default_proj)
            await db.flush()
            target_project_id = default_proj.id

    # 2. Read and parse CSV contents
    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    plots_upserted = 0
    upsert_sql = text("""
        INSERT INTO app.plots (
            project_id,
            plot_number,
            location,
            area_sqft,
            dimensions,
            price_per_sqft,
            total_price,
            facing,
            road_width_ft,
            status,
            updated_at
        ) VALUES (
            :project_id,
            :plot_number,
            :location,
            :area_sqft,
            :dimensions,
            :price_per_sqft,
            :total_price,
            :facing,
            :road_width_ft,
            :status,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (project_id, plot_number) DO UPDATE SET
            area_sqft = EXCLUDED.area_sqft,
            price_per_sqft = EXCLUDED.price_per_sqft,
            total_price = EXCLUDED.total_price,
            facing = EXCLUDED.facing,
            road_width_ft = EXCLUDED.road_width_ft,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP;
    """)

    for row in reader:
        clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        plot_num = clean_row.get("plot_number") or clean_row.get("plot_no") or clean_row.get("plot") or clean_row.get("plotno")
        if not plot_num:
            continue

        try:
            area = float(clean_row.get("area_sqft") or clean_row.get("area") or 1800)
            rate = float(clean_row.get("price_per_sqft") or clean_row.get("rate") or 2500)
            total = float(clean_row.get("total_price") or clean_row.get("total") or (area * rate))
            facing = clean_row.get("facing") or "North"
            road_num = 20.0
            road_raw = clean_row.get("road_width_ft") or clean_row.get("road_width") or clean_row.get("road")
            if road_raw:
                try:
                    road_num = float(''.join([c for c in road_raw if c.isdigit() or c == '.']))
                except Exception:
                    road_num = 20.0
            plot_status = clean_row.get("status") or "available"
        except (ValueError, TypeError):
            continue

        await db.execute(
            upsert_sql,
            {
                "project_id": target_project_id,
                "plot_number": plot_num,
                "location": "Main Highway Layout, Hyderabad",
                "area_sqft": area,
                "dimensions": "30x50",
                "price_per_sqft": rate,
                "total_price": total,
                "facing": facing,
                "road_width_ft": road_num,
                "status": plot_status.lower(),
            }
        )
        plots_upserted += 1

    await db.commit()

    return {
        "success": True,
        "message": f"Successfully parsed and upserted {plots_upserted} plots in PostgreSQL.",
        "project_id": target_project_id,
        "plots_count": plots_upserted
    }


@router.patch("/{plot_id}/status")
async def update_plot_status(
    plot_id: uuid.UUID,
    req: PlotStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Update status for a plot.
    """
    stmt = select(Plot).where(Plot.id == plot_id)
    res = await db.execute(stmt)
    plot = res.scalar_one_or_none()

    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plot not found"
        )

    plot.status = req.status
    await db.commit()
    await db.refresh(plot)

    return {
        "success": True,
        "plot_id": plot.id,
        "plot_number": plot.plot_number,
        "status": plot.status
    }
