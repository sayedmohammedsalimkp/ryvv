import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.sentry_init import init_sentry
from app.routers import api_router
from app.schemas.money import HealthOut

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
)
for name in ("ryvv.telegram", "ryvv.telegram.poll", "ryvv.telegram.groq"):
    logging.getLogger(name).setLevel(logging.INFO)
# httpx INFO logs full URLs — would leak TELEGRAM_BOT_TOKEN
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

_poll_stop: asyncio.Event | None = None
_poll_task: asyncio.Task | None = None

# Init Sentry before the app is created so startup errors are captured.
init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _poll_stop, _poll_task
    settings = get_settings()
    mode = (settings.TELEGRAM_MODE or "off").lower().strip()
    token_ok = bool(settings.TELEGRAM_BOT_TOKEN)
    logging.getLogger("ryvv.telegram").info(
        "startup TELEGRAM_MODE=%s token=%s groq=%s env=%s",
        mode,
        "yes" if token_ok else "no",
        "yes" if settings.GROQ_API_KEY else "no",
        settings.APP_ENV,
    )
    if mode == "polling" and token_ok:
        from app.services.telegram.poller import poll_loop

        _poll_stop = asyncio.Event()
        _poll_task = asyncio.create_task(poll_loop(_poll_stop))
    yield
    if _poll_stop and _poll_task:
        _poll_stop.set()
        try:
            await asyncio.wait_for(_poll_task, timeout=5)
        except Exception:
            _poll_task.cancel()


settings = get_settings()

app = FastAPI(
    title="RYVV Money API",
    version="1.1.0",
    description="Personal money manager — contacts, transactions, INR, Telegram. Bearer JWT required.",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

origins = [o.strip() for o in settings.FRONTEND_URL.split(",") if o.strip()]
# Localhost aliases only outside production — browsers treat them as different origins.
if not settings.is_production:
    for o in ("http://localhost:3000", "http://127.0.0.1:3000"):
        if o not in origins:
            origins.append(o)
if not origins:
    origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", response_model=HealthOut)
@limiter.limit("60/minute")
def health(request: Request):
    """Uptime monitors should hit this (UptimeRobot, Better Stack, etc.)."""
    return HealthOut(status="ok", time=datetime.now(timezone.utc))


@app.get("/ready")
@limiter.limit("60/minute")
def ready(request: Request):
    """Liveness + basic config sanity for deploy dashboards."""
    s = get_settings()
    return JSONResponse(
        {
            "status": "ok",
            "env": s.APP_ENV,
            "supabase": bool(s.SUPABASE_URL and "placeholder" not in s.SUPABASE_URL),
            "telegram": bool(s.TELEGRAM_BOT_TOKEN),
            "groq": bool(s.GROQ_API_KEY),
            "sentry": bool(s.SENTRY_DSN),
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )
