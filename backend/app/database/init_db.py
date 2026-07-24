from app.database.base import Base
from app.database.session import engine

# import all models so SQLAlchemy registers them
from app.models.collection import Collection  # noqa: F401
from app.models.dataset import Dataset  # noqa: F401
from app.models.dq_report import DQReport  # noqa: F401
from app.models.endpoint import Endpoint  # noqa: F401
from app.models.testcase import TestCase  # noqa: F401
from app.models.testrun import TestRun  # noqa: F401
from app.models.user import User  # noqa: F401


def init_db():
    Base.metadata.create_all(bind=engine)
