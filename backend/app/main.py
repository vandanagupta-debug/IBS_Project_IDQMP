from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.anomaly import router as anomaly_router
from app.api.cleaning import router as cleaning_router
from app.api.datasets import router as datasets_router
from app.api.dq_reports import router as dq_reports_router
from app.api.generator import router as gen_router
from app.api.health import router as health_router
from app.api.insights import router as insights_router
from app.api.profiling import router as profiling_router
from app.api.quality import router as quality_router
from app.api.reports import router as rep_router
from app.api.runner import router as run_router
from app.api.upload import router as upload_router
from app.api.validation import router as validation_router
from app.api.visualizations import router as visualizations_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.database.base import Base
from app.database.session import engine
from app.models import dataset, dq_report, endpoint, testrun  # noqa: F401

configure_logging()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

Base.metadata.create_all(bind=engine)

app.include_router(health_router)
app.include_router(upload_router)
app.include_router(gen_router)
app.include_router(run_router)
app.include_router(rep_router)
app.include_router(datasets_router)
app.include_router(profiling_router)
app.include_router(quality_router)
app.include_router(anomaly_router)
app.include_router(insights_router)
app.include_router(validation_router)
app.include_router(visualizations_router)
app.include_router(cleaning_router)
app.include_router(dq_reports_router)


@app.get("/")
def root():
    return {"message": "AI Test Automation Running"}
