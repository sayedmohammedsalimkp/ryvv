from datetime import datetime, timezone

from app.db.supabase import get_service_client
from app.services.activity import log_activity
from app.services.balances import (
    contact_balance_paise,
    contact_balances_map,
    fetch_balance_txns,
)


def list_contacts(
    user_id: str,
    q: str | None = None,
    txns: list[dict] | None = None,
) -> list[dict]:
    sb = get_service_client()
    query = (
        sb.table("contacts")
        .select("*")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .order("name")
    )
    res = query.execute()
    rows = res.data or []
    if q:
        ql = q.lower()
        rows = [r for r in rows if ql in (r.get("name") or "").lower()]
    bals = contact_balances_map(
        [r["id"] for r in rows],
        txns if txns is not None else fetch_balance_txns(user_id),
    )
    return [{**r, "balance_paise": bals.get(r["id"], 0)} for r in rows]


def get_contact(user_id: str, contact_id: str) -> dict | None:
    sb = get_service_client()
    res = (
        sb.table("contacts")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", contact_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    row = res.data[0]
    return {**row, "balance_paise": contact_balance_paise(user_id, contact_id)}


def create_contact(user_id: str, data: dict) -> dict:
    sb = get_service_client()
    payload = {"user_id": user_id, **data}
    res = sb.table("contacts").insert(payload).execute()
    row = res.data[0]
    log_activity(
        user_id,
        action="created",
        entity_type="contact",
        entity_id=row["id"],
        title=f"Added contact {row['name']}",
        detail=row.get("phone") or row.get("note"),
    )
    return {**row, "balance_paise": 0}


def update_contact(user_id: str, contact_id: str, data: dict) -> dict | None:
    sb = get_service_client()
    clean = {k: v for k, v in data.items() if v is not None}
    if not clean:
        return get_contact(user_id, contact_id)
    res = (
        sb.table("contacts")
        .update(clean)
        .eq("user_id", user_id)
        .eq("id", contact_id)
        .is_("deleted_at", "null")
        .execute()
    )
    if not res.data:
        return None
    row = res.data[0]
    log_activity(
        user_id,
        action="updated",
        entity_type="contact",
        entity_id=contact_id,
        title=f"Updated contact {row['name']}",
    )
    return {**row, "balance_paise": contact_balance_paise(user_id, contact_id)}


def delete_contact(user_id: str, contact_id: str) -> bool:
    sb = get_service_client()
    existing = get_contact(user_id, contact_id)
    res = (
        sb.table("contacts")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("user_id", user_id)
        .eq("id", contact_id)
        .is_("deleted_at", "null")
        .execute()
    )
    if res.data and existing:
        log_activity(
            user_id,
            action="deleted",
            entity_type="contact",
            entity_id=contact_id,
            title=f"Deleted contact {existing['name']}",
            amount_paise=int(existing.get("balance_paise") or 0) or None,
        )
    return bool(res.data)


def settle_contact(user_id: str, contact_id: str) -> dict | None:
    """Mark all open contact transactions settled → balance 0."""
    contact = get_contact(user_id, contact_id)
    if not contact:
        return None
    bal_before = int(contact.get("balance_paise") or 0)
    sb = get_service_client()
    now = datetime.now(timezone.utc).isoformat()
    # settle all unsettled rows for this contact
    open_txns = (
        sb.table("transactions")
        .select("id")
        .eq("user_id", user_id)
        .eq("contact_id", contact_id)
        .is_("settled_at", "null")
        .execute()
    )
    for t in open_txns.data or []:
        sb.table("transactions").update({"settled_at": now}).eq("id", t["id"]).execute()

    log_activity(
        user_id,
        action="settled",
        entity_type="contact",
        entity_id=contact_id,
        title=f"Settled all with {contact['name']}",
        detail="Balance cleared to ₹0",
        amount_paise=abs(bal_before) or None,
        meta={"balance_before_paise": bal_before},
    )
    return get_contact(user_id, contact_id)
