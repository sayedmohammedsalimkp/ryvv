"""Groq GPT-OSS NLU + Whisper for Telegram."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx
from openai import OpenAI

from app.core.config import get_settings

log = logging.getLogger("ryvv.telegram.groq")

# Cheap in-process guard so a noisy chat can't burn Groq quota.
_NLU_WINDOW: list[float] = []
_NLU_MAX_PER_MIN = 40
_WHISPER_WINDOW: list[float] = []
_WHISPER_MAX_PER_MIN = 15


def _allow(window: list[float], max_per_min: int) -> bool:
    import time

    now = time.time()
    cutoff = now - 60.0
    while window and window[0] < cutoff:
        window.pop(0)
    if len(window) >= max_per_min:
        return False
    window.append(now)
    return True

SYSTEM = """You are RYVV money assistant NLU for India (INR).
Parse the user message (Hindi or English or Hinglish) into ONE JSON object only.
No markdown. No explanation.

Schema:
{
  "intent": "greet|gave|got|expense|income|borrowed|lent|settle|balance|contacts|get_list|give_list|help|remind|report|digest|unlink|status|unknown",
  "amount_rupees": number|null,
  "contact_name": string|null,
  "note": string|null,
  "txn_date": "YYYY-MM-DD"|null,
  "period": "today|week|month|days|all|null",
  "period_days": number|null,
  "date_from": "YYYY-MM-DD"|null,
  "date_to": "YYYY-MM-DD"|null,
  "remind_message": string|null,
  "remind_iso": string|null,
  "confidence": 0.0-1.0,
  "reply_hint": string|null
}

Rules:
- greet = hi / hello / hey / namaste / yo / good morning (no money action)
- gave = user paid / gave money to contact
- got = user received money from contact (received)
- expense/income = personal, no contact required
- settle = clear balance with contact to 0
- balance = total / on hand summary
- get_list = who owes user (you will get)
- give_list = who user owes (you will give)
- report = PDF statement. Fill period when user says today / this week / this month / past N days / all.
  Examples:
  - "report" or "statement" → period=null (bot will ask)
  - "this month report" → period=month, contact_name=null
  - "today report" / "24h report" → period=today
  - "rahul report" → contact_name=Rahul, period=null
  - "rahul report past 2 days" → contact_name=Rahul, period=days, period_days=2
  - "report for last week" → period=week
- remind = set a reminder; put due time in remind_iso ISO8601 UTC if possible
- Today is context date provided in user message
- Amounts like 500, 1k, 2.5k, ₹1,200 — convert to number rupees
- If unclear, intent=unknown and low confidence
"""


def _client() -> OpenAI | None:
    key = get_settings().GROQ_API_KEY
    if not key:
        return None
    return OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")


def _extract_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            return json.loads(m.group(0))
        return {"intent": "unknown", "confidence": 0.0}


def parse_message(text: str, *, today: str, contacts: list[str]) -> dict[str, Any]:
    """Return normalized intent payload."""
    fallback = _rule_fallback(text)
    if not _allow(_NLU_WINDOW, _NLU_MAX_PER_MIN):
        log.warning("NLU rate limited — using rule fallback")
        return fallback if fallback.get("intent") != "unknown" else {
            **fallback,
            "intent": "unknown",
            "reply_hint": "Too many requests — try again in a minute.",
            "confidence": 0.0,
        }

    client = _client()
    if not client:
        return fallback

    contact_hint = ", ".join(contacts[:40]) if contacts else "(none)"
    user_prompt = (
        f"Today: {today}\nKnown contacts: {contact_hint}\nUser message: {text}"
    )
    try:
        settings = get_settings()
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=500,
        )
        raw = completion.choices[0].message.content or "{}"
        data = _extract_json(raw)
        data = _normalize(data)
        if data.get("intent") == "unknown" and fallback.get("intent") != "unknown":
            return fallback
        # Prefer rule-parsed period when LLM missed it on report
        if data.get("intent") == "report" and not data.get("period"):
            if fallback.get("intent") == "report" and fallback.get("period"):
                data["period"] = fallback["period"]
                data["period_days"] = fallback.get("period_days")
                data["date_from"] = fallback.get("date_from")
                data["date_to"] = fallback.get("date_to")
                if not data.get("contact_name") and fallback.get("contact_name"):
                    data["contact_name"] = fallback["contact_name"]
        return data
    except Exception:
        log.exception("NLU fail")
        return fallback


def _whisper_filename(name: str) -> tuple[str, str]:
    """Return (safe_filename, mime) for Groq (ogg supported; Telegram uses .oga)."""
    lower = (name or "voice.ogg").lower()
    if lower.endswith(".oga") or lower.endswith(".ogg") or "ogg" in lower:
        return "voice.ogg", "audio/ogg"
    if lower.endswith(".mp3"):
        return "voice.mp3", "audio/mpeg"
    if lower.endswith(".m4a"):
        return "voice.m4a", "audio/mp4"
    if lower.endswith(".wav"):
        return "voice.wav", "audio/wav"
    if lower.endswith(".webm"):
        return "voice.webm", "audio/webm"
    return "voice.ogg", "audio/ogg"


def transcribe_audio(audio_bytes: bytes, filename: str = "voice.ogg") -> str:
    """Groq Whisper via multipart upload (more reliable than BytesIO for .oga)."""
    if not _allow(_WHISPER_WINDOW, _WHISPER_MAX_PER_MIN):
        raise RuntimeError("Voice limit reached — try again in a minute.")
    settings = get_settings()
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY missing")
    if not audio_bytes:
        raise RuntimeError("Empty audio")

    safe_name, mime = _whisper_filename(filename)
    with httpx.Client(timeout=120.0, http2=False) as client:
        r = client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            files={"file": (safe_name, audio_bytes, mime)},
            data={
                "model": settings.GROQ_WHISPER_MODEL,
                "response_format": "json",
                "temperature": "0",
                "prompt": (
                    "Hinglish money talk: gave got expense income settle "
                    "rupees amount contact names report today week month"
                ),
            },
        )
        if r.status_code >= 400:
            log.error("Whisper HTTP %s: %s", r.status_code, r.text[:500])
            raise RuntimeError(f"Whisper failed ({r.status_code}): {r.text[:200]}")
        data = r.json()
        text = (data.get("text") or "").strip()
        if not text:
            raise RuntimeError("Whisper returned empty text")
        return text


def _normalize(data: dict[str, Any]) -> dict[str, Any]:
    intent = str(data.get("intent") or "unknown").lower().strip()
    alias = {
        "receive": "got",
        "received": "got",
        "give": "gave",
        "paid": "gave",
        "you_will_get": "get_list",
        "you_will_give": "give_list",
        "reminder": "remind",
        "pdf": "report",
        "statement": "report",
        "hello": "greet",
        "hi": "greet",
        "hey": "greet",
        "namaste": "greet",
        "start": "greet",
    }
    intent = alias.get(intent, intent)

    period = data.get("period")
    if period is not None:
        period = str(period).lower().strip() or None
        period_alias = {
            "day": "today",
            "24h": "today",
            "24": "today",
            "this_week": "week",
            "this week": "week",
            "7d": "week",
            "this_month": "month",
            "this month": "month",
            "past_days": "days",
            "last_days": "days",
            "full": "all",
            "everything": "all",
            "lifetime": "all",
        }
        period = period_alias.get(period, period)

    amt = data.get("amount_rupees")
    try:
        amt_f = float(amt) if amt is not None else None
    except (TypeError, ValueError):
        amt_f = None

    days = data.get("period_days")
    try:
        days_i = int(days) if days is not None else None
    except (TypeError, ValueError):
        days_i = None

    conf = data.get("confidence")
    try:
        conf_f = float(conf) if conf is not None else 0.5
    except (TypeError, ValueError):
        conf_f = 0.5

    contact = data.get("contact_name")
    if isinstance(contact, str):
        contact = contact.strip() or None

    return {
        "intent": intent,
        "amount_rupees": amt_f,
        "contact_name": contact,
        "note": data.get("note") or None,
        "txn_date": data.get("txn_date") or None,
        "period": period,
        "period_days": days_i,
        "date_from": data.get("date_from") or None,
        "date_to": data.get("date_to") or None,
        "remind_message": data.get("remind_message") or None,
        "remind_iso": data.get("remind_iso") or None,
        "confidence": conf_f,
        "reply_hint": data.get("reply_hint") or None,
    }


def _parse_report_rules(t: str) -> dict[str, Any] | None:
    """Offline report parser: period + optional contact."""
    empty = {
        "amount_rupees": None,
        "note": None,
        "txn_date": None,
        "remind_message": None,
        "remind_iso": None,
        "reply_hint": None,
        "date_from": None,
        "date_to": None,
    }

    # Strip leading /report
    raw = re.sub(r"^/report\s*", "", t).strip()

    is_reportish = bool(
        re.search(r"\b(report|statement|pdf)\b", raw)
        or t.startswith("/report")
        or raw in {"report", "statement", "pdf"}
    )
    if not is_reportish and not t.startswith("/report"):
        return None

    period = None
    period_days = None
    contact = None

    # past/last N days
    m_days = re.search(
        r"(?:past|last|previous)\s+(\d+)\s*days?", raw
    ) or re.search(r"(\d+)\s*days?\s*(?:report|statement)?", raw)
    if m_days and ("day" in raw or "past" in raw or "last" in raw):
        period = "days"
        period_days = int(m_days.group(1))

    if re.search(r"\b(today|24\s*h|24h)\b", raw):
        period = "today"
    elif re.search(r"\b(this\s+)?week\b", raw) or re.search(r"\blast\s+7\s*days?\b", raw):
        period = period or "week"
    elif re.search(r"\b(this\s+)?month\b", raw):
        period = period or "month"
    elif re.search(r"\b(all\s*time|full|everything|lifetime)\b", raw):
        period = period or "all"

    # Contact: remove report keywords and period phrases, leftover = name
    cleaned = raw
    cleaned = re.sub(r"\b(report|statement|pdf|/report)\b", " ", cleaned)
    cleaned = re.sub(
        r"\b(today|24\s*h|24h|this\s+week|week|this\s+month|month|"
        r"all\s*time|full|everything|lifetime|for|past|last|previous|"
        r"\d+\s*days?)\b",
        " ",
        cleaned,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .,-")
    if cleaned and cleaned not in {"a", "the", "my", "me"}:
        contact = cleaned.title() if cleaned.islower() else cleaned

    return {
        "intent": "report",
        "confidence": 0.85,
        "contact_name": contact,
        "period": period,
        "period_days": period_days,
        **empty,
    }


def _rule_fallback(text: str) -> dict[str, Any]:
    """Simple offline parser if Groq missing/fails."""
    t = text.strip().lower()
    empty = {
        "amount_rupees": None,
        "contact_name": None,
        "note": None,
        "txn_date": None,
        "period": None,
        "period_days": None,
        "date_from": None,
        "date_to": None,
        "remind_message": None,
        "remind_iso": None,
        "reply_hint": None,
    }

    if t in {
        "hi",
        "hello",
        "hey",
        "hii",
        "hiii",
        "yo",
        "namaste",
        "namaskar",
        "good morning",
        "good afternoon",
        "good evening",
        "gm",
        "sup",
        "hola",
    } or re.fullmatch(r"h+i+", t):
        return {"intent": "greet", "confidence": 1.0, **empty}

    if t in {"/help", "help", "madad"}:
        return {"intent": "help", "confidence": 1.0, **empty}
    if t in {"/balance", "balance", "bal", "on hand"}:
        return {"intent": "balance", "confidence": 1.0, **empty}
    if t in {"/contacts", "contacts"}:
        return {"intent": "contacts", "confidence": 1.0, **empty}
    if t in {"/get", "you will get", "will get"}:
        return {"intent": "get_list", "confidence": 1.0, **empty}
    if t in {"/give", "you will give", "will give"}:
        return {"intent": "give_list", "confidence": 1.0, **empty}
    if t in {"/digest", "digest"}:
        return {"intent": "digest", "confidence": 1.0, **empty}
    if t in {"/unlink", "unlink"}:
        return {"intent": "unlink", "confidence": 1.0, **empty}
    if t in {"/status", "status"}:
        return {"intent": "status", "confidence": 1.0, **empty}

    report = _parse_report_rules(t)
    if report:
        return report

    m = re.match(
        r"^(gave|give|got|received|receive|expense|income|borrowed|lent)\s+(\d+(?:\.\d+)?)\s*(?:k)?\s*(?:to|from)?\s*(.*)$",
        t,
    )
    if m:
        verb, num, rest = m.group(1), m.group(2), m.group(3).strip()
        amt = float(num)
        if f"{num}k" in t.replace(" ", ""):
            amt *= 1000
        intent_map = {
            "gave": "gave",
            "give": "gave",
            "got": "got",
            "received": "got",
            "receive": "got",
            "expense": "expense",
            "income": "income",
            "borrowed": "borrowed",
            "lent": "lent",
        }
        parts = rest.split(maxsplit=1) if rest else ["", ""]
        contact = parts[0] if verb not in {"expense", "income"} else None
        note = (
            parts[1]
            if len(parts) > 1
            else (rest if verb in {"expense", "income"} else None)
        )
        return {
            "intent": intent_map[verb],
            "amount_rupees": amt,
            "contact_name": contact or None,
            "note": note or None,
            "txn_date": None,
            "period": None,
            "period_days": None,
            "date_from": None,
            "date_to": None,
            "remind_message": None,
            "remind_iso": None,
            "confidence": 0.7,
            "reply_hint": None,
        }

    sm = re.match(r"^settle\s+(.+)$", t)
    if sm:
        return {
            "intent": "settle",
            "confidence": 0.8,
            **{**empty, "contact_name": sm.group(1).strip()},
        }

    return {"intent": "unknown", "confidence": 0.0, **empty}
