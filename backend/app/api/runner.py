from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.testrun import TestRun
from app.services.pytest.executor import save_tests, run_tests
from app.api.generator import generated_tests

router = APIRouter()


@router.post("/run-tests")
def run(db: Session = Depends(get_db)):

    save_tests(generated_tests)
    result = run_tests()

    record = TestRun(status="completed", result=result)

    db.add(record)
    db.commit()
    db.refresh(record)

    return record
