from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api._common import get_processed_dataset_or_404
from app.database.deps import get_db
from app.schemas.anomaly import AnomalySummaryOut
from app.services.anomaly.anomaly_service import build_anomaly_summary
from app.services.datasets.dataframe_loader import DatasetNotReadyError

router = APIRouter(prefix="/datasets", tags=["anomaly"])


@router.get("/{dataset_id}/anomalies", response_model=AnomalySummaryOut)
def get_anomalies(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return build_anomaly_summary(dataset)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
