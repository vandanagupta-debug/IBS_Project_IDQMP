from pydantic import BaseModel


class CleaningOperationOut(BaseModel):
    name: str
    count: int


class CleaningSnapshotOut(BaseModel):
    rows: int
    qualityScore: float


class CleaningResultOut(BaseModel):
    datasetId: int
    cleanedDatasetId: int | None = None
    operations: list[CleaningOperationOut]
    before: CleaningSnapshotOut
    after: CleaningSnapshotOut
