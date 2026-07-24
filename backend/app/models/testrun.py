from sqlalchemy import JSON, Column, Integer, String

from app.database.base import Base


class TestRun(Base):
    __tablename__ = "testruns"

    id = Column(Integer, primary_key=True)
    status = Column(String)
    result = Column(JSON)
