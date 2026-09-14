from datetime import date, datetime, timezone

from fastapi import HTTPException

from app.db.supabase import get_service_client
from app.services.activity import log_activity
from app.services.balances import paise_to_rupees, rupees_to_paise

CONTACT_REQUIRED = {"gave", "received", "borrowed", "lent", "settle"}
PERSONAL = {"income", "expense"}


def _enrich(row: dict, contacts: dict, accounts: dict, categories: dict) -> dict:
    cid = row.get("contact_id")
    aid = row.get("account_id")
    cat = row.get("category_id")
    amount = int(row["amount"])
    return {
        **row,
        "amount_paise": amount,
        "amount_rupees": paise_to_rupees(amount),
        "contact_name": contacts.get(cid),
        "account_name": accounts.get(aid),
        "category_name": categories.get(cat),
    }


def _lookup_maps(user_id: str) -> tuple[dict, dict, dict]:
    sb = get_service_client()
    contacts = {
        c["id"]: c["name"]
        for c in (
            sb.table("contacts").select("id,name").eq("user_id", user_id).execute().data
            or []
        )
    }
    accounts = {
        a["id"]: a["name"]
        for a in (
            sb.table("accounts").select("id,name").eq("user_id", user_id).execute().data
            or []
        )
    }
    categories = {
        c["id"]: c["name"]
        for c in (
            sb.table("categories").select("id,name").eq("user_id", user_id).execute().data
            or []
        )
    }
    return contacts, accounts, categories


def list_transactions(
    user_id: str,
    *,
    contact_id: str | None = None,
    account_id: str | None = None,
    on_hand: bool = False,
    txn_type: str | None = None,
    category_id: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 100,
) -> list[dict]:
    sb = get_service_client()
    q = (
        sb.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("txn_date", desc=True)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if contact_id:
        q = q.eq("contact_id", contact_id)
    if on_hand:
        q = q.is_("account_id", "null")
    elif account_id:
        q = q.eq("account_id", account_id)
    if txn_type:
        q = q.eq("type", txn_type)
    if category_id:
        q = q.eq("category_id", category_id)
    if date_from:
        q = q.gte("txn_date", date_from.isoformat())
    if date_to:
        q = q.lte("txn_date", date_to.isoformat())
    res = q.execute()
    contacts, accounts, categories = _lookup_maps(user_id)
    return [_enrich(r, contacts, accounts, categories) for r in (res.data or [])]


def get_transaction(user_id: str, txn_id: str) -> dict | None:
    sb = get_service_client()
    res = (
        sb.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", txn_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    contacts, accounts, categories = _lookup_maps(user_id)
    return _enrich(res.data[0], contacts, accounts, categories)


def create_transaction(user_id: str, data: dict) -> dict:
    typ = data["type"]
    contact_id = data.get("contact_id")
    if typ in CONTACT_REQUIRED and not contact_id:
        raise HTTPException(400, detail=f"{typ} requires contact_id")
    if typ in PERSONAL and contact_id:
        # allow but not required; ignore contact for personal if not needed
        pass

    payload = {
        "user_id": user_id,
        "type": typ,
        "amount": rupees_to_paise(data["amount_rupees"]),
        "txn_date": (data.get("txn_date") or date.today()).isoformat(),
        "note": data.get("note"),
        "contact_id": str(contact_id) if contact_id else None,
        "account_id": str(data["account_id"]) if data.get("account_id") else None,
        "category_id": str(data["category_id"]) if data.get("category_id") else None,
    }
    sb = get_service_client()
    res = sb.table("transactions").insert(payload).execute()
    contacts, accounts, categories = _lookup_maps(user_id)
    row = _enrich(res.data[0], contacts, accounts, categories)
    who = row.get("contact_name") or row.get("account_name") or row.get("category_name")
    log_activity(
        user_id,
        action="created",
        entity_type="transaction",
        entity_id=row["id"],
        title=f"Added {row['type']} {paise_to_rupees(row['amount_paise']):.2f}",
        detail=who,
        amount_paise=row["amount_paise"],
    )
    return row


def update_transaction(user_id: str, txn_id: str, data: dict) -> dict | None:
    clean: dict = {}
    if data.get("type") is not None:
        clean["type"] = data["type"]
    if data.get("amount_rupees") is not None:
        clean["amount"] = rupees_to_paise(data["amount_rupees"])
    if data.get("txn_date") is not None:
        clean["txn_date"] = data["txn_date"].isoformat()
    if "note" in data:
        clean["note"] = data["note"]
    if "contact_id" in data:
        clean["contact_id"] = str(data["contact_id"]) if data["contact_id"] else None
    if "account_id" in data:
        clean["account_id"] = str(data["account_id"]) if data["account_id"] else None
    if "category_id" in data:
        clean["category_id"] = str(data["category_id"]) if data["category_id"] else None

    if not clean:
        return get_transaction(user_id, txn_id)

    sb = get_service_client()
    res = (
        sb.table("transactions")
        .update(clean)
        .eq("user_id", user_id)
        .eq("id", txn_id)
        .execute()
    )
    if not res.data:
        return None
    contacts, accounts, categories = _lookup_maps(user_id)
    row = _enrich(res.data[0], contacts, accounts, categories)
    log_activity(
        user_id,
        action="updated",
        entity_type="transaction",
        entity_id=txn_id,
        title=f"Updated {row['type']} {paise_to_rupees(row['amount_paise']):.2f}",
        detail=row.get("contact_name") or row.get("note"),
        amount_paise=row["amount_paise"],
    )
    return row


def delete_transaction(user_id: str, txn_id: str) -> bool:
    existing = get_transaction(user_id, txn_id)
    sb = get_service_client()
    res = (
        sb.table("transactions")
        .delete()
        .eq("user_id", user_id)
        .eq("id", txn_id)
        .execute()
    )
    ok = bool(res.data)
    if ok and existing:
        log_activity(
            user_id,
            action="deleted",
            entity_type="transaction",
            entity_id=txn_id,
            title=f"Deleted {existing['type']} {paise_to_rupees(existing['amount_paise']):.2f}",
            detail=existing.get("contact_name") or existing.get("note"),
            amount_paise=existing["amount_paise"],
        )
    return ok


def settle_transaction(user_id: str, txn_id: str) -> dict | None:
    sb = get_service_client()
    res = (
        sb.table("transactions")
        .update({"settled_at": datetime.now(timezone.utc).isoformat()})
        .eq("user_id", user_id)
        .eq("id", txn_id)
        .execute()
    )
    if not res.data:
        return None
    contacts, accounts, categories = _lookup_maps(user_id)
    row = _enrich(res.data[0], contacts, accounts, categories)
    log_activity(
        user_id,
        action="settled",
        entity_type="transaction",
        entity_id=txn_id,
        title=f"Settled {row['type']} {paise_to_rupees(row['amount_paise']):.2f}",
        detail=row.get("contact_name"),
        amount_paise=row["amount_paise"],
    )
    return row
