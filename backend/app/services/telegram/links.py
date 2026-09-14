"""Telegram ↔ RYVV user linking."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from app.db.supabase import get_service_client


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_link_code(user_id: str, minutes: int = 15) -> dict:
    sb = get_service_client()
    # wipe old codes for user
    sb.table("telegram_link_codes").delete().eq("user_id", user_id).execute()
    code = f"{secrets.randbelow(1_000_000):06d}"
    expires = (_now() + timedelta(minutes=minutes)).isoformat()
    sb.table("telegram_link_codes").insert(
        {"code": code, "user_id": user_id, "expires_at": expires}
    ).execute()
    return {"code": code, "expires_at": expires, "expires_in_minutes": minutes}


def get_link_status(user_id: str) -> dict:
    sb = get_service_client()
    res = (
        sb.table("telegram_links")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        return {"linked": False}
    return {
        "linked": True,
        "telegram_username": row.get("telegram_username"),
        "telegram_user_id": row.get("telegram_user_id"),
        "digest_enabled": row.get("digest_enabled", True),
        "alert_expense_paise": row.get("alert_expense_paise", 500000),
        "linked_at": row.get("linked_at"),
    }


def unlink_user(user_id: str) -> bool:
    sb = get_service_client()
    res = sb.table("telegram_links").delete().eq("user_id", user_id).execute()
    return bool(res.data)


def unlink_telegram(telegram_user_id: int) -> bool:
    sb = get_service_client()
    res = (
        sb.table("telegram_links")
        .delete()
        .eq("telegram_user_id", telegram_user_id)
        .execute()
    )
    return bool(res.data)


def get_by_telegram(telegram_user_id: int) -> dict | None:
    sb = get_service_client()
    res = (
        sb.table("telegram_links")
        .select("*")
        .eq("telegram_user_id", telegram_user_id)
        .limit(1)
        .execute()
    )
    return (res.data or [None])[0]


def link_with_code(
    code: str,
    telegram_user_id: int,
    telegram_chat_id: int,
    telegram_username: str | None,
) -> dict | None:
    sb = get_service_client()
    res = (
        sb.table("telegram_link_codes")
        .select("*")
        .eq("code", code.strip())
        .limit(1)
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        return None
    exp = datetime.fromisoformat(str(row["expires_at"]).replace("Z", "+00:00"))
    if exp < _now():
        sb.table("telegram_link_codes").delete().eq("code", code).execute()
        return None

    user_id = row["user_id"]
    # one telegram ↔ one user
    sb.table("telegram_links").delete().eq("user_id", user_id).execute()
    sb.table("telegram_links").delete().eq(
        "telegram_user_id", telegram_user_id
    ).execute()
    payload = {
        "user_id": user_id,
        "telegram_user_id": telegram_user_id,
        "telegram_chat_id": telegram_chat_id,
        "telegram_username": telegram_username,
        "updated_at": _now().isoformat(),
    }
    ins = sb.table("telegram_links").insert(payload).execute()
    sb.table("telegram_link_codes").delete().eq("code", code).execute()
    return (ins.data or [None])[0]


def list_digest_links() -> list[dict]:
    sb = get_service_client()
    res = (
        sb.table("telegram_links")
        .select("*")
        .eq("digest_enabled", True)
        .execute()
    )
    return res.data or []


def update_prefs(user_id: str, data: dict) -> dict | None:
    clean = {k: v for k, v in data.items() if k in {"digest_enabled", "alert_expense_paise"}}
    if not clean:
        return get_link_status(user_id)
    clean["updated_at"] = _now().isoformat()
    sb = get_service_client()
    res = (
        sb.table("telegram_links")
        .update(clean)
        .eq("user_id", user_id)
        .execute()
    )
    return (res.data or [None])[0]
