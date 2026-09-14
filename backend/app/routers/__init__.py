from fastapi import APIRouter

from app.routers import (
    accounts,
    activity,
    auth,
    categories,
    contacts,
    dashboard,
    export,
    telegram,
    transactions,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(export.router, prefix="/export", tags=["export"])
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
