from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func

from app.database.base import Base


class DQReport(Base):
    """
    A generated Data Quality report snapshot for a dataset. The full computed
    payload (profile + quality + anomalies + insights + recommendations) is
    stored as JSON text at generation time so report history can be listed
    and re-viewed without recomputing against the dataset every time.
    """

    __tablename__ = "dq_reports"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)

    name = Column(String, nullable=False)
    format = Column(String, nullable=False, default="PDF")  # "PDF" | "Excel" | "CSV"

    payload_json = Column(Text, nullable=False)
    file_path = Column(String, nullable=True)

    generated_at = Column(DateTime(timezone=True), server_default=func.now())
