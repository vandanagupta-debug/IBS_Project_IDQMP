from sqlalchemy import BigInteger, Column, DateTime, Integer, String, func

from app.database.base import Base


class Dataset(Base):
    """
    Represents a single uploaded CSV/XLSX dataset and its basic metadata.
    Row/column counts here are computed once at upload time for quick display;
    the full profiling engine (Phase 2) recomputes richer statistics on demand.
    """

    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)

    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "csv" | "xlsx" | "xls"
    file_size_bytes = Column(BigInteger, nullable=False, default=0)

    rows = Column(Integer, nullable=True)
    columns = Column(Integer, nullable=True)

    # "processing" | "processed" | "failed"
    status = Column(String, nullable=False, default="processing")
    error_message = Column(String, nullable=True)

    # Nullable until real auth (Phase 9) assigns an owning user.
    owner_id = Column(Integer, nullable=True)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
