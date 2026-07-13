from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api._common import get_processed_dataset_or_404
from app.database.deps import get_db
from app.schemas.cleaning import CleaningResultOut
from app.services.cleaning.cleaning_service import run_cleaning_pipeline
from app.services.datasets.dataframe_loader import DatasetNotReadyError

router = APIRouter(prefix="/datasets", tags=["cleaning"])


@router.post("/{dataset_id}/clean", response_model=CleaningResultOut)
def clean_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return run_cleaning_pipeline(dataset, db)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
