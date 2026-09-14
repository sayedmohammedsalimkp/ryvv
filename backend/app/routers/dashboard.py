from fastapi import APIRouter

from app.core.deps import CurrentUserId
from app.schemas.money import (
    AccountBalanceOut,
    ActivityOut,
    ContactOut,
    DashboardOut,
    MonthStatOut,
    TransactionOut,
)
from app.services.dashboard import dashboard_summary

router = APIRouter()


def _contact(c: dict) -> ContactOut:
    return ContactOut(
        id=c["id"],
        name=c["name"],
        phone=c.get("phone"),
        email=c.get("email"),
        note=c.get("note"),
        balance_paise=int(c.get("balance_paise") or 0),
        created_at=c.get("created_at"),
    )


def _txn(r: dict) -> TransactionOut:
    return TransactionOut(
        id=r["id"],
        type=r["type"],
        amount_paise=r["amount_paise"],
        amount_rupees=r["amount_rupees"],
        txn_date=r["txn_date"],
        note=r.get("note"),
        contact_id=r.get("contact_id"),
        contact_name=r.get("contact_name"),
        account_id=r.get("account_id"),
        account_name=r.get("account_name"),
        category_id=r.get("category_id"),
        category_name=r.get("category_name"),
        settled_at=r.get("settled_at"),
        created_at=r.get("created_at"),
    )


def _activity(r: dict) -> ActivityOut:
    return ActivityOut(
        id=r["id"],
        action=r["action"],
        entity_type=r["entity_type"],
        entity_id=r.get("entity_id"),
        title=r["title"],
        detail=r.get("detail"),
        amount_paise=r.get("amount_paise"),
        created_at=r.get("created_at"),
    )


@router.get("/summary", response_model=DashboardOut)
def summary(user_id: CurrentUserId):
    data = dashboard_summary(user_id)
    return DashboardOut(
        total_balance_paise=data["total_balance_paise"],
        accounts_balance_paise=data["accounts_balance_paise"],
        on_hand_paise=data["on_hand_paise"],
        accounts=[
            AccountBalanceOut(
                id=a["id"],
                name=a["name"],
                type=a["type"],
                balance_paise=a["balance_paise"],
            )
            for a in data["accounts"]
        ],
        month_income_paise=data["month_income_paise"],
        month_expense_paise=data["month_expense_paise"],
        month_net_paise=data["month_net_paise"],
        months=[MonthStatOut(**m) for m in data["months"]],
        you_will_get_paise=data["you_will_get_paise"],
        you_will_give_paise=data["you_will_give_paise"],
        get_contacts=[_contact(c) for c in data["get_contacts"]],
        give_contacts=[_contact(c) for c in data["give_contacts"]],
        unsettled_contacts=[_contact(c) for c in data["unsettled_contacts"]],
        contacts=[_contact(c) for c in data["contacts"]],
        recent=[_txn(r) for r in data["recent"]],
        activity=[_activity(r) for r in data["activity"]],
    )
