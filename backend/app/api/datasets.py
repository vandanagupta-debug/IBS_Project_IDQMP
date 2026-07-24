import os
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetDeleteOut, DatasetListOut, DatasetOut, DatasetSummaryOut
from app.services.datasets import dataset_service

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/upload", response_model=DatasetOut)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        file_type = dataset_service.validate_extension(file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    stored_filename, absolute_path, size_bytes = await dataset_service.save_upload(
        file, file_type
    )

    dataset = Dataset(
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=absolute_path,
        file_type=file_type,
        file_size_bytes=size_bytes,
        status="processing",
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    try:
        rows, columns = dataset_service.extract_basic_metadata(absolute_path, file_type)
        dataset.rows = rows
        dataset.columns = columns
        dataset.status = "processed"
    except Exception as exc:  # noqa: BLE001 - surface any parse failure to the client
        dataset.status = "failed"
        dataset.error_message = str(exc)[:500]

    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("/summary", response_model=DatasetSummaryOut)
def get_dataset_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(Dataset.id)).scalar() or 0
    processed = db.query(func.count(Dataset.id)).filter(Dataset.status == "processed").scalar() or 0
    processing = db.query(func.count(Dataset.id)).filter(Dataset.status == "processing").scalar() or 0
    failed = db.query(func.count(Dataset.id)).filter(Dataset.status == "failed").scalar() or 0
    total_rows = db.query(func.coalesce(func.sum(Dataset.rows), 0)).scalar() or 0
    total_columns = db.query(func.coalesce(func.sum(Dataset.columns), 0)).scalar() or 0

    return DatasetSummaryOut(
        total=total,
        processed=processed,
        processing=processing,
        failed=failed,
        total_rows=total_rows,
        total_columns=total_columns,
    )


@router.get("", response_model=DatasetListOut)
def list_datasets(
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Dataset)
    if search:
        query = query.filter(Dataset.original_filename.ilike(f"%{search}%"))

    total = query.with_entities(func.count(Dataset.id)).scalar()
    items = (
        query.order_by(Dataset.uploaded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return DatasetListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return dataset


@router.delete("/{dataset_id}", response_model=DatasetDeleteOut)
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    dataset_service.delete_file(dataset.file_path)
    db.delete(dataset)
    db.commit()
    return DatasetDeleteOut(id=dataset_id, deleted=True)


@router.get("/{dataset_id}/download")
def download_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=410, detail="Stored file is missing from disk.")

    return FileResponse(
        path=dataset.file_path,
        filename=dataset.original_filename,
        media_type="application/octet-stream",
    )
