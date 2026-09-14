"""Background jobs: reminders + digests."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.services.telegram import api as tg
from app.services.telegram import links as link_service
from app.services.telegram import reminders as reminder_service
from app.services.telegram.digest import digest_text
from app.services.telegram.formatters import reminder_fire

log = logging.getLogger("ryvv.telegram.jobs")

try:
    from zoneinfo import ZoneInfo

    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = timezone.utc


def run_due_reminders() -> int:
    rows = reminder_service.due_reminders()
    n = 0
    for r in rows:
        try:
            tg.send_message(r["telegram_chat_id"], reminder_fire(r["message"]))
            reminder_service.mark_sent(r["id"])
            n += 1
        except Exception as e:
            log.warning("reminder send fail %s: %s", r.get("id"), e)
    return n


def run_morning_digests(*, force: bool = False) -> int:
    """Send digests around 8:00 IST (hour window). force=True sends all."""
    now = datetime.now(IST)
    if not force and now.hour != 8:
        return 0
    n = 0
    for link in link_service.list_digest_links():
        try:
            tg.send_message(link["telegram_chat_id"], digest_text(link["user_id"]))
            n += 1
        except Exception as e:
            log.warning("digest fail %s: %s", link.get("user_id"), e)
    return n


def run_all_jobs(*, force_digest: bool = False) -> dict:
    return {
        "reminders_sent": run_due_reminders(),
        "digests_sent": run_morning_digests(force=force_digest),
        "at": datetime.now(timezone.utc).isoformat(),
    }
