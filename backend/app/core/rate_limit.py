"""Shared SlowAPI limiter — import `limiter` and decorate routes."""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

# In-memory per-process limits. Fine for one dyno; add Redis URL later if scaled out.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    headers_enabled=False,
)
