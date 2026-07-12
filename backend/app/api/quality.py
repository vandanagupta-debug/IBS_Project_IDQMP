from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api._common import get_processed_dataset_or_404
from app.schemas.quality import QualityScoreOut
from app.services.quality.quality_service import build_quality_score
from app.services.datasets.dataframe_loader import DatasetNotReadyError

router = APIRouter(prefix="/datasets", tags=["quality"])


@router.get("/{dataset_id}/quality", response_model=QualityScoreOut)
def get_quality_score(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return build_quality_score(dataset)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
