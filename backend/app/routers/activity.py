from fastapi import APIRouter, Query
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.core.deps import CurrentUserId
from app.services.activity import list_activity

router = APIRouter()


class ActivityOut(BaseModel):
    id: UUID
    action: str
    entity_type: str
    entity_id: str | None = None
    title: str
    detail: str | None = None
    amount_paise: int | None = None
    created_at: datetime | None = None


@router.get("", response_model=list[ActivityOut])
def get_activity(user_id: CurrentUserId, limit: int = Query(50, ge=1, le=200)):
    rows = list_activity(user_id, limit=limit)
    return [
        ActivityOut(
            id=r["id"],
            action=r["action"],
            entity_type=r["entity_type"],
            entity_id=r.get("entity_id"),
            title=r["title"],
            detail=r.get("detail"),
            amount_paise=r.get("amount_paise"),
            created_at=r.get("created_at"),
        )
        for r in rows
    ]
