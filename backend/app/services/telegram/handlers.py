"""Telegram update handlers — commands, NLU, confirms, voice, reports."""

from __future__ import annotations

import logging
import re
from datetime import date, datetime, timedelta, timezone
from typing import Any

from app.services import contacts as contact_service
from app.services import export as export_service
from app.services import transactions as txn_service
from app.services.telegram import api as tg
from app.services.telegram import links as link_service
from app.services.telegram import pending as pending_service
from app.services.telegram import reminders as reminder_service
from app.services.telegram.digest import (
    balance_text,
    contacts_text,
    digest_text,
    status_text,
)
from app.services.telegram.formatters import (
    already_settled,
    cancelled,
    confirm_txn,
    error_msg,
    expired,
    greet_text,
    heard,
    help_text,
    info,
    listening,
    not_linked,
    pick_contact,
    reminder_set,
    report_ask_period,
    report_confirm_contact,
    report_pick_contact,
    saved_txn,
    settle_ask,
    settle_done,
    unknown_hint,
    unlink_ask,
    unlinked,
    voice_failed,
    welcome_linked,
    welcome_start,
    expense_alert,
    preparing_pdf,
)
from app.services.telegram.groq_nlu import parse_message, transcribe_audio
from app.services.telegram.matching import match_contacts
from app.services.telegram.periods import period_ready, resolve_period
from app.services.users import get_user

log = logging.getLogger("ryvv.telegram")

INTENT_TO_TXN = {
    "gave": "gave",
    "got": "received",
    "expense": "expense",
    "income": "income",
    "borrowed": "borrowed",
    "lent": "lent",
}

PERIOD_CODES = ("today", "week", "month", "all")


def process_update(update: dict) -> None:
    if update.get("callback_query"):
        _handle_callback(update["callback_query"])
        return
    msg = update.get("message") or update.get("edited_message")
    if not msg:
        return
    chat = msg.get("chat") or {}
    user = msg.get("from") or {}
    chat_id = chat.get("id")
    tg_uid = user.get("id")
    if chat_id is None or tg_uid is None:
        return

    text = (msg.get("text") or "").strip()
    is_voice = bool(msg.get("voice") or msg.get("audio"))
    if is_voice:
        tg.send_message(chat_id, listening())
        try:
            heard_text = _voice_to_text(msg)
        except Exception as e:
            log.exception("voice fail")
            tg.send_message(chat_id, voice_failed(e))
            return
        if not heard_text:
            tg.send_message(
                chat_id, error_msg("Couldn't hear that. Speak clearly or send text.")
            )
            return
        tg.send_message(chat_id, heard(heard_text))
        text = heard_text

    if not text:
        tg.send_message(chat_id, unknown_hint("Send text or voice."))
        return

    # /start CODE or bare /start
    if text.lower().startswith("/start"):
        _cmd_start(chat_id, tg_uid, user, text)
        return

    link = link_service.get_by_telegram(tg_uid)
    if not link:
        if text.lower().startswith("/link"):
            parts = text.split(maxsplit=1)
            code = parts[1].strip() if len(parts) > 1 else ""
            _try_link(chat_id, tg_uid, user, code)
            return
        tg.send_message(chat_id, not_linked())
        return

    user_id = link["user_id"]
    low = text.lower().strip()

    # slash commands without NLU
    if low.startswith("/help"):
        tg.send_message(chat_id, help_text())
        return
    if low.startswith("/balance"):
        tg.send_message(chat_id, balance_text(user_id))
        return
    if low.startswith("/contacts"):
        tg.send_message(chat_id, contacts_text(user_id))
        return
    if low.startswith("/get"):
        tg.send_message(chat_id, contacts_text(user_id, mode="get"))
        return
    if low.startswith("/give"):
        tg.send_message(chat_id, contacts_text(user_id, mode="give"))
        return
    if low.startswith("/digest"):
        tg.send_message(chat_id, digest_text(user_id))
        return
    if low.startswith("/status"):
        tg.send_message(chat_id, status_text(link))
        return
    if low.startswith("/unlink"):
        _ask_unlink(chat_id, tg_uid, user_id)
        return
    if low.startswith("/settle"):
        name = text.split(maxsplit=1)[1] if len(text.split(maxsplit=1)) > 1 else ""
        _ask_settle(chat_id, tg_uid, user_id, name)
        return
    if low.startswith("/report"):
        rest = text.split(maxsplit=1)[1] if len(text.split(maxsplit=1)) > 1 else ""
        parsed = parse_message(
            f"report {rest}".strip() if rest else "report",
            today=date.today().isoformat(),
            contacts=[c["name"] for c in contact_service.list_contacts(user_id)],
        )
        _handle_report(chat_id, tg_uid, user_id, parsed)
        return
    if low.startswith("/remind"):
        rest = text.split(maxsplit=1)[1] if len(text.split(maxsplit=1)) > 1 else ""
        _handle_remind_text(chat_id, tg_uid, user_id, rest)
        return
    if low.startswith("/link"):
        tg.send_message(chat_id, info("Already linked. Use /status or /unlink"))
        return

    _handle_nlu(chat_id, tg_uid, user_id, link, text)


def _voice_to_text(msg: dict) -> str:
    media = msg.get("voice") or msg.get("audio")
    if not media:
        return ""
    meta = tg.get_file(media["file_id"])
    path = (meta.get("result") or {}).get("file_path")
    if not path:
        raise RuntimeError("Telegram file path missing")
    raw = tg.download_file(path)
    if not raw:
        raise RuntimeError("Empty download from Telegram")
    log.info("voice bytes=%s path=%s", len(raw), path)
    return transcribe_audio(raw, filename=path.split("/")[-1] or "voice.ogg")


def _cmd_start(chat_id: int, tg_uid: int, user: dict, text: str) -> None:
    parts = text.split(maxsplit=1)
    payload = parts[1].strip() if len(parts) > 1 else ""
    if payload.lower().startswith("link_"):
        payload = payload[5:]
    if payload and re.fullmatch(r"\d{6}", payload):
        _try_link(chat_id, tg_uid, user, payload)
        return
    link = link_service.get_by_telegram(tg_uid)
    if link:
        _send_greet(chat_id, link["user_id"])
        return
    tg.send_message(chat_id, welcome_start())


def _try_link(chat_id: int, tg_uid: int, user: dict, code: str) -> None:
    if not code:
        tg.send_message(chat_id, error_msg("Send /start 123456 with your code."))
        return
    row = link_service.link_with_code(
        code,
        telegram_user_id=tg_uid,
        telegram_chat_id=chat_id,
        telegram_username=user.get("username"),
    )
    if not row:
        tg.send_message(
            chat_id, error_msg("Code invalid or expired. Generate new in Profile.")
        )
        return
    tg.send_message(chat_id, welcome_linked())
    _send_greet(chat_id, row["user_id"])


def _menu_keyboard() -> dict:
    return tg.inline_keyboard(
        [
            [
                tg.btn("💰 Balance", "menu:balance"),
                tg.btn("📄 Report", "menu:report"),
            ],
            [
                tg.btn("👥 Contacts", "menu:contacts"),
                tg.btn("📥 You get", "menu:get"),
            ],
            [
                tg.btn("📤 You give", "menu:give"),
                tg.btn("❓ Help", "menu:help"),
            ],
        ]
    )


def _period_keyboard(pid: str | None = None) -> dict:
    """Period picker. With pid → pending holds contact; without → overall report."""
    def data(code: str) -> str:
        return f"rper:{code}:{pid}" if pid else f"rper:{code}"

    return tg.inline_keyboard(
        [
            [
                tg.btn("Today (24h)", data("today")),
                tg.btn("This week", data("week")),
            ],
            [
                tg.btn("This month", data("month")),
                tg.btn("All time", data("all")),
            ],
            [tg.btn("✕ Cancel", f"no:{pid}" if pid else "menu:cancel")],
        ]
    )


def _send_greet(chat_id: int, user_id: str) -> None:
    user = get_user(user_id) or {}
    first = (user.get("full_name") or "").split()[0] if user.get("full_name") else None
    tg.send_message(chat_id, greet_text(first), reply_markup=_menu_keyboard())


def _handle_nlu(
    chat_id: int, tg_uid: int, user_id: str, link: dict, text: str
) -> None:
    contacts = contact_service.list_contacts(user_id)
    names = [c["name"] for c in contacts]
    parsed = parse_message(text, today=date.today().isoformat(), contacts=names)
    intent = parsed.get("intent") or "unknown"

    if intent == "greet":
        _send_greet(chat_id, user_id)
        return
    if intent == "help":
        tg.send_message(chat_id, help_text())
        return
    if intent == "balance":
        tg.send_message(chat_id, balance_text(user_id))
        return
    if intent == "contacts":
        tg.send_message(chat_id, contacts_text(user_id))
        return
    if intent == "get_list":
        tg.send_message(chat_id, contacts_text(user_id, mode="get"))
        return
    if intent == "give_list":
        tg.send_message(chat_id, contacts_text(user_id, mode="give"))
        return
    if intent == "digest":
        tg.send_message(chat_id, digest_text(user_id))
        return
    if intent == "status":
        tg.send_message(chat_id, status_text(link))
        return
    if intent == "unlink":
        _ask_unlink(chat_id, tg_uid, user_id)
        return
    if intent == "settle":
        _ask_settle(chat_id, tg_uid, user_id, parsed.get("contact_name") or "")
        return
    if intent == "report":
        _handle_report(chat_id, tg_uid, user_id, parsed)
        return
    if intent == "remind":
        _handle_remind_parsed(chat_id, user_id, parsed)
        return
    if intent in INTENT_TO_TXN:
        _ask_confirm_txn(chat_id, tg_uid, user_id, contacts, parsed)
        return

    tg.send_message(chat_id, unknown_hint(parsed.get("reply_hint")))


def _match_contacts(contacts: list[dict], name: str | None) -> list[dict]:
    """Back-compat wrapper used by settle / txn confirm."""
    return match_contacts(contacts, name)["matches"]


# ─── Report flow ─────────────────────────────────────────────────────────────


def _handle_report(
    chat_id: int, tg_uid: int, user_id: str, parsed: dict
) -> None:
    contacts = contact_service.list_contacts(user_id)
    query = (parsed.get("contact_name") or "").strip() or None
    resolved = resolve_period(
        period=parsed.get("period"),
        period_days=parsed.get("period_days"),
        date_from=parsed.get("date_from"),
        date_to=parsed.get("date_to"),
    )

    # No contact named → overall statement (or ask period)
    if not query:
        if period_ready(resolved):
            _deliver_report(
                chat_id,
                user_id,
                contact=None,
                date_from=resolved["date_from"],
                date_to=resolved["date_to"],
                period_label=resolved["label"],
            )
            return
        tg.send_message(
            chat_id,
            report_ask_period(None),
            reply_markup=_period_keyboard(),
        )
        return

    result = match_contacts(contacts, query)
    matches = result["matches"]
    mode = result["mode"]

    if not matches:
        tg.send_message(
            chat_id,
            error_msg(
                f"No contact matching “{query}”. Try /contacts or check the spelling."
            ),
        )
        return

    if len(matches) > 1 or mode == "fuzzy":
        # Fuzzy single OR multiple → ask which one
        if len(matches) == 1 and mode == "fuzzy":
            c = matches[0]
            payload = {
                "contact_id": c["id"],
                "contact_name": c["name"],
                "query": query,
                "period": resolved.get("code"),
                "period_days": resolved.get("period_days"),
                "date_from": _iso(resolved.get("date_from")),
                "date_to": _iso(resolved.get("date_to")),
                "period_label": resolved.get("label"),
            }
            pid = pending_service.create_pending(
                tg_uid, user_id, "report_confirm", payload
            )
            rows = [
                [
                    tg.btn(f"✓ Yes, {c['name'][:20]}", f"ok:{pid}"),
                    tg.btn("✕ No", f"no:{pid}"),
                ]
            ]
            # Also offer other close contacts if any substring-like leftovers
            tg.send_message(
                chat_id,
                report_confirm_contact(query, c["name"]),
                reply_markup=tg.inline_keyboard(rows),
            )
            return

        pid = pending_service.create_pending(
            tg_uid,
            user_id,
            "report_pick",
            {
                "candidates": [
                    {"id": c["id"], "name": c["name"]} for c in matches[:5]
                ],
                "query": query,
                "period": resolved.get("code"),
                "period_days": resolved.get("period_days"),
                "date_from": _iso(resolved.get("date_from")),
                "date_to": _iso(resolved.get("date_to")),
                "period_label": resolved.get("label"),
            },
        )
        rows = [
            [tg.btn(f"· {c['name'][:26]}", f"pr:{pid}:{i}")]
            for i, c in enumerate(matches[:5])
        ]
        rows.append([tg.btn("✕ Cancel", f"no:{pid}")])
        tg.send_message(
            chat_id,
            report_pick_contact(query),
            reply_markup=tg.inline_keyboard(rows),
        )
        return

    # Exact / unique substring
    _continue_report_with_contact(
        chat_id, tg_uid, user_id, matches[0], resolved
    )


def _continue_report_with_contact(
    chat_id: int,
    tg_uid: int,
    user_id: str,
    contact: dict,
    resolved: dict,
) -> None:
    if period_ready(resolved):
        _deliver_report(
            chat_id,
            user_id,
            contact=contact,
            date_from=resolved["date_from"],
            date_to=resolved["date_to"],
            period_label=resolved["label"],
        )
        return

    pid = pending_service.create_pending(
        tg_uid,
        user_id,
        "report_period",
        {
            "contact_id": contact["id"],
            "contact_name": contact["name"],
        },
    )
    tg.send_message(
        chat_id,
        report_ask_period(contact["name"]),
        reply_markup=_period_keyboard(pid),
    )


def _iso(d: date | None) -> str | None:
    return d.isoformat() if d else None


def _deliver_report(
    chat_id: int,
    user_id: str,
    *,
    contact: dict | None,
    date_from: date | None,
    date_to: date | None,
    period_label: str | None,
) -> None:
    title = (contact or {}).get("name") or "All transactions"
    contact_id = (contact or {}).get("id")
    try:
        tg.send_message(chat_id, preparing_pdf(title, period_label))
        pdf = export_service.export_pdf(
            user_id,
            date_from=date_from,
            date_to=date_to,
            contact_id=contact_id,
        )
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        safe = re.sub(r"[^\w\-]+", "_", title)[:40]
        from app.services.telegram.formatters import bold, card, esc, plain_title

        caption = card(
            plain_title("Statement ready"),
            f"{bold(title)}"
            + (f"\n{esc(period_label)}" if period_label else ""),
        )
        tg.send_document(
            chat_id,
            f"RYVV-{safe}-{stamp}.pdf",
            pdf,
            caption=caption,
        )
    except Exception as e:
        log.exception("report fail")
        tg.send_message(chat_id, error_msg(f"Report failed: {e}"))


def _resolved_from_payload(payload: dict) -> dict:
    if payload.get("period_label") and (
        payload.get("period") or payload.get("date_from") or payload.get("date_to")
    ):
        # May already have label from earlier resolve — re-resolve for safety
        pass
    return resolve_period(
        period=payload.get("period"),
        period_days=payload.get("period_days"),
        date_from=payload.get("date_from"),
        date_to=payload.get("date_to"),
    )


# ─── Txn / settle (unchanged core) ────────────────────────────────────────────


def _ask_confirm_txn(
    chat_id: int,
    tg_uid: int,
    user_id: str,
    contacts: list[dict],
    parsed: dict,
) -> None:
    intent = parsed["intent"]
    txn_type = INTENT_TO_TXN[intent]
    amount = parsed.get("amount_rupees")
    if not amount or amount <= 0:
        tg.send_message(chat_id, error_msg("Need amount. Example: Gave Amit 500"))
        return

    contact_id = None
    contact_name = None
    if txn_type in {"gave", "received", "borrowed", "lent"}:
        result = match_contacts(contacts, parsed.get("contact_name"))
        matches = result["matches"]
        mode = result["mode"]
        if not matches:
            cname = (parsed.get("contact_name") or "").strip()
            if not cname:
                tg.send_message(
                    chat_id, error_msg("Which contact? Example: Gave Amit 500")
                )
                return
            pid = pending_service.create_pending(
                tg_uid,
                user_id,
                "confirm_txn",
                {
                    "type": txn_type,
                    "amount_rupees": amount,
                    "note": parsed.get("note"),
                    "txn_date": parsed.get("txn_date"),
                    "create_contact": cname,
                },
            )
            tg.send_message(
                chat_id,
                confirm_txn(
                    txn_type,
                    amount,
                    contact=cname,
                    note=parsed.get("note"),
                    create_contact=True,
                ),
                reply_markup=tg.btns_confirm(pid, ok="Create & save", cancel="Cancel"),
            )
            return
        if len(matches) > 1 or mode == "fuzzy":
            pid = pending_service.create_pending(
                tg_uid,
                user_id,
                "pick_contact",
                {
                    "type": txn_type,
                    "amount_rupees": amount,
                    "note": parsed.get("note"),
                    "txn_date": parsed.get("txn_date"),
                    "candidates": [
                        {"id": c["id"], "name": c["name"]} for c in matches[:5]
                    ],
                },
            )
            rows = [
                [tg.btn(f"· {c['name'][:26]}", f"pc:{pid}:{i}")]
                for i, c in enumerate(matches[:5])
            ]
            rows.append([tg.btn("✕ Cancel", f"no:{pid}")])
            tg.send_message(
                chat_id,
                pick_contact(amount, intent)
                if len(matches) > 1
                else report_confirm_contact(
                    parsed.get("contact_name") or "", matches[0]["name"]
                ),
                reply_markup=tg.inline_keyboard(rows),
            )
            return
        contact_id = matches[0]["id"]
        contact_name = matches[0]["name"]

    pid = pending_service.create_pending(
        tg_uid,
        user_id,
        "confirm_txn",
        {
            "type": txn_type,
            "amount_rupees": amount,
            "note": parsed.get("note"),
            "txn_date": parsed.get("txn_date"),
            "contact_id": contact_id,
            "contact_name": contact_name,
        },
    )
    tg.send_message(
        chat_id,
        confirm_txn(
            txn_type,
            amount,
            contact=contact_name,
            note=parsed.get("note"),
        ),
        reply_markup=tg.btns_confirm(pid),
    )


def _ask_settle(chat_id: int, tg_uid: int, user_id: str, name: str) -> None:
    contacts = contact_service.list_contacts(user_id)
    result = match_contacts(contacts, name)
    matches = result["matches"]
    if not matches:
        tg.send_message(chat_id, error_msg("Contact not found. Try /contacts"))
        return
    if len(matches) > 1 or result["mode"] == "fuzzy":
        pid = pending_service.create_pending(
            tg_uid,
            user_id,
            "pick_settle",
            {"candidates": [{"id": c["id"], "name": c["name"]} for c in matches[:5]]},
        )
        rows = [
            [tg.btn(f"· {c['name'][:26]}", f"ps:{pid}:{i}")]
            for i, c in enumerate(matches[:5])
        ]
        rows.append([tg.btn("✕ Cancel", f"no:{pid}")])
        tg.send_message(
            chat_id,
            pick_contact(0, "settle")
            if len(matches) > 1
            else report_confirm_contact(name, matches[0]["name"]),
            reply_markup=tg.inline_keyboard(rows),
        )
        return
    c = matches[0]
    bal = int(c.get("balance_paise") or 0)
    if bal == 0:
        tg.send_message(chat_id, already_settled(c["name"]))
        return
    pid = pending_service.create_pending(
        tg_uid,
        user_id,
        "settle",
        {"contact_id": c["id"], "contact_name": c["name"], "balance_paise": bal},
    )
    tg.send_message(
        chat_id,
        settle_ask(c["name"], bal),
        reply_markup=tg.btns_confirm(pid, ok="Settle ₹0", cancel="Cancel"),
    )


def _ask_unlink(chat_id: int, tg_uid: int, user_id: str) -> None:
    pid = pending_service.create_pending(tg_uid, user_id, "unlink", {})
    tg.send_message(
        chat_id,
        unlink_ask(),
        reply_markup=tg.btns_confirm(pid, ok="Unlink", cancel="Keep linked"),
    )


def _handle_remind_text(chat_id: int, tg_uid: int, user_id: str, rest: str) -> None:
    if not rest:
        tg.send_message(
            chat_id,
            unknown_hint("Example: /remind Pay Ravi tomorrow 10am"),
        )
        return
    parsed = parse_message(
        f"remind {rest}",
        today=date.today().isoformat(),
        contacts=[],
    )
    _handle_remind_parsed(chat_id, user_id, parsed, fallback_msg=rest)


def _handle_remind_parsed(
    chat_id: int,
    user_id: str,
    parsed: dict,
    fallback_msg: str | None = None,
) -> None:
    msg = parsed.get("remind_message") or fallback_msg or "Reminder"
    due = None
    if parsed.get("remind_iso"):
        try:
            due = datetime.fromisoformat(
                str(parsed["remind_iso"]).replace("Z", "+00:00")
            )
        except ValueError:
            due = None
    if due is None:
        due = datetime.now(timezone.utc) + timedelta(hours=24)
    reminder_service.create_reminder(user_id, chat_id, msg, due)
    tg.send_message(
        chat_id,
        reminder_set(
            msg,
            due.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        ),
    )


# ─── Callbacks ────────────────────────────────────────────────────────────────


def _handle_callback(cb: dict) -> None:
    data = (cb.get("data") or "").strip()
    cq_id = cb.get("id")
    msg = cb.get("message") or {}
    chat_id = (msg.get("chat") or {}).get("id")
    tg_uid = (cb.get("from") or {}).get("id")
    if chat_id is None or tg_uid is None:
        return

    # Main menu
    if data.startswith("menu:"):
        tg.answer_callback(cq_id)
        action = data[5:]
        if action == "cancel":
            tg.send_message(chat_id, cancelled())
            return
        link = link_service.get_by_telegram(tg_uid)
        if not link:
            tg.send_message(chat_id, not_linked())
            return
        user_id = link["user_id"]
        if action == "balance":
            tg.send_message(chat_id, balance_text(user_id))
        elif action == "contacts":
            tg.send_message(chat_id, contacts_text(user_id))
        elif action == "get":
            tg.send_message(chat_id, contacts_text(user_id, mode="get"))
        elif action == "give":
            tg.send_message(chat_id, contacts_text(user_id, mode="give"))
        elif action == "help":
            tg.send_message(chat_id, help_text())
        elif action == "report":
            tg.send_message(
                chat_id,
                report_ask_period(None),
                reply_markup=_period_keyboard(),
            )
        return

    # Period pick: rper:today  OR  rper:today:{pid}
    if data.startswith("rper:"):
        tg.answer_callback(cq_id)
        parts = data.split(":")
        if len(parts) < 2:
            return
        code = parts[1]
        pid = parts[2] if len(parts) > 2 else None
        link = link_service.get_by_telegram(tg_uid)
        if not link:
            tg.send_message(chat_id, not_linked())
            return
        user_id = link["user_id"]
        if code not in PERIOD_CODES:
            tg.send_message(chat_id, error_msg("Unknown period."))
            return
        resolved = resolve_period(period=code)
        contact = None
        if pid:
            row = pending_service.get_pending(pid)
            if not row:
                tg.send_message(chat_id, expired())
                return
            payload = row.get("payload") or {}
            cid = payload.get("contact_id")
            if cid:
                contact = contact_service.get_contact(user_id, cid)
            pending_service.delete_pending(pid)
        _deliver_report(
            chat_id,
            user_id,
            contact=contact,
            date_from=resolved["date_from"],
            date_to=resolved["date_to"],
            period_label=resolved["label"],
        )
        return

    if data.startswith("no:"):
        pid = data[3:]
        pending_service.delete_pending(pid)
        tg.answer_callback(cq_id, "Cancelled")
        tg.send_message(chat_id, cancelled())
        return

    if data.startswith("ok:"):
        pid = data[3:]
        row = pending_service.get_pending(pid)
        tg.answer_callback(cq_id)
        if not row:
            tg.send_message(chat_id, expired())
            return
        if row["kind"] == "report_confirm":
            payload = row.get("payload") or {}
            pending_service.delete_pending(pid)
            contact = contact_service.get_contact(
                row["user_id"], payload["contact_id"]
            )
            if not contact:
                tg.send_message(chat_id, error_msg("Contact gone."))
                return
            resolved = _resolved_from_payload(payload)
            _continue_report_with_contact(
                chat_id, tg_uid, row["user_id"], contact, resolved
            )
            return
        _execute_pending(chat_id, tg_uid, row)
        pending_service.delete_pending(pid)
        return

    # Pick report contact: pr:pid:index
    if data.startswith("pr:"):
        parts = data.split(":")
        if len(parts) < 3:
            return
        pid, idx_s = parts[1], parts[2]
        row = pending_service.get_pending(pid)
        tg.answer_callback(cq_id)
        if not row:
            tg.send_message(chat_id, expired())
            return
        try:
            idx = int(idx_s)
        except ValueError:
            return
        cands = (row.get("payload") or {}).get("candidates") or []
        if idx < 0 or idx >= len(cands):
            return
        chosen = cands[idx]
        payload = dict(row["payload"])
        pending_service.delete_pending(pid)
        contact = contact_service.get_contact(row["user_id"], chosen["id"])
        if not contact:
            return
        resolved = _resolved_from_payload(payload)
        _continue_report_with_contact(
            chat_id, tg_uid, row["user_id"], contact, resolved
        )
        return

    if data.startswith("pc:"):
        parts = data.split(":")
        if len(parts) < 3:
            return
        pid, idx_s = parts[1], parts[2]
        row = pending_service.get_pending(pid)
        tg.answer_callback(cq_id)
        if not row:
            tg.send_message(chat_id, expired())
            return
        try:
            idx = int(idx_s)
        except ValueError:
            return
        cands = (row.get("payload") or {}).get("candidates") or []
        if idx < 0 or idx >= len(cands):
            return
        chosen = cands[idx]
        payload = dict(row["payload"])
        payload["contact_id"] = chosen["id"]
        payload["contact_name"] = chosen["name"]
        payload.pop("candidates", None)
        pending_service.delete_pending(pid)
        new_pid = pending_service.create_pending(
            tg_uid, row["user_id"], "confirm_txn", payload
        )
        tg.send_message(
            chat_id,
            confirm_txn(
                payload["type"],
                float(payload["amount_rupees"]),
                contact=chosen["name"],
                note=payload.get("note"),
            ),
            reply_markup=tg.btns_confirm(new_pid),
        )
        return

    if data.startswith("ps:"):
        parts = data.split(":")
        if len(parts) < 3:
            return
        pid, idx_s = parts[1], parts[2]
        row = pending_service.get_pending(pid)
        tg.answer_callback(cq_id)
        if not row:
            tg.send_message(chat_id, expired())
            return
        idx = int(idx_s)
        cands = (row.get("payload") or {}).get("candidates") or []
        chosen = cands[idx]
        pending_service.delete_pending(pid)
        c = contact_service.get_contact(row["user_id"], chosen["id"])
        if not c:
            return
        bal = int(c.get("balance_paise") or 0)
        new_pid = pending_service.create_pending(
            tg_uid,
            row["user_id"],
            "settle",
            {
                "contact_id": c["id"],
                "contact_name": c["name"],
                "balance_paise": bal,
            },
        )
        tg.send_message(
            chat_id,
            settle_ask(c["name"], bal),
            reply_markup=tg.btns_confirm(new_pid, ok="Settle ₹0", cancel="Cancel"),
        )


def _execute_pending(chat_id: int, tg_uid: int, row: dict) -> None:
    kind = row["kind"]
    user_id = row["user_id"]
    payload: dict[str, Any] = row.get("payload") or {}

    if kind == "unlink":
        link_service.unlink_telegram(tg_uid)
        tg.send_message(chat_id, unlinked())
        return

    if kind == "settle":
        contact_service.settle_contact(user_id, payload["contact_id"])
        tg.send_message(chat_id, settle_done(payload.get("contact_name") or "Contact"))
        return

    if kind == "confirm_txn":
        contact_id = payload.get("contact_id")
        if payload.get("create_contact"):
            created = contact_service.create_contact(
                user_id, {"name": payload["create_contact"]}
            )
            contact_id = created["id"]
        body = {
            "type": payload["type"],
            "amount_rupees": float(payload["amount_rupees"]),
            "note": payload.get("note"),
            "contact_id": contact_id,
        }
        if payload.get("txn_date"):
            try:
                body["txn_date"] = date.fromisoformat(str(payload["txn_date"])[:10])
            except ValueError:
                pass
        txn = txn_service.create_transaction(user_id, body)
        who = payload.get("contact_name") or payload.get("create_contact") or ""
        tg.send_message(
            chat_id,
            saved_txn(
                txn["type"],
                int(txn["amount_paise"]),
                who,
                note=payload.get("note"),
            ),
        )
        link = link_service.get_by_telegram(tg_uid)
        if (
            link
            and txn["type"] == "expense"
            and int(txn["amount_paise"])
            >= int(link.get("alert_expense_paise") or 500000)
        ):
            tg.send_message(chat_id, expense_alert(int(txn["amount_paise"])))
        return

    tg.send_message(chat_id, info("Done."))
