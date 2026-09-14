from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.deps import CurrentUserId
from app.schemas.money import AccountCreate, AccountOut, AccountUpdate
from app.services import accounts as account_service
from app.services.balances import on_hand_paise

router = APIRouter()


class OnHandOut(BaseModel):
    name: str = "On hand"
    balance_paise: int


def _out(row: dict) -> AccountOut:
    return AccountOut(
        id=row["id"],
        name=row["name"],
        type=row["type"],
        opening_balance_paise=int(row.get("opening_balance_paise") or row.get("opening_balance") or 0),
        balance_paise=int(row.get("balance_paise") or 0),
    )


@router.get("", response_model=list[AccountOut])
def list_accounts(user_id: CurrentUserId):
    return [_out(r) for r in account_service.list_accounts(user_id)]


@router.get("/on-hand", response_model=OnHandOut)
def get_on_hand(user_id: CurrentUserId):
    return OnHandOut(balance_paise=on_hand_paise(user_id))


@router.post("", response_model=AccountOut, status_code=201)
def create_account(body: AccountCreate, user_id: CurrentUserId):
    return _out(account_service.create_account(user_id, body.model_dump()))


@router.patch("/{account_id}", response_model=AccountOut)
def update_account(account_id: str, body: AccountUpdate, user_id: CurrentUserId):
    row = account_service.update_account(
        user_id, account_id, body.model_dump(exclude_unset=True)
    )
    if not row:
        raise HTTPException(404, detail="Account not found")
    return _out(row)


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: str, user_id: CurrentUserId):
    ok = account_service.delete_account(user_id, account_id)
    if not ok:
        raise HTTPException(404, detail="Account not found")
