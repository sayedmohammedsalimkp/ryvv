"""Resolve natural-language report periods into date ranges."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any


PeriodCode = str  # today | week | month | all | days | range


def resolve_period(
    *,
    period: str | None = None,
    period_days: int | None = None,
    date_from: str | date | None = None,
    date_to: str | date | None = None,
    today: date | None = None,
) -> dict[str, Any]:
    """
    Return {date_from, date_to, label, code}.
    date_from / date_to are date | None (None = unbounded).
    """
    today = today or date.today()
    code = (period or "").strip().lower() or None

    def _parse(v: str | date | None) -> date | None:
        if v is None or v == "":
            return None
        if isinstance(v, date):
            return v
        try:
            return date.fromisoformat(str(v)[:10])
        except ValueError:
            return None

    # Explicit ISO range wins
    df = _parse(date_from)
    dt = _parse(date_to)
    if df or dt:
        label = _range_label(df or date(1970, 1, 1), dt or today)
        return {
            "date_from": df,
            "date_to": dt or today,
            "label": label,
            "code": "range",
        }

    if code in {"today", "day", "24h", "24"}:
        return {
            "date_from": today,
            "date_to": today,
            "label": f"Today · {_fmt(today)}",
            "code": "today",
        }

    if code in {"week", "this_week", "7d", "7"}:
        start = today - timedelta(days=6)
        return {
            "date_from": start,
            "date_to": today,
            "label": f"This week · {_fmt(start)} – {_fmt(today)}",
            "code": "week",
        }

    if code in {"month", "this_month"}:
        start = today.replace(day=1)
        return {
            "date_from": start,
            "date_to": today,
            "label": f"This month · {_fmt(start)} – {_fmt(today)}",
            "code": "month",
        }

    if code in {"all", "full", "everything", "lifetime"}:
        return {
            "date_from": None,
            "date_to": None,
            "label": "All time",
            "code": "all",
        }

    if code in {"days", "past_days", "last_days"} or (
        period_days is not None and int(period_days) > 0
    ):
        days = int(period_days or 0)
        if days <= 0:
            days = 1
        start = today - timedelta(days=days - 1)
        return {
            "date_from": start,
            "date_to": today,
            "label": f"Past {days} day{'s' if days != 1 else ''} · {_fmt(start)} – {_fmt(today)}",
            "code": "days",
            "period_days": days,
        }

    # Unknown / missing → caller should ask
    return {
        "date_from": None,
        "date_to": None,
        "label": None,
        "code": None,
    }


def period_ready(resolved: dict[str, Any]) -> bool:
    return bool(resolved.get("code"))


def _fmt(d: date) -> str:
    return d.strftime("%d %b %Y")


def _range_label(start: date, end: date) -> str:
    return f"{_fmt(start)} – {_fmt(end)}"
