# IBS Data Quality Platform

AI-assisted data quality, profiling, validation, and test-generation
platform. FastAPI backend + React (Vite) frontend, containerized with
Docker, tested with Pytest and Playwright, and built/verified with GitHub
Actions.

## Table of contents

- [Project overview](#project-overview)
- [Folder structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Quick start (Docker Compose)](#quick-start-docker-compose)
- [Backend setup (local, no Docker)](#backend-setup-local-no-docker)
- [Frontend setup (local, no Docker)](#frontend-setup-local-no-docker)
- [Running tests](#running-tests)
- [Running Playwright end-to-end tests](#running-playwright-end-to-end-tests)
- [Docker commands reference](#docker-commands-reference)
- [Git commands reference](#git-commands-reference)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Project overview

- **backend/** - FastAPI REST API: dataset upload, profiling, validation,
  anomaly detection, cleaning, quality scoring, insights, visualization
  data, and AI-assisted pytest/Playwright test generation. PostgreSQL via
  SQLAlchemy.
- **frontend/** - React 19 + Vite single-page app consuming the API.
- **docker-compose.yml** - runs `db` (Postgres), `backend`, and `frontend`
  together.
- **.github/workflows/** - CI for backend, frontend, and a Docker Compose
  smoke test.

See [`docs/architecture.md`](docs/architecture.md) for a deeper look at how
the pieces fit together, and [`docs/api.md`](docs/api.md) for the API
surface.

## Folder structure

```text
IBS_FASTAPI_PROJECT/
│
├── .github/workflows/          # backend-ci.yml, frontend-ci.yml, docker.yml
│
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI routers
│   │   ├── core/                # config.py (settings), logging.py
│   │   ├── database/            # engine/session/base + get_db dependency
│   │   ├── middleware/          # auth / exception / logging hooks
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # business logic
│   │   ├── utils/                # shared helpers
│   │   ├── uploads/              # runtime upload storage (gitignored contents)
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── tests/
│   │   ├── unit/                 # isolated, no HTTP client / DB
│   │   ├── integration/          # via FastAPI TestClient + in-memory SQLite
│   │   └── conftest.py
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── requirements-dev.txt      # + ruff/black/isort/mypy/pytest-cov
│   ├── pytest.ini
│   ├── .env.example
│   └── .dockerignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                  # axios clients
│   │   ├── assets/
│   │   ├── components/           # incl. components/layout (MainLayout, Navbar, Sidebar, Footer)
│   │   ├── contexts/              # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/
│   │   ├── layouts/               # reserved - see src/layouts/README.md
│   │   ├── pages/
│   │   ├── routes/                # ProtectedRoute, PublicRoute
│   │   ├── services/               # reserved - see src/services/README.md
│   │   └── styles/
│   ├── tests/e2e/                  # Playwright specs
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── playwright.config.ts
│   ├── tsconfig.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .dockerignore
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── deployment.md
│   └── screenshots/
│
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

- Docker Desktop / Docker Engine + Compose v2 (`docker compose`, not the
  old `docker-compose`)
- **or**, for running services without Docker:
  - Python 3.12
  - Node.js 20+
  - A local or reachable PostgreSQL 16 instance

## Environment variables

Copy the example files and fill in real values before running anything:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

`backend/.env.example`:

| Variable | Description | Default |
|---|---|---|
| `APP_NAME` | Displayed app name / OpenAPI title | `IBS Data Quality Platform` |
| `APP_VERSION` | Displayed API version | `1.0.0` |
| `DEBUG` | Enables debug logging/behavior | `True` |
| `DATABASE_URL` | SQLAlchemy Postgres URL | `postgresql://postgres:postgres@localhost:5432/ibs_dqp` |
| `SECRET_KEY` | JWT signing secret - **change in production** | `change-me-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry | `30` |
| `OPENAI_API_KEY` | Optional, for AI-assisted features | *(empty)* |

`frontend/.env.example`:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL the SPA calls | `http://localhost:8000` |

In Docker Compose, these are instead supplied via the `environment:` /
`args:` blocks in `docker-compose.yml`, which read from a `.env` file placed
**next to `docker-compose.yml`** (Compose auto-loads it) for secrets like
`SECRET_KEY` and `POSTGRES_PASSWORD`.

## One-command local setup (no Docker)

If you'd rather run backend + frontend directly instead of via Docker:

```bash
./scripts/setup.sh
```

This creates `backend/.env` and `frontend/.env.local` from their `.env.example`
files (only if they don't already exist), sets up the backend virtualenv,
installs `requirements.txt`, and runs `npm install` for the frontend. It
prints the exact next commands to start both servers when it finishes.
**Edit `backend/.env` afterwards** to set a real `SECRET_KEY` and confirm
`DATABASE_URL` matches your local Postgres.

## Quick start (Docker Compose)

```bash
docker compose up --build
```

- Backend: http://localhost:8000 (docs at `/docs`, health at `/health`)
- Frontend: http://localhost:5173

Run it detached and follow logs separately:

```bash
docker compose up --build -d
docker compose logs -f
```

## Backend setup (local, no Docker)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows (PowerShell: venv\Scripts\Activate.ps1)

# Install dependencies (runtime only)
pip install -r requirements.txt
# ...or, for linting/testing tools too:
pip install -r requirements-dev.txt

# Run FastAPI (reload for local dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Generate coverage report
pytest --cov=app --cov-report=html
open htmlcov/index.html   # macOS; use `xdg-open` on Linux or open manually on Windows
```

Requires a reachable PostgreSQL instance matching `DATABASE_URL` in
`backend/.env`. To run one quickly with Docker without the rest of the
stack:

```bash
docker run --name ibs-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ibs_dqp -p 5432:5432 -d postgres:16-alpine
```

## Frontend setup (local, no Docker)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build project
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

The dev server runs at http://localhost:5173 and expects the backend at
`VITE_API_BASE_URL` (default `http://localhost:8000`).

## Running tests

### Backend (Pytest)

```bash
cd backend
pytest                              # all tests
pytest tests/unit                   # unit tests only
pytest tests/integration            # integration tests only
pytest --cov=app --cov-report=term-missing   # with coverage
```

Via Docker Compose (against the running `backend` container):

```bash
docker compose exec backend pytest
docker compose exec backend pytest --cov=app
```

### Frontend (lint + build)

```bash
cd frontend
npm run lint
npm run build
```

## Running Playwright end-to-end tests

```bash
cd frontend
npm install
npx playwright install --with-deps   # one-time browser install
npm run test:e2e                     # headless run (auto-starts the dev server)
npm run test:e2e:ui                  # interactive UI mode
npm run test:e2e:report              # view the HTML report from the last run
```

Against a specific already-running instance (e.g. the Dockerized frontend):

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e
```

Via Docker Compose:

```bash
docker compose exec frontend sh
# then, inside the container (or from the host against a container with
# node_modules mounted): npx playwright test
```

> Playwright browsers are not bundled into the production nginx image (it
> only serves the built static assets), so end-to-end tests are run from a
> Node environment (locally or in CI) pointed at a running frontend, not
> inside the `frontend` container itself.

Specs live in `frontend/tests/e2e/`: `homepage.spec.ts`, `upload.spec.ts`,
`profiling.spec.ts`, `charts.spec.ts`, `reports.spec.ts`,
`error-pages.spec.ts`, `responsive.spec.ts`.

## Docker commands reference

```bash
docker compose build
docker compose up
docker compose up --build
docker compose down
docker compose restart
docker compose logs -f
docker compose ps
docker compose exec backend bash
docker compose exec frontend sh
docker compose exec backend pytest
docker compose exec backend pytest --cov=app
docker compose exec frontend npx playwright test
docker image ls
docker container ls
docker system prune -af
docker volume prune -f
docker network ls
docker compose down -v
```

## Git commands reference

```bash
# Clone
git clone <repository-url>
cd IBS_FASTAPI_PROJECT

# Branching
git checkout -b feature/my-change
git branch                       # list local branches
git branch -d feature/my-change  # delete a merged local branch

# Status / staging / committing
git status
git add .
git commit -m "Describe the change"

# Syncing
git pull origin main
git push origin feature/my-change

# Merging
git checkout main
git merge feature/my-change

# Resolving merge conflicts
#   1. Open the conflicting files - Git marks conflicts with
#      <<<<<<<, =======, >>>>>>> markers.
#   2. Edit each file to keep the correct content and remove the markers.
git add <resolved-file>
git commit                        # completes the merge
```

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/vandanagupta-debug/IBS_Project_IDQMP.git
git pull origin main --rebase
git push -u origin main

## CI/CD

Three workflows under `.github/workflows/`:

- **backend-ci.yml** - lint (ruff, black, isort, mypy), pytest with
  coverage against a real Postgres service container, then builds the
  backend Docker image.
- **frontend-ci.yml** - lint, TypeScript check, production build, Playwright
  end-to-end tests (report uploaded as an artifact), then builds the
  frontend Docker image.
- **docker.yml** - brings up the full `docker compose` stack and waits for
  both `/health` endpoints as a smoke test.

All three run on push/PR to `main`, scoped to the relevant path
(`backend/**` or `frontend/**`) so unrelated changes don't trigger unrelated
pipelines.

## Deployment

See [`docs/deployment.md`](docs/deployment.md) for single-host Docker
Compose deployment, a production hardening checklist, and notes on pushing
images to a registry.

## Troubleshooting

- **`pydantic_core.ValidationError: Field required` on startup (`APP_NAME`,
  `DATABASE_URL`, `SECRET_KEY`, ...)**: `backend/.env` doesn't exist yet.
  `Settings()` in `app/core/config.py` reads it via `env_file=".env"`
  relative to wherever you *launch* `uvicorn`/`pytest` from - it must exist
  as `backend/.env` (not the repo root). Fix: `cd backend && cp .env.example
  .env`, then edit it. `./scripts/setup.sh` does this for you automatically.
- **Never commit `.env` or paste it into chat/tickets/logs.** It's already
  gitignored. If a real secret (API key, DB password) ever ends up
  somewhere it shouldn't - a chat, a commit, a screenshot - rotate it
  immediately at the provider (e.g. https://platform.openai.com/api-keys
  for OpenAI) rather than just removing it from the file; once it's been
  transmitted anywhere outside your machine, treat it as compromised.
- **Frontend shows every request failing at once** (uploads, dataset lists,
  reports - even `OPTIONS` preflights, all red in the Network tab): this
  means the browser can't reach the backend at all, almost always because
  `uvicorn` isn't actually running (crashed, or never started, or was
  started in a terminal you later closed/Ctrl-C'd). Check that terminal
  first before debugging anything else - a single dead backend process
  causes exactly this symptom across every unrelated feature at once.
- **`npm ci` fails / lockfile out of sync**: this restructuring added
  `@playwright/test` as a devDependency. Run `npm install` once locally
  (with network access) to regenerate `frontend/package-lock.json`, commit
  it, and CI/Docker will then work with the updated lockfile. The
  `Dockerfile` and CI workflow intentionally use `npm install` rather than
  `npm ci` until that lockfile is regenerated.
- **Backend can't reach Postgres**: confirm `DATABASE_URL` host matches how
  you're running things - `db` when using `docker compose`, `localhost`
  when running the backend directly against a container/local Postgres.
- **`/health` never turns healthy in `docker compose ps`**: check
  `docker compose logs backend` (or `frontend`) - most often a missing
  `SECRET_KEY`/`DATABASE_URL` or the database not yet accepting
  connections (the `db` service's healthcheck should gate `backend`'s
  startup, but slow disks can still exceed the default `start_period`).
- **Playwright browsers missing**: run
  `npx playwright install --with-deps` once per machine/CI runner.
- **Schema changes not reflected**: `backend/app/main.py` currently calls
  `Base.metadata.create_all()` at startup rather than using Alembic
  migrations. This is fine for a fresh database but won't apply schema
  *changes* to an existing one - introduce an Alembic migration
  (`alembic revision --autogenerate`) for anything beyond local prototyping.
