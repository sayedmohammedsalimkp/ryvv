from fastapi import APIRouter, HTTPException, Query

from app.core.deps import CurrentUserId
from app.schemas.money import ContactCreate, ContactOut, ContactUpdate
from app.services import contacts as contact_service

router = APIRouter()


def _out(row: dict) -> ContactOut:
    return ContactOut(
        id=row["id"],
        name=row["name"],
        phone=row.get("phone"),
        email=row.get("email"),
        note=row.get("note"),
        balance_paise=int(row.get("balance_paise") or 0),
        created_at=row.get("created_at"),
    )


@router.get("", response_model=list[ContactOut])
def list_contacts(user_id: CurrentUserId, q: str | None = Query(None)):
    return [_out(r) for r in contact_service.list_contacts(user_id, q)]


@router.post("", response_model=ContactOut, status_code=201)
def create_contact(body: ContactCreate, user_id: CurrentUserId):
    row = contact_service.create_contact(user_id, body.model_dump())
    return _out(row)


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(contact_id: str, user_id: CurrentUserId):
    row = contact_service.get_contact(user_id, contact_id)
    if not row:
        raise HTTPException(404, detail="Contact not found")
    return _out(row)


@router.get("/{contact_id}/balance", response_model=ContactOut)
def contact_balance(contact_id: str, user_id: CurrentUserId):
    row = contact_service.get_contact(user_id, contact_id)
    if not row:
        raise HTTPException(404, detail="Contact not found")
    return _out(row)


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: str, body: ContactUpdate, user_id: CurrentUserId):
    row = contact_service.update_contact(user_id, contact_id, body.model_dump(exclude_unset=True))
    if not row:
        raise HTTPException(404, detail="Contact not found")
    return _out(row)


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: str, user_id: CurrentUserId):
    ok = contact_service.delete_contact(user_id, contact_id)
    if not ok:
        raise HTTPException(404, detail="Contact not found")


@router.post("/{contact_id}/settle", response_model=ContactOut)
def settle_contact(contact_id: str, user_id: CurrentUserId):
    row = contact_service.settle_contact(user_id, contact_id)
    if not row:
        raise HTTPException(404, detail="Contact not found")
    return _out(row)
