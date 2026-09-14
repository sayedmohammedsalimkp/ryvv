"""Pending Telegram confirmations."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.db.supabase import get_service_client


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_pending(
    telegram_user_id: int,
    user_id: str,
    kind: str,
    payload: dict,
    minutes: int = 30,
) -> str:
    sb = get_service_client()
    pid = str(uuid4())
    sb.table("telegram_pending").insert(
        {
            "id": pid,
            "telegram_user_id": telegram_user_id,
            "user_id": user_id,
            "kind": kind,
            "payload": payload,
            "expires_at": (_now() + timedelta(minutes=minutes)).isoformat(),
        }
    ).execute()
    return pid


def get_pending(pending_id: str) -> dict | None:
    sb = get_service_client()
    res = (
        sb.table("telegram_pending")
        .select("*")
        .eq("id", pending_id)
        .limit(1)
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        return None
    exp = datetime.fromisoformat(str(row["expires_at"]).replace("Z", "+00:00"))
    if exp < _now():
        delete_pending(pending_id)
        return None
    return row


def delete_pending(pending_id: str) -> None:
    sb = get_service_client()
    sb.table("telegram_pending").delete().eq("id", pending_id).execute()
