#!/usr/bin/env bash
# One-time local setup for running the project WITHOUT Docker.
# Safe to re-run - it won't overwrite an existing .env.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "== Backend =="
cd "$ROOT_DIR/backend"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created backend/.env from .env.example - edit DATABASE_URL / SECRET_KEY before running."
else
  echo "backend/.env already exists, leaving it alone."
fi

if [ ! -d venv ]; then
  python3 -m venv venv
  echo "Created backend/venv"
fi

# shellcheck disable=SC1091
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo
echo "== Frontend =="
cd "$ROOT_DIR/frontend"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created frontend/.env.local from .env.example."
else
  echo "frontend/.env.local already exists, leaving it alone."
fi

npm install

echo
echo "== Done =="
cat << 'MSG'
Next steps:
  1. Make sure PostgreSQL is running and the database in backend/.env's
     DATABASE_URL exists, e.g.:
       createdb ibs_dqp
  2. Start the backend (in one terminal):
       cd backend && source venv/bin/activate && \
         uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  3. Start the frontend (in another terminal):
       cd frontend && npm run dev
  4. Open http://localhost:5173
MSG
