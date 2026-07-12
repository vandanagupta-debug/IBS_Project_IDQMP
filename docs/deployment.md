# Deployment Guide

## Local / single-host deployment (Docker Compose)

This is the fastest path to a working deployment and is suitable for demos,
staging, or small production workloads on a single VM.

```bash
git clone <your-fork-url>
cd IBS_FASTAPI_PROJECT
cp backend/.env.example backend/.env      # edit SECRET_KEY, DATABASE_URL, etc.
cp frontend/.env.example frontend/.env.local
docker compose up --build -d
```

- Backend: `http://<host>:8000` (docs at `/docs`)
- Frontend: `http://<host>:5173`

Set real secrets via environment variables or a `.env` file next to
`docker-compose.yml` (Compose auto-loads `.env`) rather than committing them:

```bash
SECRET_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
```

## Production hardening checklist

- [ ] Set a strong, unique `SECRET_KEY` and `POSTGRES_PASSWORD` (never the
      `.env.example` defaults).
- [ ] Put the stack behind a reverse proxy / load balancer with TLS
      termination (e.g. Caddy, Traefik, or a managed load balancer).
- [ ] Restrict `CORSMiddleware` origins in `backend/app/main.py` (currently
      `*` for development convenience).
- [ ] Point `DATABASE_URL` at a managed/HA PostgreSQL instance instead of the
      bundled `db` container for anything beyond single-host use.
- [ ] Configure log shipping (loguru sinks in `backend/app/core/logging.py`
      can be extended to ship to a file or external aggregator).
- [ ] Run `docker compose exec backend alembic upgrade head` as part of your
      release process once migrations are introduced (see Troubleshooting in
      the root README for the current schema-creation approach).
- [ ] Enable the `docker.yml` / CI pipelines on your fork so every merge to
      `main` is build- and smoke-tested before you deploy it.

## Building images independently (e.g. for a registry)

```bash
docker build -t your-registry/ibs-backend:latest ./backend
docker build -t your-registry/ibs-frontend:latest \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  ./frontend
docker push your-registry/ibs-backend:latest
docker push your-registry/ibs-frontend:latest
```

## Kubernetes / other orchestrators

Not included out of the box. The two Dockerfiles are standard multi-stage,
non-root, health-checked images, so they can be deployed as Deployments +
Services behind an Ingress; you will need to translate the `environment:`
block in `docker-compose.yml` into ConfigMaps/Secrets and the named volumes
into PersistentVolumeClaims.
