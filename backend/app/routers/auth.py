from fastapi import APIRouter, Request

from app.core.deps import CurrentUserId
from app.core.rate_limit import limiter
from app.schemas.money import UserOut, UserUpdate
from app.services import users as user_service

router = APIRouter()


@router.get("/me", response_model=UserOut)
@limiter.limit("60/minute")
def me(request: Request, user_id: CurrentUserId):
    row = user_service.get_user(user_id)
    return UserOut(
        id=row["id"],
        full_name=row["full_name"],
        email=row.get("email"),
        currency=row.get("currency") or "INR",
    )


@router.patch("/me", response_model=UserOut)
@limiter.limit("30/minute")
def update_me(request: Request, body: UserUpdate, user_id: CurrentUserId):
    payload = body.model_dump(exclude_none=True)
    row = (
        user_service.update_user(user_id, payload)
        if payload
        else user_service.get_user(user_id)
    )
    return UserOut(
        id=row["id"],
        full_name=row["full_name"],
        email=row.get("email"),
        currency=row.get("currency") or "INR",
    )
