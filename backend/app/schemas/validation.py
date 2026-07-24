from pydantic import BaseModel


class ValidationDetailOut(BaseModel):
    id: str
    rule: str
    column: str
    status: str  # "Passed" | "Failed"
    affectedRows: int


class BreakdownItemOut(BaseModel):
    name: str
    value: int


class ValidationSummaryOut(BaseModel):
    dataset_id: int
    totalChecks: int
    passed: int
    failed: int
    breakdown: list[BreakdownItemOut]
    details: list[ValidationDetailOut]
