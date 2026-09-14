"""Telegram reminders."""

from __future__ import annotations

from datetime import datetime, timezone

from app.db.supabase import get_service_client


def create_reminder(
    user_id: str, telegram_chat_id: int, message: str, due_at: datetime
) -> dict:
    sb = get_service_client()
    res = (
        sb.table("telegram_reminders")
        .insert(
            {
                "user_id": user_id,
                "telegram_chat_id": telegram_chat_id,
                "message": message,
                "due_at": due_at.astimezone(timezone.utc).isoformat(),
            }
        )
        .execute()
    )
    return res.data[0]


def due_reminders(now: datetime | None = None) -> list[dict]:
    sb = get_service_client()
    ts = (now or datetime.now(timezone.utc)).isoformat()
    res = (
        sb.table("telegram_reminders")
        .select("*")
        .is_("sent_at", "null")
        .lte("due_at", ts)
        .limit(100)
        .execute()
    )
    return res.data or []


def mark_sent(reminder_id: str) -> None:
    sb = get_service_client()
    sb.table("telegram_reminders").update(
        {"sent_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", reminder_id).execute()
