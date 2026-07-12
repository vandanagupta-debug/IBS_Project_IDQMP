from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api._common import get_processed_dataset_or_404
from app.schemas.visualization import VisualizationsOut
from app.services.visualization.visualization_service import build_visualizations
from app.services.datasets.dataframe_loader import DatasetNotReadyError

router = APIRouter(prefix="/datasets", tags=["visualizations"])


@router.get("/{dataset_id}/visualizations", response_model=VisualizationsOut)
def get_visualizations(dataset_id: int, db: Session = Depends(get_db)):
    dataset = get_processed_dataset_or_404(dataset_id, db)
    try:
        return build_visualizations(dataset)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
