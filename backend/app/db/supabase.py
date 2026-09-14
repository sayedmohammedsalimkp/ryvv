from functools import lru_cache

import httpx
from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings


def _http_client() -> httpx.Client:
    # HTTP/2 on Windows often throws WinError 10035 with supabase-py/httpx.
    return httpx.Client(
        http2=False,
        timeout=httpx.Timeout(60.0, connect=15.0),
    )


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
