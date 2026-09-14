from fastapi import APIRouter, Query

from app.core.deps import CurrentUserId
from app.schemas.money import CategoryCreate, CategoryOut
from app.services import accounts as account_service

router = APIRouter()


@router.get("", response_model=list[CategoryOut])
def list_categories(user_id: CurrentUserId, kind: str | None = Query(None)):
    rows = account_service.list_categories(user_id, kind)
    return [
        CategoryOut(
            id=r["id"],
            name=r["name"],
            kind=r["kind"],
            is_system=bool(r.get("is_system")),
        )
        for r in rows
    ]


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(body: CategoryCreate, user_id: CurrentUserId):
    r = account_service.create_category(user_id, body.model_dump())
    return CategoryOut(
        id=r["id"],
        name=r["name"],
        kind=r["kind"],
        is_system=bool(r.get("is_system")),
    )
