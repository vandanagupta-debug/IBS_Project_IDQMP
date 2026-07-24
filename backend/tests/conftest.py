import io
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.base import Base
from app.database.deps import get_db
from app.main import app

# Import every model module so Base.metadata is aware of all tables before
# create_all(). Importing the module (not a specific class name) avoids any
# risk of an ImportError if a class inside doesn't match an assumed name.
from app.models import (
    collection,  # noqa: F401
    dataset,  # noqa: F401
    dq_report,  # noqa: F401
    endpoint,  # noqa: F401
    report,  # noqa: F401
    testcase,  # noqa: F401
    testrun,  # noqa: F401
    user,  # noqa: F401
)

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(scope="function", autouse=True)
def _fresh_database():
    """Gives every test a clean set of tables so datasets/reports don't leak across tests."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def sample_csv_bytes() -> bytes:
    """
    A small but deliberately messy CSV: a missing value, a duplicate row, a
    numeric outlier, an imbalanced category, an email column with one
    invalid value, and a date column — enough to exercise every quality,
    validation, anomaly, insight, and visualization code path.
    """
    csv_text = (
        "id,age,amount,category,email,signup_date\n"
        "1,25,100.0,gold,alice@example.com,2024-01-05\n"
        "2,30,120.0,gold,bob@example.com,2024-01-06\n"
        "3,28,110.0,gold,carol@example.com,2024-01-07\n"
        "4,35,95.0,gold,dave@example.com,2024-01-08\n"
        "5,,105.0,gold,eve@example.com,2024-01-09\n"
        "6,29,9999.0,silver,frank-not-an-email,2024-01-10\n"
        "7,31,102.0,gold,grace@example.com,2024-01-11\n"
        "8,31,102.0,gold,grace@example.com,2024-01-11\n"
    )
    return csv_text.encode("utf-8")


@pytest.fixture()
def uploaded_dataset(client, sample_csv_bytes):
    """Uploads the sample CSV through the real upload endpoint and returns the created dataset JSON."""
    files = {"file": ("sample.csv", io.BytesIO(sample_csv_bytes), "text/csv")}
    response = client.post("/datasets/upload", files=files)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "processed"
    return data
