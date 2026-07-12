from sqlalchemy import Column, Integer, String
from app.database.base import Base

class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    method = Column(String)
    url = Column(String)