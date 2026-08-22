import io
import csv
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

async def release_expired_plots(db: AsyncSession):
    """Auto-release expired 7-day token holds and 90-day overdue partial bookings back to Available (Green)"""
    expire_tokens_sql = text("""
        UPDATE app.plots
        SET status = 'available',
            token_amount = 0,
            token_date = NULL,
            token_expiry = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'token_booked' AND token_expiry < CURRENT_TIMESTAMP;
    """)
    expire_partials_sql = text("""
        UPDATE app.plots
        SET status = 'available',
            amount_paid = 0,
            balance_amount = 0,
            balance_due_date = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'partial_booked' AND balance_due_date < CURRENT_TIMESTAMP;
    """)
    await db.execute(expire_tokens_sql)
    await db.execute(expire_partials_sql)
    await db.commit()

@router.get("")
@router.get("/")
async def get_all_plots(db: AsyncSession = Depends(get_db)):
    """Fetch all plots dynamically from PostgreSQL app.plots table after running auto-expiry check"""
    await release_expired_plots(db)
    
    sql = text("""
        SELECT 
            id::text,
            project_id::text,
            plot_number as "plotNumber",
            location,
            area_sqft as area,
            dimensions,
            facing,
            road_width_ft as "roadWidth",
            price_per_sqft as "pricePerSqft",
            total_price as "totalPrice",
            token_required as "tokenRequired",
            token_amount as "tokenAmount",
            token_date as "tokenDate",
            token_expiry as "tokenExpiry",
            amount_paid as "amountPaid",
            balance_amount as "balanceAmount",
            balance_due_date as "balanceDueDate",
            row_index as row,
            col_index as col,
            status,
            created_at,
            updated_at
        FROM app.plots
        ORDER BY 
            CAST(SUBSTRING(plot_number FROM '[0-9]+') AS INTEGER) ASC,
            plot_number ASC;
    """)
    result = await db.execute(sql)
    rows = result.mappings().all()
    return [dict(r) for r in rows]

@router.get("/export-csv")
async def export_plots_csv(
    project_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Export all columns from app.plots table in PostgreSQL"""
    sql = text("""
        SELECT 
            id::text,
            project_id::text,
            plot_number,
            location,
            area_sqft,
            dimensions,
            facing,
            road_width_ft,
            price_per_sqft,
            total_price,
            token_required,
            token_amount,
            token_date,
            token_expiry,
            amount_paid,
            balance_amount,
            balance_due_date,
            row_index,
            col_index,
            status,
            created_at,
            updated_at
        FROM app.plots
        ORDER BY 
            CAST(SUBSTRING(plot_number FROM '[0-9]+') AS INTEGER) ASC,
            plot_number ASC;
    """)
    result = await db.execute(sql)
    rows = result.mappings().all()

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow([
        "ID",
        "Project ID",
        "Plot Number",
        "Location",
        "Area SqFt",
        "Dimensions",
        "Facing",
        "Road Width",
        "Price Per SqFt",
        "Total Price",
        "Token Required",
        "Token Amount",
        "Token Date",
        "Token Expiry",
        "Amount Paid",
        "Balance Amount",
        "Balance Due Date",
        "Row Index",
        "Col Index",
        "Status",
        "Created At",
        "Updated At"
    ])

    for r in rows:
        writer.writerow([
            r["id"],
            r["project_id"],
            r["plot_number"],
            r["location"] or "Main Highway Layout, Hyderabad",
            int(r["area_sqft"]) if r["area_sqft"] and float(r["area_sqft"]).is_integer() else r["area_sqft"],
            r["dimensions"] or "",
            r["facing"] or "North",
            r["road_width_ft"] or "20 ft",
            int(r["price_per_sqft"]) if r["price_per_sqft"] and float(r["price_per_sqft"]).is_integer() else r["price_per_sqft"],
            int(r["total_price"]) if r["total_price"] and float(r["total_price"]).is_integer() else r["total_price"],
            int(r["token_required"]) if r["token_required"] and float(r["token_required"]).is_integer() else (r["token_required"] or 10000),
            int(r["token_amount"]) if r["token_amount"] and float(r["token_amount"]).is_integer() else (r["token_amount"] or 0),
            r["token_date"].isoformat() if r["token_date"] else "",
            r["token_expiry"].isoformat() if r["token_expiry"] else "",
            int(r["amount_paid"]) if r["amount_paid"] and float(r["amount_paid"]).is_integer() else (r["amount_paid"] or 0),
            int(r["balance_amount"]) if r["balance_amount"] and float(r["balance_amount"]).is_integer() else (r["balance_amount"] or 0),
            r["balance_due_date"].isoformat() if r["balance_due_date"] else "",
            r["row_index"] if r["row_index"] is not None else "",
            r["col_index"] if r["col_index"] is not None else "",
            r["status"].replace("_", " ").title() if r["status"] else "Available",
            r["created_at"].isoformat() if r["created_at"] else "",
            r["updated_at"].isoformat() if r["updated_at"] else ""
        ])

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=project_plots_all_columns.csv",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

class BookingRequest(BaseModel):
    plotNumber: str
    paymentType: str  # 'token' | 'partial' | 'full'
    amount: float
    customerName: Optional[str] = "Customer"
    customerEmail: Optional[str] = "customer@example.com"
    customerPhone: Optional[str] = ""

@router.post("/book")
async def book_plot(req: BookingRequest, db: AsyncSession = Depends(get_db)):
    """Process plot booking (Token Hold / 50%+ Partial Payment / Full Payment) with DB persistence"""
    clean_pnum = req.plotNumber.upper() if req.plotNumber.upper().startswith("P-") else f"P-{req.plotNumber}"
    res = await db.execute(
        text("SELECT * FROM app.plots WHERE plot_number = :pnum"),
        {"pnum": clean_pnum}
    )
    plot_row = res.mappings().first()

    if not plot_row:
        raise HTTPException(status_code=404, detail=f"Plot {clean_pnum} not found.")

    now = datetime.now(timezone.utc)
    total_price = float(plot_row["total_price"]) if plot_row["total_price"] else 0.0

    if req.paymentType == "token":
        status = "token_booked"
        expiry_info = (now + timedelta(days=7)).isoformat()
        await db.execute(text("""
            UPDATE app.plots
            SET status = :status,
                token_amount = :amt,
                token_date = :now,
                token_expiry = :expiry,
                updated_at = :now
            WHERE plot_number = :pnum
        """), {
            "status": status,
            "amt": req.amount,
            "now": now,
            "expiry": now + timedelta(days=7),
            "pnum": clean_pnum
        })
    elif req.paymentType == "partial":
        status = "partial_booked"
        expiry_info = (now + timedelta(days=90)).isoformat()
        balance = max(0.0, total_price - req.amount)
        await db.execute(text("""
            UPDATE app.plots
            SET status = :status,
                amount_paid = :amt,
                balance_amount = :bal,
                balance_due_date = :deadline,
                updated_at = :now
            WHERE plot_number = :pnum
        """), {
            "status": status,
            "amt": req.amount,
            "bal": balance,
            "deadline": now + timedelta(days=90),
            "now": now,
            "pnum": clean_pnum
        })
    elif req.paymentType == "full":
        status = "sold"
        expiry_info = None
        await db.execute(text("""
            UPDATE app.plots
            SET status = :status,
                amount_paid = :amt,
                balance_amount = 0.0,
                balance_due_date = NULL,
                updated_at = :now
            WHERE plot_number = :pnum
        """), {
            "status": status,
            "amt": req.amount,
            "now": now,
            "pnum": clean_pnum
        })
    else:
        raise HTTPException(status_code=400, detail="Invalid payment type.")

    await db.commit()

    return {
        "success": True,
        "plotNumber": clean_pnum,
        "status": status,
        "amountPaid": req.amount,
        "balanceDue": max(0.0, total_price - req.amount),
        "expiryDate": expiry_info
    }

@router.post("/upload-csv")
async def upload_plot_csv(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """Parse uploaded CSV/Excel format and bulk upsert into app.plots in PostgreSQL scp db (Option B clean sync)"""
    content = ""
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="replace")
    elif csv_text:
        content = csv_text
    else:
        raise HTTPException(status_code=400, detail="No CSV file or text provided.")

    f_obj = io.StringIO(content)
    reader = csv.reader(f_obj)
    raw_header = next(reader, None)
    if not raw_header:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    header = [h.strip().lower().replace(" ", "").replace("_", "") for h in raw_header]

    plot_idx = next((i for i, h in enumerate(header) if "plot" in h), 0)
    size_idx = next((i for i, h in enumerate(header) if "size" in h or "area" in h or "sqft" in h), 1)
    dim_idx = next((i for i, h in enumerate(header) if "dim" in h), -1)
    facing_idx = next((i for i, h in enumerate(header) if "facing" in h), -1)
    road_idx = next((i for i, h in enumerate(header) if "road" in h), -1)
    price_idx = next((i for i, h in enumerate(header) if "price" in h or "rate" in h), -1)
    total_idx = next((i for i, h in enumerate(header) if "total" in h), -1)
    token_idx = next((i for i, h in enumerate(header) if "token" in h or "min" in h), -1)
    status_idx = next((i for i, h in enumerate(header) if "status" in h), -1)
    loc_idx = next((i for i, h in enumerate(header) if "loc" in h or "addr" in h or "city" in h), -1)

    proj_res = await db.execute(text("""
        SELECT 
            id::text, 
            name,
            COALESCE(
                NULLIF(CONCAT_WS(', ', NULLIF(address_line_1, ''), NULLIF(city, ''), NULLIF(state, '')), ''), 
                'Hyderabad'
            ) as location 
        FROM app.projects 
        ORDER BY created_at ASC 
        LIMIT 1;
    """))
    proj_row = proj_res.mappings().first()
    project_id = proj_row["id"] if proj_row else "c0000001-0000-0000-0000-000000000001"
    proj_location = proj_row["location"] if proj_row else "Hyderabad"

    # Option B SQL Upsert: When status is 'available', clear any previous booking amounts to 0/NULL
    upsert_sql = text("""
        INSERT INTO app.plots (
            project_id,
            plot_number,
            location,
            area_sqft,
            dimensions,
            facing,
            road_width_ft,
            price_per_sqft,
            total_price,
            token_required,
            status,
            token_amount,
            token_date,
            token_expiry,
            amount_paid,
            balance_amount,
            balance_due_date,
            updated_at
        ) VALUES (
            :project_id,
            :plot_number,
            :location,
            :area_sqft,
            :dimensions,
            :facing,
            :road_width_ft,
            :price_per_sqft,
            :total_price,
            :token_required,
            :status,
            :token_amount,
            :token_date,
            :token_expiry,
            :amount_paid,
            :balance_amount,
            :balance_due_date,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (project_id, plot_number) DO UPDATE SET
            area_sqft = EXCLUDED.area_sqft,
            dimensions = COALESCE(EXCLUDED.dimensions, app.plots.dimensions),
            facing = COALESCE(EXCLUDED.facing, app.plots.facing),
            road_width_ft = COALESCE(EXCLUDED.road_width_ft, app.plots.road_width_ft),
            price_per_sqft = EXCLUDED.price_per_sqft,
            total_price = EXCLUDED.total_price,
            token_required = COALESCE(EXCLUDED.token_required, app.plots.token_required),
            status = EXCLUDED.status,
            token_amount = CASE WHEN EXCLUDED.status = 'available' THEN 0.0 ELSE COALESCE(EXCLUDED.token_amount, app.plots.token_amount) END,
            token_date = CASE WHEN EXCLUDED.status = 'available' THEN NULL ELSE app.plots.token_date END,
            token_expiry = CASE WHEN EXCLUDED.status = 'available' THEN NULL ELSE app.plots.token_expiry END,
            amount_paid = CASE WHEN EXCLUDED.status = 'available' THEN 0.0 ELSE COALESCE(EXCLUDED.amount_paid, app.plots.amount_paid) END,
            balance_amount = CASE WHEN EXCLUDED.status = 'available' THEN 0.0 ELSE COALESCE(EXCLUDED.balance_amount, app.plots.balance_amount) END,
            balance_due_date = CASE WHEN EXCLUDED.status = 'available' THEN NULL ELSE app.plots.balance_due_date END,
            updated_at = CURRENT_TIMESTAMP;
    """)

    updated_count = 0
    for row in reader:
        if len(row) < 2:
            continue

        raw_num = row[plot_idx].strip() if len(row) > plot_idx else ""
        if not raw_num:
            continue
        plot_number = raw_num.upper() if raw_num.upper().startswith("P-") else f"P-{raw_num}"

        try:
            area = float(row[size_idx].strip()) if size_idx != -1 and len(row) > size_idx and row[size_idx].strip() else 1500.0
        except ValueError:
            area = 1500.0

        try:
            rate = float(row[price_idx].strip()) if price_idx != -1 and len(row) > price_idx and row[price_idx].strip() else 2500.0
        except ValueError:
            rate = 2500.0

        try:
            total_price = float(row[total_idx].strip()) if total_idx != -1 and len(row) > total_idx and row[total_idx].strip() else (area * rate)
        except ValueError:
            total_price = area * rate

        try:
            token_req = float(row[token_idx].strip()) if token_idx != -1 and len(row) > token_idx and row[token_idx].strip() else 10000.0
        except ValueError:
            token_req = 10000.0

        dimensions = row[dim_idx].strip() if dim_idx != -1 and len(row) > dim_idx and row[dim_idx].strip() else None
        facing = row[facing_idx].strip() if facing_idx != -1 and len(row) > facing_idx and row[facing_idx].strip() else "North"
        road_width = row[road_idx].strip() if road_idx != -1 and len(row) > road_idx and row[road_idx].strip() else "20 ft"

        raw_status = row[status_idx].strip().lower() if status_idx != -1 and len(row) > status_idx else "available"
        if "sold" in raw_status:
            status = "sold"
        elif "token" in raw_status:
            status = "token_booked"
        elif "partial" in raw_status:
            status = "partial_booked"
        elif "book" in raw_status or "confirm" in raw_status:
            status = "confirmed"
        else:
            status = "available"

        plot_location = row[loc_idx].strip() if loc_idx != -1 and len(row) > loc_idx and row[loc_idx].strip() else proj_location

        await db.execute(upsert_sql, {
            "project_id": project_id,
            "plot_number": plot_number,
            "location": plot_location,
            "area_sqft": area,
            "dimensions": dimensions,
            "facing": facing,
            "road_width_ft": road_width,
            "price_per_sqft": rate,
            "total_price": total_price,
            "token_required": token_req,
            "status": status,
            "token_amount": 0.0 if status == 'available' else None,
            "token_date": None,
            "token_expiry": None,
            "amount_paid": 0.0 if status == 'available' else None,
            "balance_amount": 0.0 if status == 'available' else None,
            "balance_due_date": None,
        })
        updated_count += 1

    await db.execute(text("""
        UPDATE app.projects
        SET total_plots = (SELECT count(*) FROM app.plots WHERE project_id = :project_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :project_id;
    """), {"project_id": project_id})

    await db.commit()

    return {
        "success": True,
        "message": f"Successfully updated {updated_count} plots dynamically in PostgreSQL database.",
        "updatedCount": updated_count
    }

@router.patch("/{plot_number}/status")
async def update_single_plot_status(
    plot_number: str,
    status: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """Update single plot status in DB"""
    p_num = plot_number.upper() if plot_number.upper().startswith("P-") else f"P-{plot_number}"
    await db.execute(
        text("UPDATE app.plots SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE plot_number = :pnum"),
        {"status": status, "pnum": p_num}
    )
    await db.commit()
    return {"success": True, "plotNumber": p_num, "status": status}
