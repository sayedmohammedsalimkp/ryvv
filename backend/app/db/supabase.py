from functools import lru_cache
import time

import httpx
from postgrest.exceptions import APIError
from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings


def _http_client() -> httpx.Client:
    # HTTP/2 on Windows often throws WinError 10035 with supabase-py/httpx.
    # Longer read timeout — Supabase free / cold projects are slow from Render.
    return httpx.Client(
        http2=False,
        timeout=httpx.Timeout(90.0, connect=20.0),
    )


def is_transient_supabase(err: BaseException) -> bool:
    blob = f"{getattr(err, 'code', '')} {err}".lower()
    return any(
        x in blob
        for x in ("504", "502", "503", "401", "timeout", "gateway", "api key info")
    )


def execute_retry(build, attempts: int = 4):
    """Rebuild query each try; retry transient Supabase gateway / key blips."""
    last: Exception | None = None
    for i in range(attempts):
        try:
            return build().execute()
        except APIError as e:
            last = e
            if not is_transient_supabase(e) or i == attempts - 1:
                raise
            time.sleep(0.5 * (i + 1))
    raise last  # pragma: no cover


@lru_cache
def get_service_client() -> Client:
    settings = get_settings()
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
        options=ClientOptions(httpx_client=_http_client()),
    )


@lru_cache
def get_anon_client() -> Client:
    settings = get_settings()
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY,
        options=ClientOptions(httpx_client=_http_client()),
    )
