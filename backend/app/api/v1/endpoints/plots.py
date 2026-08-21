import io
import csv
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db

router = APIRouter()

def release_expired_plots(db: Session):
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
    db.execute(expire_tokens_sql)
    db.execute(expire_partials_sql)
    db.commit()

@router.get("/")
def get_all_plots(db: Session = Depends(get_db)):
    """Fetch all plots dynamically from PostgreSQL app.plots table after running auto-expiry check"""
    release_expired_plots(db)
    
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
    rows = db.execute(sql).mappings().all()
    return [dict(r) for r in rows]

class BookingRequest(BaseModel):
    plotNumber: str
    paymentType: str  # 'token' | 'partial' | 'full'
    amount: float
    customerName: Optional[str] = "Customer"
    customerEmail: Optional[str] = "customer@example.com"
    customerPhone: Optional[str] = ""

@router.post("/book")
def book_plot(req: BookingRequest, db: Session = Depends(get_db)):
    """
    Process plot booking:
    1. Token Advance: Valid for 7 days -> Yellow (token_booked)
    2. Partial Payment: Pay >= 50%, 90 days due date -> Orange (partial_booked)
    3. Full Payment: 100% price -> Red (sold)
    """
    p_num = req.plotNumber.upper() if req.plotNumber.upper().startswith("P-") else f"P-{req.plotNumber}"
    
    plot_row = db.execute(
        text("SELECT * FROM app.plots WHERE plot_number = :plotNumber LIMIT 1;"),
        {"plotNumber": p_num}
    ).mappings().first()
    
    if not plot_row:
        raise HTTPException(status_code=404, detail=f"Plot {p_num} not found")
        
    total_price = float(plot_row["total_price"] or (plot_row["area_sqft"] * 2500))
    now = datetime.utcnow()
    
    if req.paymentType == "token":
        # 7-day expiry
        token_expiry = now + timedelta(days=7)
        update_sql = text("""
            UPDATE app.plots
            SET status = 'token_booked',
                token_amount = :token_amount,
                token_date = :token_date,
                token_expiry = :token_expiry,
                amount_paid = :token_amount,
                balance_amount = :balance_amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE plot_number = :plotNumber;
        """)
        db.execute(update_sql, {
            "token_amount": req.amount,
            "token_date": now,
            "token_expiry": token_expiry,
            "balance_amount": total_price - req.amount,
            "plotNumber": p_num
        })
        status = "token_booked"
        expiry_info = token_expiry.strftime("%Y-%m-%d")
        
    elif req.paymentType == "partial":
        # Must be >= 50%
        if req.amount < (total_price * 0.5):
            raise HTTPException(
                status_code=400,
                detail=f"Partial payment requires at least 50% of plot value (₹{(total_price * 0.5):,.2f})."
            )
        # 90-day deadline
        balance_due_date = now + timedelta(days=90)
        update_sql = text("""
            UPDATE app.plots
            SET status = 'partial_booked',
                amount_paid = :amount_paid,
                balance_amount = :balance_amount,
                balance_due_date = :balance_due_date,
                updated_at = CURRENT_TIMESTAMP
            WHERE plot_number = :plotNumber;
        """)
        db.execute(update_sql, {
            "amount_paid": req.amount,
            "balance_amount": max(0.0, total_price - req.amount),
            "balance_due_date": balance_due_date,
            "plotNumber": p_num
        })
        status = "partial_booked"
        expiry_info = balance_due_date.strftime("%Y-%m-%d")
        
    elif req.paymentType == "full" or req.amount >= total_price:
        update_sql = text("""
            UPDATE app.plots
            SET status = 'sold',
                amount_paid = :total_price,
                balance_amount = 0,
                token_expiry = NULL,
                balance_due_date = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE plot_number = :plotNumber;
        """)
        db.execute(update_sql, {
            "total_price": total_price,
            "plotNumber": p_num
        })
        status = "sold"
        expiry_info = "Sold Out"
    else:
        raise HTTPException(status_code=400, detail="Invalid payment type")
        
    db.commit()
    
    return {
        "success": True,
        "plotNumber": p_num,
        "status": status,
        "amountPaid": req.amount,
        "balanceDue": max(0.0, total_price - req.amount),
        "expiryDate": expiry_info
    }

@router.post("/upload-csv")
async def upload_plot_csv(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Parse uploaded CSV and bulk upsert into app.plots in PostgreSQL scp db"""
    content = ""
    if file:
        file_bytes = await file.read()
        content = file_bytes.decode("utf-8", errors="replace")
    elif csv_text:
        content = csv_text
    else:
        raise HTTPException(status_code=400, detail="No CSV file or text provided.")

    lines = [line.strip() for line in content.splitlines() if line.strip()]
    if len(lines) <= 1:
        raise HTTPException(status_code=400, detail="CSV file is empty or has only header.")

    reader = csv.reader(lines)
    header = [h.strip().lower().replace(" ", "").replace("_", "") for h in next(reader)]

    plot_idx = next((i for i, h in enumerate(header) if "plot" in h), 0)
    size_idx = next((i for i, h in enumerate(header) if "size" in h or "area" in h or "sqft" in h), 1)
    price_idx = next((i for i, h in enumerate(header) if "price" in h or "rate" in h), 2)
    status_idx = next((i for i, h in enumerate(header) if "status" in h), 3)

    proj_sql = text("SELECT id::text FROM app.projects ORDER BY created_at ASC LIMIT 1;")
    proj_res = db.execute(proj_sql).scalar()
    project_id = proj_res if proj_res else "c0000001-0000-0000-0000-000000000001"

    upsert_sql = text("""
        INSERT INTO app.plots (
            project_id,
            plot_number,
            location,
            area_sqft,
            price_per_sqft,
            total_price,
            status,
            updated_at
        ) VALUES (
            :project_id,
            :plot_number,
            :location,
            :area_sqft,
            :price_per_sqft,
            :total_price,
            :status,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (project_id, plot_number) DO UPDATE SET
            area_sqft = EXCLUDED.area_sqft,
            price_per_sqft = EXCLUDED.price_per_sqft,
            total_price = EXCLUDED.total_price,
            status = EXCLUDED.status,
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
            area = float(row[size_idx].strip()) if len(row) > size_idx and row[size_idx].strip() else 1500.0
        except ValueError:
            area = 1500.0

        try:
            rate = float(row[price_idx].strip()) if len(row) > price_idx and row[price_idx].strip() else 2500.0
        except ValueError:
            rate = 2500.0

        raw_status = row[status_idx].strip().lower() if len(row) > status_idx else "available"
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

        db.execute(upsert_sql, {
            "project_id": project_id,
            "plot_number": plot_number,
            "location": "Main Highway Layout, Hyderabad",
            "area_sqft": area,
            "price_per_sqft": rate,
            "total_price": area * rate,
            "status": status,
        })
        updated_count += 1

    db.execute(text("""
        UPDATE app.projects
        SET total_plots = (SELECT count(*) FROM app.plots WHERE project_id = :project_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :project_id;
    """), {"project_id": project_id})

    db.commit()

    return {
        "success": True,
        "message": f"Successfully updated {updated_count} plots dynamically in PostgreSQL database.",
        "updatedCount": updated_count
    }

@router.patch("/{plot_number}/status")
def update_single_plot_status(
    plot_number: str,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """Update single plot status in DB"""
    p_num = plot_number.upper() if plot_number.upper().startswith("P-") else f"P-{plot_number}"
    sql = text("""
        UPDATE app.plots
        SET status = :status, updated_at = CURRENT_TIMESTAMP
        WHERE plot_number = :plot_number;
    """)
    result = db.execute(sql, {"status": status.lower(), "plot_number": p_num})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Plot not found")
    return {"success": True, "plotNumber": p_num, "status": status}
