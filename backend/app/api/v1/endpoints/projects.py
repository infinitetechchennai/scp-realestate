from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

@router.get("/")
def get_projects(db: Session = Depends(get_db)):
    """Fetch all projects with dynamically computed live stats from app.plots"""
    sql = text("""
        SELECT 
            p.id::text,
            p.code,
            p.name,
            p.description,
            p.address_line_1 as location,
            p.status,
            p.image_url as "imageUrl",
            p.blueprint_url as "blueprintUrl",
            '24.5 Acres' as "totalArea",
            COALESCE(stats.total_plots, 0) as "totalPlots",
            COALESCE(stats.available_plots, 0) as "availablePlots",
            COALESCE(stats.token_booked_plots, 0) as "tokenBookedPlots",
            COALESCE(stats.confirmed_plots, 0) as "confirmedPlots",
            COALESCE(stats.sold_plots, 0) as "soldPlots",
            COALESCE(stats.total_valuation, 0) as "totalValue"
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
    rows = db.execute(sql).mappings().all()
    return [dict(r) for r in rows]
