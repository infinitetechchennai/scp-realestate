import os
import uuid
import hashlib
from pathlib import Path
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.document import File as FileModel, EntityDocument

router = APIRouter()

# Directory where uploaded files are saved on disk
UPLOAD_DIR = Path("uploads/kyc")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(..., description="aadhaar, pan, rera_certificate"),
    entity_type: str = Form("channel_partner", description="channel_partner, customer, booking"),
    entity_id: Optional[uuid.UUID] = Form(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    1. Saves physical file to backend/uploads/kyc/
    2. Inserts metadata into app.files table
    3. Links file to partner in app.entity_documents table
    """
    # 1. Generate unique file name on disk
    file_uuid = uuid.uuid4()
    file_ext = Path(file.filename or "doc").suffix.lower()
    clean_filename = f"{file_uuid}{file_ext}"
    dest_path = UPLOAD_DIR / clean_filename

    # 2. Read file content and compute SHA-256 hash & file size
    contents = await file.read()
    file_size = len(contents)
    checksum = hashlib.sha256(contents).hexdigest()

    # 3. Write file to disk in backend/uploads/kyc/
    with open(dest_path, "wb") as f:
        f.write(contents)

    # 4. Create record in app.files
    db_file = FileModel(
        id=file_uuid,
        original_file_name=file.filename or clean_filename,
        storage_provider="local",
        storage_key=str(dest_path.as_posix()),
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size,
        checksum_sha256=checksum,
    )
    db.add(db_file)
    await db.flush()

    # 5. If entity_id is provided, link in app.entity_documents
    doc_id = None
    if entity_id:
        entity_doc = EntityDocument(
            file_id=db_file.id,
            entity_type=entity_type,
            entity_id=entity_id,
            document_type=document_type,
            status="pending",
        )
        db.add(entity_doc)
        await db.flush()
        doc_id = entity_doc.id

    await db.commit()

    return {
        "success": True,
        "file_id": db_file.id,
        "document_id": doc_id,
        "original_name": db_file.original_file_name,
        "file_size": file_size,
        "mime_type": db_file.mime_type,
        "storage_path": db_file.storage_key,
        "url": f"/api/v1/documents/{db_file.id}/download",
    }


@router.get("/{file_id}/download")
async def download_document(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Streams the physical file from backend/uploads/kyc/ directly into browser.
    """
    stmt = select(FileModel).where(FileModel.id == file_id)
    result = await db.execute(stmt)
    file_rec = result.scalar_one_or_none()

    if not file_rec or not os.path.exists(file_rec.storage_key):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found on disk"
        )

    return FileResponse(
        path=file_rec.storage_key,
        media_type=file_rec.mime_type,
        filename=file_rec.original_file_name
    )
