"""Telegram webhook + authenticated link management + jobs."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.deps import CurrentUserId
from app.core.rate_limit import limiter
from app.services.telegram import api as tg
from app.services.telegram import jobs as tg_jobs
from app.services.telegram import links as link_service
from app.services.telegram.handlers import process_update

router = APIRouter()


class TelegramPrefsUpdate(BaseModel):
    digest_enabled: bool | None = None
    alert_expense_rupees: float | None = None


@router.post("/webhook")
@limiter.limit("180/minute")
async def telegram_webhook(
    request: Request,
    update: dict,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    settings = get_settings()
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(503, detail="Telegram not configured")
    secret = settings.TELEGRAM_WEBHOOK_SECRET
    if secret and x_telegram_bot_api_secret_token != secret:
        raise HTTPException(403, detail="Bad webhook secret")
    try:
        process_update(update)
    except Exception as e:
        # Always 200 to Telegram to avoid retries storms; log + Sentry server-side
        import logging

        logging.getLogger("ryvv.telegram").exception("webhook: %s", e)
        try:
            import sentry_sdk

            sentry_sdk.capture_exception(e)
        except Exception:
            pass
    return {"ok": True}


@router.get("/link")
@limiter.limit("60/minute")
def get_telegram_link(request: Request, user_id: CurrentUserId):
    status = link_service.get_link_status(user_id)
    settings = get_settings()
    status["bot_username"] = settings.TELEGRAM_BOT_USERNAME or None
    status["configured"] = bool(settings.TELEGRAM_BOT_TOKEN)
    return status


@router.post("/link/code")
@limiter.limit("5/minute")
def create_telegram_code(request: Request, user_id: CurrentUserId):
    if not get_settings().TELEGRAM_BOT_TOKEN:
        raise HTTPException(503, detail="Telegram bot not configured")
    code = link_service.create_link_code(user_id)
    settings = get_settings()
    uname = settings.TELEGRAM_BOT_USERNAME
    deep = f"https://t.me/{uname}?start={code['code']}" if uname else None
    return {**code, "deep_link": deep, "bot_username": uname or None}


@router.delete("/link")
@limiter.limit("10/minute")
def unlink_telegram(request: Request, user_id: CurrentUserId):
    ok = link_service.unlink_user(user_id)
    if not ok:
        raise HTTPException(404, detail="Not linked")
    return {"ok": True}


@router.patch("/link/prefs")
@limiter.limit("30/minute")
def update_telegram_prefs(
    request: Request, body: TelegramPrefsUpdate, user_id: CurrentUserId
):
    data: dict = {}
    if body.digest_enabled is not None:
        data["digest_enabled"] = body.digest_enabled
    if body.alert_expense_rupees is not None:
        data["alert_expense_paise"] = int(round(body.alert_expense_rupees * 100))
    row = link_service.update_prefs(user_id, data)
    if not row:
        raise HTTPException(404, detail="Not linked")
    return link_service.get_link_status(user_id)


@router.post("/jobs/run")
@limiter.limit("30/minute")
def run_jobs(
    request: Request,
    force_digest: bool = Query(False),
    x_jobs_secret: str | None = Header(default=None),
):
    """Cron hit this every minute for reminders; digests fire at 8 IST."""
    settings = get_settings()
    secret = settings.TELEGRAM_WEBHOOK_SECRET
    if secret and x_jobs_secret != secret:
        raise HTTPException(403, detail="Bad jobs secret")
    if not tg.bot_enabled():
        raise HTTPException(503, detail="Telegram not configured")
    return tg_jobs.run_all_jobs(force_digest=force_digest)
