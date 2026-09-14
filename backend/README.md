# Ryvv Money API

FastAPI backend for ryvv money (INR). Auth: Bearer JWT from Supabase.

## Quick start

```bash
cp .env.example .env
# fill SUPABASE_* and FRONTEND_URL

python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs

## Supabase

Run `supabase/migrations/00001_money_init.sql` in the SQL editor.
