from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.dataset import Dataset


def get_processed_dataset_or_404(dataset_id: int, db: Session) -> Dataset:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    if dataset.status != "processed":
        raise HTTPException(
            status_code=400,
            detail=f"Dataset is not ready for analysis (status: {dataset.status}).",
        )
    return dataset
