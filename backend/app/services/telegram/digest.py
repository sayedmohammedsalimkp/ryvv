"""Build digest / balance / contacts cards (HTML)."""

from __future__ import annotations

from app.services.contacts import list_contacts
from app.services.dashboard import dashboard_summary
from app.services.telegram.formatters import (
    SEP,
    bold,
    card,
    esc,
    header,
    inr,
    italic,
    kv,
    ledger_row,
    plain_title,
)


def balance_text(user_id: str) -> str:
    d = dashboard_summary(user_id)
    w = 18
    return "\n".join(
        [
            plain_title("Balance sheet"),
            SEP,
            ledger_row("Total balance", inr(d["total_balance_paise"]), width=w),
            ledger_row("Cash on hand", inr(d["on_hand_paise"]), width=w),
            ledger_row("Bank / accounts", inr(d["accounts_balance_paise"]), width=w),
            SEP,
            ledger_row("Receivable (get)", inr(d["you_will_get_paise"]), width=w),
            ledger_row("Payable (give)", inr(d["you_will_give_paise"]), width=w),
            SEP,
            ledger_row("Month income", inr(d["month_income_paise"]), width=w),
            ledger_row("Month expense", inr(d["month_expense_paise"]), width=w),
            ledger_row("Month net", inr(d["month_net_paise"]), width=w),
        ]
    )


def digest_text(user_id: str) -> str:
    d = dashboard_summary(user_id)
    top_get = d.get("get_contacts") or []
    top_give = d.get("give_contacts") or []

    body = "\n".join(
        [
            kv("On hand", inr(d["on_hand_paise"])),
            kv("Total", inr(d["total_balance_paise"])),
            kv("Month expense", inr(d["month_expense_paise"])),
            kv("Month net", inr(d["month_net_paise"])),
            kv("Will get", inr(d["you_will_get_paise"])),
            kv("Will give", inr(d["you_will_give_paise"])),
        ]
    )

    extras: list[str] = []
    if top_get:
        lines = ["<b>Top · you will get</b>"]
        for c in top_get[:5]:
            lines.append(f"  • {esc(c['name'])}  ·  {bold(inr(c['balance_paise']))}")
        extras.append("\n".join(lines))
    if top_give:
        lines = ["<b>Top · you will give</b>"]
        for c in top_give[:5]:
            lines.append(
                f"  • {esc(c['name'])}  ·  {bold(inr(abs(c['balance_paise'])))}"
            )
        extras.append("\n".join(lines))

    return card(header("Daily digest", "Quick money snapshot"), body, *extras)


def contacts_text(user_id: str, *, mode: str = "all") -> str:
    rows = list_contacts(user_id)
    if mode == "get":
        rows = [c for c in rows if c["balance_paise"] > 0]
        title = "Receivables"
    elif mode == "give":
        rows = [c for c in rows if c["balance_paise"] < 0]
        title = "Payables"
    else:
        title = "Party balances"

    if not rows:
        return card(plain_title(title), SEP, italic("No one in this list."))

    lines = [plain_title(title), SEP]
    for c in rows[:30]:
        bal = int(c["balance_paise"])
        name = esc(c["name"])
        if bal > 0:
            lines.append(f"{name}    {bold('+' + inr(bal))}   (receivable)")
        elif bal < 0:
            lines.append(f"{name}    {bold('−' + inr(abs(bal)))}   (payable)")
        else:
            lines.append(f"{name}    {bold(inr(0))}       (settled)")
    if len(rows) > 30:
        lines.append(SEP)
        lines.append(italic(f"+{len(rows) - 30} more"))
    return "\n".join(lines)


def status_text(link: dict) -> str:
    uname = link.get("telegram_username")
    handle = f"@{uname}" if uname else "—"
    digest = "On" if link.get("digest_enabled") else "Off"
    alert = inr(int(link.get("alert_expense_paise") or 500000))
    return card(
        header("Status", "Telegram link"),
        "\n".join(
            [
                kv("Account", handle),
                kv("Morning digest", digest),
                kv("Expense alert ≥", alert),
            ]
        ),
        italic("All set with RYVV"),
    )
