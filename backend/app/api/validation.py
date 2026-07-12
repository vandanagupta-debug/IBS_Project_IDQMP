from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api._common import get_processed_dataset_or_404
from app.schemas.validation import ValidationSummaryOut
from app.services.validation.validation_service import build_validation_summary
from app.services.datasets.dataframe_loader import DatasetNotReadyError

router = APIRouter(prefix="/datasets", tags=["validation"])


@router.get("/{dataset_id}/validation", response_model=ValidationSummaryOut)
def get_validation_summary(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return build_validation_summary(dataset)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
