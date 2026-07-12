from app.database.session import engine
from app.database.base import Base

# import all models so SQLAlchemy registers them
from app.models.collection import Collection
from app.models.endpoint import Endpoint
from app.models.testcase import TestCase
from app.models.testrun import TestRun
from app.models.user import User
from app.models.dataset import Dataset
from app.models.dq_report import DQReport


def init_db():
    Base.metadata.create_all(bind=engine)