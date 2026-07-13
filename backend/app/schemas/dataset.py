from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    file_type: str
    file_size_bytes: int
    rows: Optional[int] = None
    columns: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    uploaded_at: datetime


class DatasetListOut(BaseModel):
    items: List[DatasetOut]
    total: int
    page: int
    page_size: int


class DatasetDeleteOut(BaseModel):
    id: int
    deleted: bool
