# ryvv money

India-first personal money manager (INR). Contacts, lend/borrow, income/expense, export.

## Stack

- Frontend: Next.js 14 (`frontend/`)
- Backend: FastAPI (`backend/`)
- Auth/DB: Supabase

## Run

### 1. Supabase

Run SQL in [`backend/supabase/migrations/00001_money_init.sql`](backend/supabase/migrations/00001_money_init.sql).

### 2. Backend

```powershell
cd backend
copy .env.example .env
# fill SUPABASE_* keys
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```powershell
cd frontend
copy .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_* and API URL
npm install
npm run dev
```

Open http://localhost:3000

## Phase 1 features

- Auth + profile (INR)
- Contacts + balances
- Gave / received / borrowed / lent / settle
- Income / expense + categories
- On hand + UPI / Bank / Other accounts
- Dashboard + activity log
- CSV + PDF export
- **Telegram bot + Groq GPT-OSS** (see [`backend/TELEGRAM.md`](backend/TELEGRAM.md))
- **Native Android app** (Kotlin + Compose — see [`android-app/README.md`](android-app/README.md))
- Web app remains Next.js (`frontend/`)

## Go live

See [`GO_LIVE.md`](GO_LIVE.md) — Sentry, rate limits, health checks, prod CORS.
