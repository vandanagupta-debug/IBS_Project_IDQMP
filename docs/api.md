# API Reference

The backend is self-documenting via FastAPI. Once running, browse:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI schema (JSON): `http://localhost:8000/openapi.json`

## Health

| Method | Path      | Description                          |
|--------|-----------|---------------------------------------|
| GET    | `/health` | Liveness/readiness probe (used by Docker healthchecks and CI) |
| GET    | `/`       | Root banner message                   |

## Feature routers

Each router in `backend/app/api/` maps to a feature area and is mounted in
`backend/app/main.py`:

| Router                | Prefix area (see source for exact paths) |
|------------------------|-------------------------------------------|
| `upload.py`             | Endpoint/spec upload (OpenAPI/Postman)   |
| `datasets.py`            | Dataset upload & management              |
| `profiling.py`           | Dataset profiling                        |
| `quality.py`             | Data quality scoring                     |
| `validation.py`          | Rule-based validation                    |
| `anomaly.py`             | Anomaly detection                        |
| `cleaning.py`            | Data cleaning operations                 |
| `insights.py`            | AI-generated insights                    |
| `visualizations.py`      | Chart/visualization data                 |
| `dq_reports.py`          | Data-quality reports                     |
| `generator.py` / `runner.py` / `reports.py` | Test generation & execution (pytest/Playwright) and reporting |

Refer to each router's source file for exact route paths and request/response
schemas (`backend/app/schemas/`), since these evolve alongside the code.
