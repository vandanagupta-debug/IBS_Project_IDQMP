from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.testrun import TestRun

router = APIRouter()

@router.get("/reports")
def reports(db: Session = Depends(get_db)):
    return db.query(TestRun).all()