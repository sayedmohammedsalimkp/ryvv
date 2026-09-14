"""Telegram Bot API helpers (httpx)."""

from __future__ import annotations

import logging

import httpx

from app.core.config import get_settings

log = logging.getLogger("ryvv.telegram.api")


def _base() -> str:
    token = get_settings().TELEGRAM_BOT_TOKEN
    return f"https://api.telegram.org/bot{token}"


def bot_enabled() -> bool:
    return bool(get_settings().TELEGRAM_BOT_TOKEN)


def api_call(method: str, payload: dict | None = None, *, files: dict | None = None) -> dict:
    if not bot_enabled():
        return {}
    url = f"{_base()}/{method}"
    with httpx.Client(timeout=60.0, http2=False) as client:
        if files:
            r = client.post(url, data=payload or {}, files=files)
        else:
            r = client.post(url, json=payload or {})
        if r.status_code >= 400:
            log.error("%s failed %s: %s", method, r.status_code, r.text[:400])
        r.raise_for_status()
        return r.json()


def send_message(
    chat_id: int,
    text: str,
    *,
    reply_markup: dict | None = None,
    parse_mode: str | None = "HTML",
) -> dict:
    body: dict = {
        "chat_id": chat_id,
        "text": text[:4000],
        "disable_web_page_preview": True,
    }
    if reply_markup:
        body["reply_markup"] = reply_markup
    if parse_mode:
        body["parse_mode"] = parse_mode
    try:
        return api_call("sendMessage", body)
    except Exception:
        # Fallback plain text if HTML rejected
        if parse_mode:
            log.warning("HTML send failed — retry plain")
            body.pop("parse_mode", None)
            # strip tags roughly for fallback
            import re

            body["text"] = re.sub(r"<[^>]+>", "", text)[:4000]
            return api_call("sendMessage", body)
        raise


def answer_callback(callback_query_id: str, text: str | None = None) -> dict:
    body: dict = {"callback_query_id": callback_query_id}
    if text:
        body["text"] = text[:200]
    return api_call("answerCallbackQuery", body)


def send_document(
    chat_id: int,
    filename: str,
    data: bytes,
    caption: str = "",
    *,
    parse_mode: str | None = "HTML",
) -> dict:
    payload: dict = {"chat_id": str(chat_id), "caption": caption[:1024]}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    return api_call(
        "sendDocument",
        payload,
        files={"document": (filename, data, "application/pdf")},
    )


def get_file(file_id: str) -> dict:
    return api_call("getFile", {"file_id": file_id})


def download_file(file_path: str) -> bytes:
    token = get_settings().TELEGRAM_BOT_TOKEN
    url = f"https://api.telegram.org/file/bot{token}/{file_path}"
    with httpx.Client(timeout=120.0, http2=False) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.content


def inline_keyboard(rows: list[list[dict]]) -> dict:
    return {"inline_keyboard": rows}


def btn(text: str, data: str) -> dict:
    return {"text": text, "callback_data": data[:64]}


def btns_confirm(pid: str, *, ok: str = "Confirm", cancel: str = "Cancel") -> dict:
    return inline_keyboard(
        [[btn(f"✓ {ok}", f"ok:{pid}"), btn(f"✕ {cancel}", f"no:{pid}")]]
    )
