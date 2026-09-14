"""Sentry bootstrap for the FastAPI app."""

from __future__ import annotations

import logging

from app.core.config import get_settings

log = logging.getLogger("ryvv.sentry")


def init_sentry() -> bool:
    settings = get_settings()
    dsn = (settings.SENTRY_DSN or "").strip()
    if not dsn:
        log.info("Sentry off (SENTRY_DSN empty)")
        return False

    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    env = (settings.APP_ENV or "development").lower()
    traces = 0.1 if env == "production" else 0.0

    sentry_sdk.init(
        dsn=dsn,
        environment=env,
        release=settings.SENTRY_RELEASE or None,
        traces_sample_rate=traces,
        profiles_sample_rate=0.0,
        send_default_pii=False,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
    )
    log.info("Sentry on env=%s traces=%s", env, traces)
    return True
