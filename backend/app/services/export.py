"""CSV + PDF statement export -- Khatabook-style ledger with RYVV branding."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Table, TableStyle

from app.services.balances import paise_to_rupees
from app.services.contacts import get_contact
from app.services.transactions import list_transactions
from app.services.users import get_user

# Brand (matches RYVV #0866FF) + ledger tones
HEADER_BG = colors.Color(8 / 255, 102 / 255, 255 / 255)
DEBIT_BG = colors.Color(1.0, 0.92, 0.92)
CREDIT_BG = colors.Color(0.90, 0.97, 0.92)
ROW_ALT = colors.Color(0.97, 0.98, 0.99)
BORDER = colors.Color(0.78, 0.80, 0.83)
TEXT_MUTED = colors.Color(0.35, 0.38, 0.42)
DEBIT_TEXT = colors.Color(0.75, 0.12, 0.12)
CREDIT_TEXT = colors.Color(0.05, 0.45, 0.28)
INK = colors.black

RUPEE = "\u20b9"
MINUS = "\u2212"
EMDASH = "\u2014"

_ASSETS = Path(__file__).resolve().parent.parent / "assets"
_LOGO_WHITE = _ASSETS / "ryvv-white.png"
_LOGO_BLUE = _ASSETS / "ryvv-blue.png"

_FONT = "Helvetica"
_FONT_BOLD = "Helvetica-Bold"
_FONTS_READY = False


def _ensure_fonts() -> None:
    """Prefer Arial / DejaVu so the rupee glyph renders."""
    global _FONT, _FONT_BOLD, _FONTS_READY
    if _FONTS_READY:
        return
    pairs = [
        (
            Path(r"C:\Windows\Fonts\arial.ttf"),
            Path(r"C:\Windows\Fonts\arialbd.ttf"),
            "RYVVSans",
            "RYVVSans-Bold",
        ),
        (
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
            "RYVVSans",
            "RYVVSans-Bold",
        ),
        (
            Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
            Path("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"),
            "RYVVSans",
            "RYVVSans-Bold",
        ),
    ]
    for regular, bold, name, bold_name in pairs:
        if regular.is_file() and bold.is_file():
            try:
                pdfmetrics.registerFont(TTFont(name, str(regular)))
                pdfmetrics.registerFont(TTFont(bold_name, str(bold)))
                _FONT = name
                _FONT_BOLD = bold_name
                break
            except Exception:
                continue
    _FONTS_READY = True


def _logo(white: bool = True) -> ImageReader | None:
    path = _LOGO_WHITE if white else _LOGO_BLUE
    if not path.is_file():
        return None
    return ImageReader(str(path))


def _fmt_inr(paise: int) -> str:
    return f"{RUPEE}{paise_to_rupees(paise):,.2f}"


def _fmt_date(value: Any) -> str:
    if not value:
        return "-"
    if isinstance(value, date):
        return value.strftime("%d %b %Y")
    try:
        return datetime.fromisoformat(str(value)[:10]).strftime("%d %b %Y")
    except ValueError:
        return str(value)


def _is_debit(txn_type: str) -> bool:
    return txn_type in {"expense", "gave", "lent"}


def _is_credit(txn_type: str) -> bool:
    return txn_type in {"income", "received", "borrowed", "settle"}


def _detail_label(row: dict) -> str:
    parts = [str(row.get("type") or "").capitalize()]
    if row.get("note"):
        parts.append(str(row["note"])[:40])
    elif row.get("category_name"):
        parts.append(str(row["category_name"]))
    elif row.get("contact_name"):
        parts.append(str(row["contact_name"]))
    return " · ".join(parts)


def _opening_balance_paise(
    user_id: str,
    *,
    date_from: date | None,
    contact_id: str | None,
) -> int:
    if not date_from:
        return 0
    before = date_from - timedelta(days=1)
    prior = list_transactions(
        user_id,
        date_to=before,
        contact_id=contact_id,
        limit=5000,
    )
    bal = 0
    for r in prior:
        if r.get("settled_at") and r["type"] != "settle":
            continue
        amt = int(r["amount_paise"])
        if _is_debit(r["type"]):
            bal += amt
        elif _is_credit(r["type"]):
            bal -= amt
    return bal


def export_csv(
    user_id: str,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    contact_id: str | None = None,
) -> bytes:
    rows = list_transactions(
        user_id,
        date_from=date_from,
        date_to=date_to,
        contact_id=contact_id,
        limit=5000,
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "date",
            "type",
            "amount_inr",
            "contact",
            "account",
            "category",
            "note",
            "settled_at",
        ]
    )
    for r in rows:
        writer.writerow(
            [
                r.get("txn_date"),
                r.get("type"),
                paise_to_rupees(r["amount_paise"]),
                r.get("contact_name") or "",
                r.get("account_name") or "On hand",
                r.get("category_name") or "",
                r.get("note") or "",
                r.get("settled_at") or "",
            ]
        )
    return buf.getvalue().encode("utf-8-sig")


def export_pdf(
    user_id: str,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    contact_id: str | None = None,
) -> bytes:
    _ensure_fonts()
    rows = list_transactions(
        user_id,
        date_from=date_from,
        date_to=date_to,
        contact_id=contact_id,
        limit=500,
    )
    rows_asc = sorted(
        rows,
        key=lambda r: (str(r.get("txn_date") or ""), str(r.get("created_at") or "")),
    )

    user = get_user(user_id) or {}
    contact = get_contact(user_id, contact_id) if contact_id else None
    party = (contact or {}).get("name") or "Money"
    owner = user.get("full_name") or "RYVV user"
    owner_sub = (
        (contact or {}).get("phone")
        or user.get("email")
        or user.get("phone")
        or ""
    )

    if date_from or date_to:
        period = f"{_fmt_date(date_from)} - {_fmt_date(date_to)}"
    else:
        period = "All time"

    opening = _opening_balance_paise(
        user_id, date_from=date_from, contact_id=contact_id
    )
    total_debit = 0
    total_credit = 0
    running = opening

    table_data: list[list[Any]] = [
        ["Date", "Details", f"Debit ({MINUS})", "Credit (+)", "Balance"],
        [
            _fmt_date(date_from) if date_from else "Start",
            "Opening Balance",
            "",
            "",
            _fmt_inr(opening),
        ],
    ]

    for r in rows_asc:
        amt = int(r["amount_paise"])
        debit = ""
        credit = ""
        if _is_debit(r["type"]):
            debit = _fmt_inr(amt)
            total_debit += amt
            running += amt
        elif _is_credit(r["type"]):
            credit = _fmt_inr(amt)
            total_credit += amt
            running -= amt
        else:
            credit = _fmt_inr(amt)
            total_credit += amt
            running -= amt

        if running > 0:
            bal_cell = f"{_fmt_inr(running)} Dr"
        elif running < 0:
            bal_cell = f"{_fmt_inr(abs(running))} Cr"
        else:
            bal_cell = _fmt_inr(0)

        table_data.append(
            [
                _fmt_date(r.get("txn_date")),
                _detail_label(r),
                debit,
                credit,
                bal_cell,
            ]
        )

    net = total_debit - total_credit
    if contact:
        if net > 0:
            net_label = f"{_fmt_inr(net)} Dr"
            net_hint = f"({party} will give)"
            net_color = DEBIT_TEXT
        elif net < 0:
            net_label = f"{_fmt_inr(abs(net))} Cr"
            net_hint = f"({party} will get)"
            net_color = CREDIT_TEXT
        else:
            net_label = _fmt_inr(0)
            net_hint = "(Settled)"
            net_color = TEXT_MUTED
    else:
        if net > 0:
            net_label = f"{_fmt_inr(net)} Dr"
            net_hint = "(Net outflow)"
            net_color = DEBIT_TEXT
        elif net < 0:
            net_label = f"{_fmt_inr(abs(net))} Cr"
            net_hint = "(Net inflow)"
            net_color = CREDIT_TEXT
        else:
            net_label = _fmt_inr(0)
            net_hint = "(Settled)"
            net_color = TEXT_MUTED

    table_data.append(
        [
            "",
            "Grand Total",
            _fmt_inr(total_debit),
            _fmt_inr(total_credit),
            net_label if running != 0 else _fmt_inr(0),
        ]
    )

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    margin = 14 * mm
    usable_w = width - 2 * margin
    usable_bottom = 22 * mm
    logo_white = _logo(white=True)

    def draw_header_footer(page: int, pages: int) -> None:
        bar_h = 14 * mm
        c.setFillColor(HEADER_BG)
        c.rect(0, height - bar_h, width, bar_h, fill=1, stroke=0)

        c.setFillColor(colors.white)
        c.setFont(_FONT, 9)
        c.drawString(margin, height - 9 * mm, owner[:40])

        if logo_white:
            logo_h = 7 * mm
            logo_w = logo_h * (2172 / 724)
            c.drawImage(
                logo_white,
                width - margin - logo_w,
                height - bar_h + (bar_h - logo_h) / 2,
                width=logo_w,
                height=logo_h,
                mask="auto",
                preserveAspectRatio=True,
            )
        else:
            c.setFont(_FONT_BOLD, 12)
            c.drawRightString(width - margin, height - 9 * mm, "RYVV")

        foot_h = 14 * mm
        c.setFillColor(HEADER_BG)
        c.rect(0, 0, width, foot_h, fill=1, stroke=0)

        c.setFillColor(colors.white)
        c.setFont(_FONT, 8)
        c.drawString(margin, 5.5 * mm, "Track money. Know who owes whom.")

        if logo_white:
            logo_h = 6 * mm
            logo_w = logo_h * (2172 / 724)
            c.drawImage(
                logo_white,
                width - margin - logo_w,
                (foot_h - logo_h) / 2,
                width=logo_w,
                height=logo_h,
                mask="auto",
                preserveAspectRatio=True,
            )
        else:
            c.setFont(_FONT_BOLD, 9)
            c.drawRightString(width - margin, 5.5 * mm, "RYVV")

        c.setFillColor(TEXT_MUTED)
        c.setFont(_FONT, 8)
        generated = datetime.now().strftime("%I:%M %p | %d %b'%y")
        c.drawString(margin, foot_h + 3 * mm, f"Report Generated : {generated}")
        c.drawRightString(width - margin, foot_h + 3 * mm, f"Page {page} of {pages}")

    def paint_title(y: float, *, continued: bool = False) -> float:
        c.setFillColor(INK)
        c.setFont(_FONT_BOLD, 16)
        title = f"{party} Statement" + (" (cont.)" if continued else "")
        c.drawCentredString(width / 2, y, title)
        y -= 6 * mm
        c.setFont(_FONT, 9)
        c.setFillColor(TEXT_MUTED)
        line2 = owner_sub if owner_sub else "Currency: INR"
        c.drawCentredString(width / 2, y, f"{line2}   ({period})")
        return y - 8 * mm

    def paint_summary(y: float) -> float:
        box_h = 22 * mm
        c.setStrokeColor(BORDER)
        c.setFillColor(colors.Color(0.96, 0.97, 0.98))
        c.roundRect(margin, y - box_h, usable_w, box_h, 3, fill=1, stroke=1)

        col_w = usable_w / 4
        summary = [
            (
                "Opening Balance",
                _fmt_inr(opening),
                _fmt_date(date_from) if date_from else "Start",
                TEXT_MUTED,
            ),
            (f"Total Debit ({MINUS})", _fmt_inr(total_debit), "", DEBIT_TEXT),
            ("Total Credit (+)", _fmt_inr(total_credit), "", CREDIT_TEXT),
            ("Net Balance", net_label, net_hint, net_color),
        ]
        for i, (label, value, sub, col) in enumerate(summary):
            x = margin + i * col_w
            if i > 0:
                c.setStrokeColor(BORDER)
                c.line(x, y - 3 * mm, x, y - box_h + 3 * mm)
            c.setFillColor(TEXT_MUTED)
            c.setFont(_FONT, 8)
            c.drawCentredString(x + col_w / 2, y - 6 * mm, label)
            c.setFillColor(col)
            c.setFont(_FONT_BOLD, 11)
            c.drawCentredString(x + col_w / 2, y - 12 * mm, value)
            if sub:
                c.setFillColor(TEXT_MUTED)
                c.setFont(_FONT, 7)
                c.drawCentredString(x + col_w / 2, y - 17 * mm, sub)
        return y - box_h - 7 * mm

    def paint_table(data_slice: list[list[Any]], top_y: float) -> float:
        col_widths = [26 * mm, 52 * mm, 32 * mm, 32 * mm, 34 * mm]
        style_cmds = [
            ("FONTNAME", (0, 0), (-1, 0), _FONT_BOLD),
            ("FONTNAME", (0, 1), (-1, -2), _FONT),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, 0), colors.Color(0.93, 0.94, 0.95)),
            ("TEXTCOLOR", (0, 0), (-1, 0), INK),
            ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
            ("ALIGN", (0, 0), (1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("BACKGROUND", (2, 1), (2, -1), DEBIT_BG),
            ("BACKGROUND", (3, 1), (3, -1), CREDIT_BG),
            ("TEXTCOLOR", (2, 1), (2, -1), DEBIT_TEXT),
            ("TEXTCOLOR", (3, 1), (3, -1), CREDIT_TEXT),
            ("TEXTCOLOR", (4, 1), (4, -1), DEBIT_TEXT),
            ("FONTNAME", (0, -1), (-1, -1), _FONT_BOLD),
            ("BACKGROUND", (0, -1), (-1, -1), colors.Color(0.93, 0.94, 0.95)),
        ]
        if len(data_slice) > 2:
            style_cmds.append(("BACKGROUND", (0, 1), (1, 1), ROW_ALT))

        t = Table(data_slice, colWidths=col_widths, repeatRows=1)
        t.setStyle(TableStyle(style_cmds))
        _tw, th = t.wrap(usable_w, top_y - usable_bottom)
        t.drawOn(c, margin, top_y - th)
        return top_y - th

    header = [table_data[0]]
    opening_and_rows = table_data[1:-1]
    grand = [table_data[-1]]
    chunk_size = 18
    pages_est = max(1, (len(opening_and_rows) + chunk_size - 1) // chunk_size)

    first = True
    page_num = 1
    if not opening_and_rows:
        pages_est = 1

    for start in range(0, max(len(opening_and_rows), 1), chunk_size):
        chunk = opening_and_rows[start : start + chunk_size]
        is_last = start + chunk_size >= len(opening_and_rows) or not opening_and_rows

        if not first:
            c.showPage()
            page_num += 1

        draw_header_footer(page_num, pages_est)
        y = height - 22 * mm
        y = paint_title(y, continued=not first)

        if first:
            y = paint_summary(y)
            c.setFillColor(INK)
            c.setFont(_FONT_BOLD, 10)
            c.drawString(
                margin,
                y,
                f"No. of Entries: {len(rows_asc)} (All)",
            )
            y -= 5 * mm

        if not chunk and not opening_and_rows:
            data_slice = header + [
                [EMDASH, "No entries in this period", "", "", ""]
            ] + grand
        elif is_last:
            data_slice = header + chunk + grand
        else:
            data_slice = header + chunk

        paint_table(data_slice, y)
        first = False
        if not opening_and_rows:
            break

    c.save()
    return buf.getvalue()
