from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.dataset import Dataset
from app.schemas.profiling import ProfilingSummaryOut
from app.services.profiling import profiling_service
from app.services.profiling.profiling_service import ProfilingError

router = APIRouter(prefix="/datasets", tags=["profiling"])


@router.get("/{dataset_id}/profile", response_model=ProfilingSummaryOut)
def get_dataset_profile(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if dataset.status != "processed":
        raise HTTPException(
            status_code=400,
            detail=f"Dataset is not ready for profiling (status: {dataset.status}).",
        )

    try:
        return profiling_service.build_profile(dataset)
    except ProfilingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
