from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.core.deps import CurrentUserId
from app.schemas.money import TransactionCreate, TransactionOut, TransactionUpdate
from app.services import transactions as txn_service

router = APIRouter()


def _out(row: dict) -> TransactionOut:
    return TransactionOut(
        id=row["id"],
        type=row["type"],
        amount_paise=row["amount_paise"],
        amount_rupees=row["amount_rupees"],
        txn_date=row["txn_date"],
        note=row.get("note"),
        contact_id=row.get("contact_id"),
        contact_name=row.get("contact_name"),
        account_id=row.get("account_id"),
        account_name=row.get("account_name"),
        category_id=row.get("category_id"),
        category_name=row.get("category_name"),
        settled_at=row.get("settled_at"),
        created_at=row.get("created_at"),
    )


@router.get("", response_model=list[TransactionOut])
def list_txns(
    user_id: CurrentUserId,
    contact_id: str | None = None,
    account_id: str | None = None,
    on_hand: bool = Query(False),
    type: str | None = Query(None, alias="type"),
    category_id: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    rows = txn_service.list_transactions(
        user_id,
        contact_id=contact_id,
        account_id=account_id,
        on_hand=on_hand,
        txn_type=type,
        category_id=category_id,
        date_from=date_from,
        date_to=date_to,
    )
    return [_out(r) for r in rows]


@router.post("", response_model=TransactionOut, status_code=201)
def create_txn(body: TransactionCreate, user_id: CurrentUserId):
    row = txn_service.create_transaction(user_id, body.model_dump())
    return _out(row)


@router.get("/{txn_id}", response_model=TransactionOut)
def get_txn(txn_id: str, user_id: CurrentUserId):
    row = txn_service.get_transaction(user_id, txn_id)
    if not row:
        raise HTTPException(404, detail="Transaction not found")
    return _out(row)


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_txn(txn_id: str, body: TransactionUpdate, user_id: CurrentUserId):
    row = txn_service.update_transaction(
        user_id, txn_id, body.model_dump(exclude_unset=True)
    )
    if not row:
        raise HTTPException(404, detail="Transaction not found")
    return _out(row)


@router.delete("/{txn_id}", status_code=204)
def delete_txn(txn_id: str, user_id: CurrentUserId):
    ok = txn_service.delete_transaction(user_id, txn_id)
    if not ok:
        raise HTTPException(404, detail="Transaction not found")


@router.post("/{txn_id}/settle", response_model=TransactionOut)
def settle_txn(txn_id: str, user_id: CurrentUserId):
    row = txn_service.settle_transaction(user_id, txn_id)
    if not row:
        raise HTTPException(404, detail="Transaction not found")
    return _out(row)
