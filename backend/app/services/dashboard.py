from calendar import month_name, monthrange
from datetime import date

from app.db.supabase import get_service_client
from app.services.balances import (
    account_balances_map,
    contact_balances_map,
    fetch_balance_txns,
    on_hand_from_txns,
)
from app.services.activity import list_activity
from app.services.contacts import list_contacts
from app.services.transactions import list_transactions


def _shift_month(d: date, delta: int) -> date:
    """Return first day of month shifted by delta months."""
    y, m = d.year, d.month + delta
    while m < 1:
        m += 12
        y -= 1
    while m > 12:
        m -= 12
        y += 1
    return date(y, m, 1)


def _month_end(y: int, m: int) -> date:
    return date(y, m, monthrange(y, m)[1])


def _sum_type(txns: list[dict], typ: str) -> int:
    return sum(int(t["amount_paise"]) for t in txns if t["type"] == typ)


def _txn_date(t: dict) -> date | None:
    raw = t.get("txn_date")
    if not raw:
        return None
    if isinstance(raw, date):
        return raw
    try:
        return date.fromisoformat(str(raw)[:10])
    except ValueError:
        return None


def dashboard_summary(user_id: str) -> dict:
    today = date.today()
    month_start = today.replace(day=1)
    oldest = _shift_month(month_start, -5)

    sb = get_service_client()
    accounts_raw = (
        sb.table("accounts").select("*").eq("user_id", user_id).order("name").execute()
    )
    accounts_rows = accounts_raw.data or []
    # One txn pull for all account + on-hand balances (avoids N+1 / Supabase 504)
    bal_txns = fetch_balance_txns(user_id)
    bal_by_account = account_balances_map(accounts_rows, bal_txns)
    accounts = []
    accounts_total = 0
    for a in accounts_rows:
        bal = bal_by_account.get(a["id"], 0)
        accounts_total += bal
        accounts.append(
            {
                "id": a["id"],
                "name": a["name"],
                "type": a["type"],
                "balance_paise": bal,
            }
        )

    hand = on_hand_from_txns(bal_txns)
    total = accounts_total + hand

    # One window fetch for all month tiles (avoids 6× Supabase round-trips)
    window_txns = list_transactions(
        user_id, date_from=oldest, date_to=today, limit=5000
    )

    months: list[dict] = []
    for i in range(0, 6):
        start = _shift_month(month_start, -i)
        end = _month_end(start.year, start.month)
        if end > today:
            end = today
        month_txns = [
            t
            for t in window_txns
            if (d := _txn_date(t)) is not None and start <= d <= end
        ]
        income = _sum_type(month_txns, "income")
        expense = _sum_type(month_txns, "expense")
        months.append(
            {
                "year": start.year,
                "month": start.month,
                "label": f"{month_name[start.month][:3]} {start.year}",
                "is_current": start.year == today.year and start.month == today.month,
                "income_paise": income,
                "expense_paise": expense,
                "net_paise": income - expense,
            }
        )

    cur_txns = [
        t
        for t in window_txns
        if (d := _txn_date(t)) is not None and month_start <= d <= today
    ]
    month_income = _sum_type(cur_txns, "income")
    month_expense = _sum_type(cur_txns, "expense")

    contacts = list_contacts(user_id, txns=bal_txns)
    get_contacts = [c for c in contacts if int(c.get("balance_paise") or 0) > 0]
    give_contacts = [c for c in contacts if int(c.get("balance_paise") or 0) < 0]
    get_contacts.sort(key=lambda c: c["balance_paise"], reverse=True)
    give_contacts.sort(key=lambda c: c["balance_paise"])

    you_will_get = sum(int(c["balance_paise"]) for c in get_contacts)
    you_will_give = sum(abs(int(c["balance_paise"])) for c in give_contacts)

    unsettled = [c for c in contacts if c.get("balance_paise")]
    unsettled.sort(key=lambda c: abs(c["balance_paise"]), reverse=True)
    recent = list_transactions(user_id, limit=10)
    activity = list_activity(user_id, limit=40)

    return {
        "total_balance_paise": total,
        "accounts_balance_paise": accounts_total,
        "on_hand_paise": hand,
        "accounts": accounts,
        "month_income_paise": month_income,
        "month_expense_paise": month_expense,
        "month_net_paise": month_income - month_expense,
        "months": months,
        "you_will_get_paise": you_will_get,
        "you_will_give_paise": you_will_give,
        "get_contacts": get_contacts[:20],
        "give_contacts": give_contacts[:20],
        "unsettled_contacts": unsettled[:8],
        "contacts": contacts,
        "recent": recent,
        "activity": activity,
    }
