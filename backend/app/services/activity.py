from datetime import datetime, timezone
from typing import Any

from app.db.supabase import get_service_client


def log_activity(
    user_id: str,
    *,
    action: str,
    entity_type: str,
    title: str,
    entity_id: str | None = None,
    detail: str | None = None,
    amount_paise: int | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    sb = get_service_client()
    sb.table("activity_logs").insert(
        {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "title": title,
            "detail": detail,
            "amount_paise": amount_paise,
            "meta": meta or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()


def list_activity(user_id: str, limit: int = 50) -> list[dict]:
    sb = get_service_client()
    res = (
        sb.table("activity_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []
