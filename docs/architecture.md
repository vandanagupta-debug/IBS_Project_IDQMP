# Architecture

## Overview

The platform is a two-tier web application:

- **backend/** - a FastAPI service exposing a REST API for dataset upload,
  profiling, validation, anomaly detection, cleaning, quality scoring,
  insights, visualization data, and report/test generation. Persistence is
  PostgreSQL via SQLAlchemy.
- **frontend/** - a React (Vite) single-page app that consumes the backend
  API and renders the dashboards, upload flows, and reports.

```
Browser ──▶ frontend (nginx, :80/5173) ──▶ backend (FastAPI, :8000) ──▶ PostgreSQL (:5432)
```

## Backend layout

```
backend/app/
├── api/          # FastAPI routers - one module per resource/feature
├── core/         # settings (config.py) and logging setup
├── database/     # SQLAlchemy engine/session/declarative base + FastAPI deps
├── middleware/    # cross-cutting HTTP concerns (auth, exceptions, logging)
├── models/       # SQLAlchemy ORM models
├── schemas/      # Pydantic request/response schemas
├── services/     # business logic (profiling, cleaning, AI test generation, ...)
├── utils/        # small shared helpers
└── main.py       # FastAPI app factory / router wiring
```

Tests live outside the `app` package in `backend/tests/`, split into:

- `unit/` - tests that exercise a single function/class in isolation
  (no HTTP client, no DB).
- `integration/` - tests that go through the FastAPI `TestClient` and an
  in-memory SQLite database (see `tests/conftest.py`).

## Frontend layout

```
frontend/src/
├── api/          # axios-based API clients, one per backend resource
├── assets/       # static assets (images, icons, fonts)
├── components/   # shared/reusable UI components (incl. components/layout)
├── contexts/     # React context providers (auth, theme, toasts)
├── hooks/        # custom hooks
├── layouts/      # reserved for additional page-shell layouts (see its README)
├── pages/        # one folder per route/page
├── routes/       # route guards (ProtectedRoute / PublicRoute)
├── services/     # reserved for non-HTTP client-side services (see its README)
└── styles/       # global/theme CSS
```

End-to-end tests live in `frontend/tests/e2e/` and run with Playwright.

## Data flow (dataset upload → report)

1. User uploads a CSV/XLSX file (`POST /datasets/upload`).
2. The dataset service parses it into a DataFrame and persists metadata.
3. Profiling, validation, anomaly, quality, and cleaning services each
   operate on the stored dataset independently and are callable via their
   own endpoints.
4. Insights and recommendation services summarize findings.
5. Report/test generation services (pytest + Playwright code generators)
   produce downloadable artifacts.
