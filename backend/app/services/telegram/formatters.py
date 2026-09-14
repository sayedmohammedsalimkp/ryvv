"""Pretty Telegram message formatting (HTML)."""

from __future__ import annotations

import html

from app.services.balances import paise_to_rupees

SEP = "────────"


TYPE_LABELS = {
    "gave": "Gave",
    "received": "Got",
    "got": "Got",
    "expense": "Expense",
    "income": "Income",
    "borrowed": "Borrowed",
    "lent": "Lent",
    "settle": "Settle",
}


def esc(value: object) -> str:
    return html.escape(str(value if value is not None else ""), quote=False)


def inr(paise: int) -> str:
    return f"₹{paise_to_rupees(int(paise)):,.2f}"


def inr_rupees(rupees: float) -> str:
    return f"₹{float(rupees):,.2f}"


def type_label(txn_type: str) -> str:
    key = (txn_type or "").strip().lower()
    return TYPE_LABELS.get(key, (txn_type or "").strip().title() or "—")


def bold(text: str) -> str:
    return f"<b>{esc(text)}</b>"


def code(text: str) -> str:
    return f"<code>{esc(text)}</code>"


def italic(text: str) -> str:
    return f"<i>{esc(text)}</i>"


def header(title: str, subtitle: str | None = None) -> str:
    """Branded title — welcome / link screens only."""
    lines = [f"<b>RYVV · {esc(title)}</b>"]
    if subtitle:
        lines.append(italic(subtitle))
    lines.append(SEP)
    return "\n".join(lines)


def plain_title(title: str) -> str:
    return f"<b>{esc(title)}</b>"


def row(label: str, value: str, *, strong: bool = False) -> str:
    v = bold(value) if strong else esc(value)
    return f"{esc(label)}\n{v}"


def kv(label: str, value: str) -> str:
    return f"  {esc(label)}  ·  {bold(value)}"


def ledger_row(label: str, value: str, *, width: int = 9) -> str:
    pad = " " * max(1, width - len(str(label)))
    return f"{esc(label)}{pad}{bold(value)}"


def card(*sections: str) -> str:
    parts = [s for s in sections if s]
    return "\n\n".join(parts)


def help_text() -> str:
    return card(
        header("Help", "Chat ledger · Hindi / English / voice"),
        "<b>Log money</b>\n"
        f"{code('Gave Amit 500 lunch')}\n"
        f"{code('Got Ravi 200')}\n"
        f"{code('Expense 120 chai')}\n"
        f"{code('Income 5000 salary')}",
        "<b>Reports</b>\n"
        f"{code('report')}  → pick Today / Week / Month\n"
        f"{code('this month report')}\n"
        f"{code('Rahul report past 2 days')}",
        "<b>Commands</b>\n"
        f"{code('/balance')}  totals &amp; on hand\n"
        f"{code('/contacts')}  all people\n"
        f"{code('/get')}  ·  {code('/give')}\n"
        f"{code('/settle Name')}  → ₹0\n"
        f"{code('/report')}  PDF\n"
        f"{code('/digest')}  ·  {code('/remind …')}\n"
        f"{code('/status')}  ·  {code('/unlink')}",
        italic("Confirms before save. Voice notes OK."),
    )


def greet_text(name: str | None = None) -> str:
    who = f" {esc(name)}" if name else ""
    return card(
        header("Hi there", f"Welcome back{who}"),
        "What do you want to do?",
        italic("Tap a button, or just chat — “Gave Rahul 500”."),
    )


def report_ask_period(contact: str | None = None) -> str:
    who = bold(contact) if contact else "all transactions"
    return card(
        plain_title("Which period?"),
        f"PDF for {who}",
        italic("Pick a range below, or say “past 3 days”."),
    )


def report_confirm_contact(query: str, name: str) -> str:
    return card(
        plain_title("Did you mean…?"),
        f"You said {bold(query)}.\nIs this {bold(name)}?",
        italic("Confirm, or pick another contact."),
    )


def report_pick_contact(query: str) -> str:
    return card(
        plain_title("Which contact?"),
        f"Close matches for {bold(query)}",
        italic("Pick one below"),
    )


def preparing_pdf(name: str, period_label: str | None = None) -> str:
    extra = f"\n{esc(period_label)}" if period_label else ""
    return card(plain_title("Building PDF…"), f"{bold(name)}{extra}")



def welcome_linked() -> str:
    return card(
        header("Linked", "You’re connected"),
        "Money chat is ready.\nTry " + code("Gave Amit 500") + " or /help",
    )


def welcome_start() -> str:
    return card(
        header("Welcome"),
        "1. Open <b>RYVV app → Profile → Telegram</b>\n"
        "2. Generate a 6-digit code\n"
        "3. Send here:\n"
        + code("/start 123456"),
        italic("Code expires in 15 minutes."),
    )


def not_linked() -> str:
    return card(
        header("Not linked"),
        "Open <b>RYVV → Profile → Telegram</b>, copy code, then:\n"
        + code("/start 123456"),
    )


def listening() -> str:
    return "🎙 Listening…"


def heard(text: str) -> str:
    return f"🎙 “{esc(text)}”"


def voice_failed(err: object) -> str:
    return card(
        plain_title("Voice failed"),
        esc(err),
        "Try text: " + code("Gave Amit 500"),
    )


def confirm_txn(
    txn_type: str,
    amount_rupees: float,
    *,
    contact: str | None = None,
    note: str | None = None,
    create_contact: bool = False,
) -> str:
    label = type_label(txn_type)
    amount = inr_rupees(amount_rupees)

    if create_contact:
        action = f"{label} {amount}"
        if note:
            action = f"{action} · {note}"
        lines = [
            plain_title("Unknown contact"),
            SEP,
            ledger_row("Name", contact or "—"),
            ledger_row("Action", action),
            SEP,
            "Create contact and post?",
        ]
        return "\n".join(lines)

    lines = [
        plain_title("Save this?"),
        SEP,
        ledger_row("Type", label),
    ]
    if contact:
        lines.append(ledger_row("Contact", contact))
    lines.append(ledger_row("Amount", amount))
    if note:
        lines.append(ledger_row("Note", note))
    lines.append(SEP)
    lines.append("Confirm to save")
    return "\n".join(lines)


def pick_contact(amount_rupees: float, intent: str) -> str:
    if intent == "settle" or amount_rupees <= 0:
        return card(
            plain_title("Which contact?"),
            italic("Pick who to settle"),
        )
    return card(
        plain_title("Which contact?"),
        ledger_row("Action", type_label(intent)),
        ledger_row("Amount", inr_rupees(amount_rupees)),
        italic("Pick one below"),
    )


def settle_ask(name: str, bal_paise: int) -> str:
    side = "receivable" if bal_paise > 0 else "payable"
    return "\n".join(
        [
            plain_title("Settlement"),
            SEP,
            ledger_row("Party", name),
            ledger_row("Open", f"{inr(abs(bal_paise))} {side}"),
            ledger_row("Result", "₹0.00"),
            SEP,
            "Confirm settlement?",
        ]
    )


def settle_done(name: str) -> str:
    return card(plain_title("Settled"), f"{bold(name)} · balance {bold('₹0.00')}")


def already_settled(name: str) -> str:
    return card(plain_title("Already settled"), f"{bold(name)} · {bold('₹0.00')}")


def saved_txn(
    txn_type: str,
    amount_paise: int,
    who: str = "",
    note: str | None = None,
) -> str:
    parts = [type_label(txn_type)]
    if who:
        parts.append(who)
    parts.append(inr(amount_paise))
    line = " · ".join(parts)
    body = bold("✓ Saved") + "\n" + esc(line)
    if note:
        body += f"\n{esc(note)}"
    return body


def expense_alert(amount_paise: int) -> str:
    return card(
        header("Alert"),
        f"Big expense {bold(inr(amount_paise))}",
    )


def reminder_set(msg: str, due: str) -> str:
    return card(
        header("Reminder set"),
        esc(msg),
        kv("Due (UTC)", due),
    )


def reminder_fire(msg: str) -> str:
    return card(header("Reminder"), esc(msg))


def cancelled() -> str:
    return f"<b>Cancelled</b>\n{italic('Nothing changed')}"


def expired() -> str:
    return card(header("Expired"), "Try again — confirm window closed.")


def unlinked() -> str:
    return card(
        header("Unlinked"),
        "Telegram disconnected from RYVV.\n"
        "Link again anytime: " + code("/start CODE"),
    )


def unlink_ask() -> str:
    return card(
        header("Unlink?"),
        "Remove Telegram from this RYVV account?",
    )


def error_msg(text: str) -> str:
    return card(header("Oops"), esc(text))


def info(text: str) -> str:
    return esc(text)


def unknown_hint(hint: str | None = None) -> str:
    return card(
        header("Didn’t catch that"),
        esc(hint or "Try: Gave Amit 500"),
        "Or " + code("/help"),
    )
