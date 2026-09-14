from app.db.supabase import get_service_client
from app.services.activity import log_activity
from app.services.balances import (
    account_balance_paise,
    account_balances_map,
    fetch_balance_txns,
    paise_to_rupees,
    rupees_to_paise,
)


def list_accounts(user_id: str) -> list[dict]:
    sb = get_service_client()
    res = sb.table("accounts").select("*").eq("user_id", user_id).order("name").execute()
    rows = res.data or []
    bals = account_balances_map(rows, fetch_balance_txns(user_id))
    out = []
    for a in rows:
        out.append(
            {
                **a,
                "opening_balance_paise": int(a.get("opening_balance") or 0),
                "balance_paise": bals.get(a["id"], 0),
            }
        )
    return out


def create_account(user_id: str, data: dict) -> dict:
    sb = get_service_client()
    payload = {
        "user_id": user_id,
        "name": data["name"],
        "type": data.get("type") or "upi",
        "opening_balance": rupees_to_paise(data.get("opening_balance_rupees") or 0),
    }
    res = sb.table("accounts").insert(payload).execute()
    a = res.data[0]
    log_activity(
        user_id,
        action="created",
        entity_type="account",
        entity_id=a["id"],
        title=f"Added account {a['name']}",
        detail=a.get("type"),
        amount_paise=int(a.get("opening_balance") or 0) or None,
    )
    return {
        **a,
        "opening_balance_paise": int(a["opening_balance"]),
        "balance_paise": account_balance_paise(user_id, a),
    }


def update_account(user_id: str, account_id: str, data: dict) -> dict | None:
    clean: dict = {}
    if data.get("name") is not None:
        clean["name"] = data["name"]
    if data.get("type") is not None:
        clean["type"] = data["type"]
    if data.get("opening_balance_rupees") is not None:
        clean["opening_balance"] = rupees_to_paise(data["opening_balance_rupees"])
    sb = get_service_client()
    if not clean:
        rows = list_accounts(user_id)
        return next((a for a in rows if a["id"] == account_id), None)
    res = (
        sb.table("accounts")
        .update(clean)
        .eq("user_id", user_id)
        .eq("id", account_id)
        .execute()
    )
    if not res.data:
        return None
    a = res.data[0]
    log_activity(
        user_id,
        action="updated",
        entity_type="account",
        entity_id=account_id,
        title=f"Updated account {a['name']}",
    )
    return {
        **a,
        "opening_balance_paise": int(a["opening_balance"]),
        "balance_paise": account_balance_paise(user_id, a),
    }


def delete_account(user_id: str, account_id: str) -> bool:
    sb = get_service_client()
    existing = (
        sb.table("accounts")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", account_id)
        .limit(1)
        .execute()
    )
    row = (existing.data or [None])[0]
    if not row:
        return False
    bal = account_balance_paise(user_id, row)
    # Move linked txns to On hand (clear account_id)
    sb.table("transactions").update({"account_id": None}).eq(
        "user_id", user_id
    ).eq("account_id", account_id).execute()
    sb.table("accounts").delete().eq("user_id", user_id).eq("id", account_id).execute()
    log_activity(
        user_id,
        action="deleted",
        entity_type="account",
        entity_id=account_id,
        title=f"Deleted account {row['name']} → On hand",
        detail=row.get("type"),
        amount_paise=bal or None,
        meta={"moved_to": "on_hand"},
    )
    return True


def list_categories(user_id: str, kind: str | None = None) -> list[dict]:
    sb = get_service_client()
    q = sb.table("categories").select("*").eq("user_id", user_id).order("name")
    if kind:
        q = q.eq("kind", kind)
    return q.execute().data or []


def create_category(user_id: str, data: dict) -> dict:
    sb = get_service_client()
    res = (
        sb.table("categories")
        .insert(
            {
                "user_id": user_id,
                "name": data["name"],
                "kind": data["kind"],
                "is_system": False,
            }
        )
        .execute()
    )
    return res.data[0]
