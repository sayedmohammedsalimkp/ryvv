from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    status: str
    time: datetime


class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: str | None = None
    currency: str = "INR"


class UserUpdate(BaseModel):
    full_name: str | None = None


class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str | None = None
    email: str | None = None
    note: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = None
    email: str | None = None
    note: str | None = None


class ContactOut(BaseModel):
    id: UUID
    name: str
    phone: str | None = None
    email: str | None = None
    note: str | None = None
    balance_paise: int = 0
    created_at: datetime | None = None


TxnType = Literal["income", "expense", "gave", "received", "borrowed", "lent", "settle"]
AccountType = Literal["upi", "bank", "other", "cash"]  # cash = legacy only
CategoryKind = Literal["income", "expense"]


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    type: AccountType = "upi"
    opening_balance_rupees: float = 0


class AccountUpdate(BaseModel):
    name: str | None = None
    type: AccountType | None = None
    opening_balance_rupees: float | None = None


class AccountOut(BaseModel):
    id: UUID
    name: str
    type: AccountType
    opening_balance_paise: int
    balance_paise: int = 0


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    kind: CategoryKind


class CategoryOut(BaseModel):
    id: UUID
    name: str
    kind: CategoryKind
    is_system: bool = False


class TransactionCreate(BaseModel):
    type: TxnType
    amount_rupees: float = Field(gt=0)
    txn_date: date | None = None
    note: str | None = None
    contact_id: UUID | None = None
    account_id: UUID | None = None
    category_id: UUID | None = None


class TransactionUpdate(BaseModel):
    type: TxnType | None = None
    amount_rupees: float | None = Field(default=None, gt=0)
    txn_date: date | None = None
    note: str | None = None
    contact_id: UUID | None = None
    account_id: UUID | None = None
    category_id: UUID | None = None


class TransactionOut(BaseModel):
    id: UUID
    type: TxnType
    amount_paise: int
    amount_rupees: float
    txn_date: date
    note: str | None = None
    contact_id: UUID | None = None
    contact_name: str | None = None
    account_id: UUID | None = None
    account_name: str | None = None
    category_id: UUID | None = None
    category_name: str | None = None
    settled_at: datetime | None = None
    created_at: datetime | None = None


class AccountBalanceOut(BaseModel):
    id: UUID
    name: str
    type: AccountType
    balance_paise: int


class MonthStatOut(BaseModel):
    year: int
    month: int
    label: str
    is_current: bool = False
    income_paise: int
    expense_paise: int
    net_paise: int


class ActivityOut(BaseModel):
    id: UUID
    action: str
    entity_type: str
    entity_id: str | None = None
    title: str
    detail: str | None = None
    amount_paise: int | None = None
    created_at: datetime | None = None


class DashboardOut(BaseModel):
    total_balance_paise: int
    accounts_balance_paise: int = 0
    on_hand_paise: int = 0
    accounts: list[AccountBalanceOut] = []
    month_income_paise: int
    month_expense_paise: int
    month_net_paise: int
    months: list[MonthStatOut] = []
    you_will_get_paise: int = 0
    you_will_give_paise: int = 0
    get_contacts: list[ContactOut] = []
    give_contacts: list[ContactOut] = []
    unsettled_contacts: list[ContactOut] = []
    contacts: list[ContactOut] = []
    recent: list[TransactionOut] = []
    activity: list[ActivityOut] = []
