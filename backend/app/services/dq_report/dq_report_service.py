"""
Phase 3 — Reports.

Builds one consolidated JSON payload (profiling + quality + validation +
anomalies + insights + recommendations) for a dataset and persists a
DQReport row so report history can be listed/downloaded/deleted later.
"""

from __future__ import annotations

import json
import os
import uuid

from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.dq_report import DQReport
from app.services.anomaly.anomaly_service import build_anomaly_summary
from app.services.insights.insights_service import build_insights
from app.services.profiling import profiling_service
from app.services.quality.quality_service import build_quality_score
from app.services.recommendation.recommendation_service import build_recommendations
from app.services.validation.validation_service import build_validation_summary

REPORTS_ROOT = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "..", "app", "generated_reports"
)
REPORTS_ROOT = os.path.abspath(REPORTS_ROOT)


def build_full_report_payload(dataset: Dataset) -> dict:
    profile = profiling_service.build_profile(dataset)
    quality = build_quality_score(dataset)
    validation = build_validation_summary(dataset)
    anomalies = build_anomaly_summary(dataset)
    insights = build_insights(dataset)
    recommendations = build_recommendations(dataset)

    return {
        "dataset": {
            "id": dataset.id,
            "name": dataset.original_filename,
        },
        "profile": profile.model_dump(),
        "quality": quality.model_dump(),
        "validation": validation.model_dump(),
        "anomalies": anomalies.model_dump(),
        "insights": insights.model_dump(),
        "recommendations": [r.model_dump() for r in recommendations],
    }


def _render_pdf(payload: dict, name: str) -> str:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    os.makedirs(REPORTS_ROOT, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.pdf"
    path = os.path.join(REPORTS_ROOT, filename)

    styles = getSampleStyleSheet()
    story = [Paragraph(name, styles["Title"]), Spacer(1, 12)]

    ds = payload["dataset"]
    story.append(Paragraph(f"Dataset: {ds['name']} (id={ds['id']})", styles["Normal"]))
    story.append(Spacer(1, 12))

    q = payload["quality"]
    story.append(
        Paragraph(f"Overall Quality Score: {q['overall']} / 100", styles["Heading2"])
    )
    for dim in q["dimensions"]:
        story.append(
            Paragraph(
                f"- {dim['name']}: {dim['score']} — {dim['description']}",
                styles["Normal"],
            )
        )
    story.append(Spacer(1, 12))

    v = payload["validation"]
    story.append(
        Paragraph(
            f"Validation: {v['passed']}/{v['totalChecks']} checks passed",
            styles["Heading2"],
        )
    )
    story.append(Spacer(1, 12))

    a = payload["anomalies"]
    story.append(
        Paragraph(f"Anomalies: {a['totalOutliers']} flagged rows", styles["Heading2"])
    )
    story.append(Spacer(1, 12))

    story.append(Paragraph("Top Recommendations", styles["Heading2"]))
    for r in payload["recommendations"][:10]:
        story.append(Paragraph(f"- [{r['severity']}] {r['text']}", styles["Normal"]))

    SimpleDocTemplate(path, pagesize=A4).build(story)
    return path


def generate_report(db: Session, dataset: Dataset, name: str, fmt: str) -> DQReport:
    payload = build_full_report_payload(dataset)

    file_path = None
    if fmt.upper() == "PDF":
        file_path = _render_pdf(payload, name)

    report = DQReport(
        dataset_id=dataset.id,
        name=name,
        format=fmt,
        payload_json=json.dumps(payload, default=str),
        file_path=file_path,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
