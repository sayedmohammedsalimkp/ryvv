from app.db.supabase import get_service_client

CONTACT_TYPES = {"gave", "received", "borrowed", "lent", "settle"}


def contact_balance_paise(user_id: str, contact_id: str) -> int:
    """Positive => they owe you. Negative => you owe them."""
    sb = get_service_client()
    res = (
        sb.table("transactions")
        .select("type, amount, settled_at")
        .eq("user_id", user_id)
        .eq("contact_id", contact_id)
        .in_("type", list(CONTACT_TYPES))
        .execute()
    )
    bal = 0
    for t in res.data or []:
        if t.get("settled_at"):
            continue
        typ = t["type"]
        amt = int(t["amount"])
        if typ in ("lent", "gave"):
            bal += amt
        elif typ in ("borrowed", "received"):
            bal -= amt
        elif typ == "settle":
            # settle amount reduces absolute outstanding toward zero from payer side:
            # positive settle means contact paid you (reduces what they owe)
            bal -= amt
    return bal


def account_balance_paise(user_id: str, account: dict) -> int:
    sb = get_service_client()
    opening = int(account.get("opening_balance") or 0)
    res = (
        sb.table("transactions")
        .select("type, amount")
        .eq("user_id", user_id)
        .eq("account_id", account["id"])
        .execute()
    )
    bal = opening
    for t in res.data or []:
        typ = t["type"]
        amt = int(t["amount"])
        if typ in ("income", "received", "borrowed"):
            bal += amt
        elif typ in ("expense", "gave", "lent"):
            bal -= amt
        # settle does not change account unless linked — treat as outflow/inflow via amount sign convention:
        # settle with account means money moved to clear debt → no personal net change if between people only
    return bal


def on_hand_paise(user_id: str) -> int:
    """Cash not linked to any account (income/expense/people txns without account_id)."""
    sb = get_service_client()
    res = (
        sb.table("transactions")
        .select("type, amount, account_id")
        .eq("user_id", user_id)
        .is_("account_id", "null")
        .execute()
    )
    bal = 0
    for t in res.data or []:
        typ = t["type"]
        amt = int(t["amount"])
        if typ in ("income", "received", "borrowed"):
            bal += amt
        elif typ in ("expense", "gave", "lent"):
            bal -= amt
    return bal


def total_balance_paise(user_id: str) -> int:
    sb = get_service_client()
    accounts = sb.table("accounts").select("*").eq("user_id", user_id).execute()
    accounts_total = sum(account_balance_paise(user_id, a) for a in (accounts.data or []))
    return accounts_total + on_hand_paise(user_id)


def rupees_to_paise(rupees: float) -> int:
    return int(round(float(rupees) * 100))


def paise_to_rupees(paise: int) -> float:
    return round(int(paise) / 100.0, 2)
