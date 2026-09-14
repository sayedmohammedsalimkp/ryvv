from app.db.supabase import execute_retry, get_service_client

CONTACT_TYPES = {"gave", "received", "borrowed", "lent", "settle"}


def _execute_retry(build, attempts: int = 3):
    return execute_retry(build, attempts=attempts)


def fetch_balance_txns(user_id: str) -> list[dict]:
    sb = get_service_client()
    res = _execute_retry(
        lambda: sb.table("transactions")
        .select("type, amount, account_id, contact_id, settled_at")
        .eq("user_id", user_id)
    )
    return res.data or []


def _account_delta(typ: str, amt: int) -> int:
    if typ in ("income", "received", "borrowed"):
        return amt
    if typ in ("expense", "gave", "lent"):
        return -amt
    return 0


def _contact_delta(typ: str, amt: int) -> int:
    if typ in ("lent", "gave"):
        return amt
    if typ in ("borrowed", "received", "settle"):
        return -amt
    return 0


def account_balances_map(accounts: list[dict], txns: list[dict]) -> dict[str, int]:
    out = {a["id"]: int(a.get("opening_balance") or 0) for a in accounts}
    for t in txns:
        aid = t.get("account_id")
        if not aid or aid not in out:
            continue
        out[aid] += _account_delta(t["type"], int(t["amount"]))
    return out


def contact_balances_map(contact_ids: list[str], txns: list[dict]) -> dict[str, int]:
    wanted = set(contact_ids)
    out = {cid: 0 for cid in contact_ids}
    for t in txns:
        cid = t.get("contact_id")
        if not cid or cid not in wanted:
            continue
        if t.get("settled_at"):
            continue
        typ = t["type"]
        if typ not in CONTACT_TYPES:
            continue
        out[cid] += _contact_delta(typ, int(t["amount"]))
    return out


def on_hand_from_txns(txns: list[dict]) -> int:
    bal = 0
    for t in txns:
        if t.get("account_id"):
            continue
        bal += _account_delta(t["type"], int(t["amount"]))
    return bal


def contact_balance_paise(user_id: str, contact_id: str) -> int:
    """Positive => they owe you. Negative => you owe them."""
    txns = fetch_balance_txns(user_id)
    return contact_balances_map([contact_id], txns).get(contact_id, 0)


def account_balance_paise(user_id: str, account: dict) -> int:
    txns = fetch_balance_txns(user_id)
    return account_balances_map([account], txns).get(account["id"], 0)


def on_hand_paise(user_id: str) -> int:
    """Cash not linked to any account (income/expense/people txns without account_id)."""
    return on_hand_from_txns(fetch_balance_txns(user_id))


def total_balance_paise(user_id: str) -> int:
    sb = get_service_client()
    accounts = (
        _execute_retry(lambda: sb.table("accounts").select("*").eq("user_id", user_id)).data
        or []
    )
    txns = fetch_balance_txns(user_id)
    accounts_total = sum(account_balances_map(accounts, txns).values())
    return accounts_total + on_hand_from_txns(txns)


def rupees_to_paise(rupees: float) -> int:
    return int(round(float(rupees) * 100))


def paise_to_rupees(paise: int) -> float:
    return round(int(paise) / 100.0, 2)
