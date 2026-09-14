# RYVV go-live pack

Minimal production checklist that is already wired in code.

## What is in the repo

| Piece | Where | Notes |
|---|---|---|
| Sentry (API) | `backend` `SENTRY_DSN` | Off when empty |
| Sentry (web) | `frontend` `NEXT_PUBLIC_SENTRY_DSN` | Replay off (saves free quota) |
| Rate limits | SlowAPI | Default 120/min/IP; export 10/min; link code 5/min; webhook 180/min |
| Health | `GET /health` | Use for UptimeRobot / Better Stack |
| Ready | `GET /ready` | Shows env flags (supabase/telegram/groq/sentry) |
| Prod CORS | `APP_ENV=production` | No auto localhost; only `FRONTEND_URL` list |
| Prod docs | `APP_ENV=production` | `/docs` + `/redoc` disabled |

## 1. Sentry (free Developer plan)

1. Create account at [sentry.io](https://sentry.io)
2. Create project **ryvv-api** (Python/FastAPI) → copy DSN → backend `SENTRY_DSN`
3. Create project **ryvv-web** (Next.js) → copy DSN → frontend `NEXT_PUBLIC_SENTRY_DSN` (+ optional `SENTRY_DSN`)
4. Trigger a test error after deploy; confirm it shows in Sentry

## 2. Deploy API on Render (free)

Repo already has `backend/Dockerfile` + root `render.yaml`.

1. Push latest code to GitHub
2. [Render](https://dashboard.render.com) → **New** → **Blueprint** → pick `ryvv` repo  
   - Or **New Web Service** → Docker → **Root Directory** blank (repo root) → Dockerfile `./Dockerfile`  
   - Alt: Root Directory `backend` + Dockerfile `./Dockerfile` (uses `backend/Dockerfile`)
3. Fill env (see below). Leave `SENTRY_DSN` empty to skip Sentry.
4. Deploy. Open `https://ryvv-api.onrender.com/health` (or your service URL) → expect `200`
5. Free tier **sleeps** after idle; first request can take ~30–60s. Uptime ping keeps it warmer.

Telegram after API is live:

```
TELEGRAM_MODE=webhook
# set webhook to:
https://YOUR-RENDER-HOST/api/v1/telegram/webhook
```

(Use your bot’s secret / link flow from `backend/TELEGRAM.md`.)

## 3. Uptime

Point a free monitor at:

```
https://YOUR-API-HOST/health
```

Expect HTTP 200 every 1–5 minutes. Alert email on failure. Also reduces cold starts on free Render.

## 4. Env on deploy

### Backend (Render)
```
APP_ENV=production
FRONTEND_URL=https://your-app.vercel.app
TELEGRAM_MODE=webhook
# + existing Supabase / Telegram / Groq from .env
# SENTRY_DSN=   (optional)
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api/v1
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SENTRY_DSN=https://...@o....ingest.sentry.io/...
NEXT_PUBLIC_APP_ENV=production
```

## 5. After deploy smoke

1. `/health` → 200  
2. `/ready` → supabase/telegram flags look right  
3. Login on web  
4. Export one PDF (rate limit = 10/min)  
5. (Optional) Sentry test error if DSN set  

## Rate limit cheat sheet

| Route | Limit |
|---|---|
| Default API | 120 / minute / IP |
| `GET/PATCH /auth/me` | 60 / 30 / minute |
| `GET /export/pdf` + `/csv` | 10 / minute |
| `POST /telegram/link/code` | 5 / minute |
| `POST /telegram/webhook` | 180 / minute |
| `/health` `/ready` | 60 / minute |

Limits are **in-memory per process**. One Render instance is fine. Multi-instance later → Redis backend for SlowAPI.
