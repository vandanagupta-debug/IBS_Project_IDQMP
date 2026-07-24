from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class DQReportGenerateIn(BaseModel):
    dataset_id: int
    name: str
    format: str = "PDF"  # "PDF" | "Excel" | "CSV"


class DQReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    name: str
    format: str
    generated_at: datetime


class DQReportDetailOut(DQReportOut):
    payload: Any | None = None


class DQReportDeleteOut(BaseModel):
    id: int
    deleted: bool
