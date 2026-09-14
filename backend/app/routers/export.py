from datetime import date, datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import Response

from app.core.deps import CurrentUserId
from app.core.rate_limit import limiter
from app.services import export as export_service

router = APIRouter()


def _stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


@router.get("/csv")
@limiter.limit("10/minute")
def export_csv(
    request: Request,
    user_id: CurrentUserId,
    date_from: date | None = None,
    date_to: date | None = None,
    contact_id: str | None = None,
):
    data = export_service.export_csv(
        user_id, date_from=date_from, date_to=date_to, contact_id=contact_id
    )
    filename = f"RYVV-transactions-{_stamp()}.csv"
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/pdf")
@limiter.limit("10/minute")
def export_pdf(
    request: Request,
    user_id: CurrentUserId,
    date_from: date | None = None,
    date_to: date | None = None,
    contact_id: str | None = None,
):
    data = export_service.export_pdf(
        user_id, date_from=date_from, date_to=date_to, contact_id=contact_id
    )
    filename = f"RYVV-statement-{_stamp()}.pdf"
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
