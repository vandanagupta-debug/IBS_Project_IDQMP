from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    file_type: str
    file_size_bytes: int
    rows: int | None = None
    columns: int | None = None
    status: str
    error_message: str | None = None
    uploaded_at: datetime


class DatasetListOut(BaseModel):
    items: list[DatasetOut]
    total: int
    page: int
    page_size: int


class DatasetSummaryOut(BaseModel):
    total: int
    processed: int
    processing: int
    failed: int
    total_rows: int
    total_columns: int


class DatasetDeleteOut(BaseModel):
    id: int
    deleted: bool
