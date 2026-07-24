import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.dataset import Dataset
from app.models.dq_report import DQReport
from app.schemas.dq_report import (
    DQReportDeleteOut,
    DQReportDetailOut,
    DQReportGenerateIn,
    DQReportOut,
)
from app.services.datasets.dataframe_loader import DatasetNotReadyError
from app.services.dq_report.dq_report_service import generate_report

router = APIRouter(prefix="/dq-reports", tags=["reports"])


@router.get("", response_model=list[DQReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.query(DQReport).order_by(DQReport.generated_at.desc()).all()


@router.post("", response_model=DQReportOut)
def create_report(payload: DQReportGenerateIn, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == payload.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    if dataset.status != "processed":
        raise HTTPException(
            status_code=400, detail=f"Dataset is not ready (status: {dataset.status})."
        )

    try:
        return generate_report(db, dataset, payload.name, payload.format)
    except DatasetNotReadyError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{report_id}", response_model=DQReportDetailOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(DQReport).filter(DQReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    detail = DQReportDetailOut.model_validate(report)
    detail.payload = json.loads(report.payload_json)
    return detail


@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(DQReport).filter(DQReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    if not report.file_path:
        raise HTTPException(
            status_code=404,
            detail="No downloadable file was generated for this report format.",
        )
    return FileResponse(
        path=report.file_path,
        filename=f"{report.name}.pdf",
        media_type="application/pdf",
    )


@router.delete("/{report_id}", response_model=DQReportDeleteOut)
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(DQReport).filter(DQReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    db.delete(report)
    db.commit()
    return DQReportDeleteOut(id=report_id, deleted=True)
