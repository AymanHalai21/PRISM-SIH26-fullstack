# PRISM — Full Stack (Frontend + FastAPI Backend)

## Run everything (Docker)
    docker compose up --build
Then open **http://localhost:8080** (frontend). API docs: http://localhost:8000/docs

First start runs migrations + seeds demo data automatically.

## Demo logins (pick a role on the login screen — password/MFA are handled for you)
| Role | Email | Password |
|---|---|---|
| Police | police@prism.demo | PrismDemo!2026 |
| Judge | judge@prism.demo | PrismDemo!2026 |
| Lawyer | lawyer@prism.demo | PrismDemo!2026 |
| Forensic | forensic@prism.demo | PrismDemo!2026 |

The MFA screen shows a REAL live TOTP code (refreshes every 30s) that the backend verifies.
Demo-only: the frontend knows the fixed demo secrets (see backend/app/db/seed.py and
frontend/api.js). Real deployments must never expose MFA secrets to the client.

## Run without Docker (dev)
Backend (needs Postgres + MinIO, or use SQLite by leaving DATABASE_URL unset — file upload needs MinIO):
    cd backend && pip install -r requirements.txt
    alembic upgrade head && python -m app.db.seed
    uvicorn app.main:app --port 8000
Frontend:
    cd frontend && python3 -m http.server 8080   # open http://localhost:8080

If the API is elsewhere, set `window.PRISM_API_BASE = 'https://your-api'` before api.js loads (index.html).

## What's LIVE (real backend) vs still SIMULATED (localStorage, as before)
LIVE: login + MFA + JWT/refresh, case list/detail, FIR, documents list + integrity check
(hash of real stored bytes), evidence list, chain-of-custody, evidence integrity check,
role-based case visibility (lawyer sees neutral empty results for unassigned cases).
SIMULATED (backend endpoints not built yet): lawyer access-request / judge approval,
forensic exam start/finalize, audit-log viewer + hash-chain verify, search, notifications.
Note: the frontend has no document-upload screen; upload works via the API (/docs).

## Known limitations (hackathon prototype, not production)
- MFA login challenge has no server-side expiry check (backend/app/api/auth.py) and is in-memory.
- Audit-chain append is not concurrency-safe under heavy parallel writes.
- Tests: backend/tests (2 basic tests). Run: cd backend && pytest
