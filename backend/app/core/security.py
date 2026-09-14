from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import get_settings

_jwks_client: PyJWKClient | None = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(url, cache_keys=True)
    return _jwks_client


def _via_auth_api(token: str) -> dict[str, Any] | None:
    """Validate access token via Supabase Auth /user endpoint."""
    settings = get_settings()
    api_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
    url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
    try:
        resp = httpx.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": api_key,
            },
            timeout=15.0,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        user_id = data.get("id")
        if not user_id:
            return None
        return {"sub": user_id, "email": data.get("email")}
    except Exception:  # noqa: BLE001
        return None


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    errors: list[str] = []

    # 1) JWKS (ES256 / RS256) — new Supabase signing keys
    try:
        key = _get_jwks_client().get_signing_key_from_jwt(token).key
        try:
            return jwt.decode(
                token,
                key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
        except jwt.exceptions.InvalidAudienceError:
            return jwt.decode(
                token,
                key,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )
    except Exception as exc:  # noqa: BLE001
        errors.append(f"jwks:{exc}")

    # 2) Legacy HS256 JWT secret
    if settings.SUPABASE_JWT_SECRET:
        try:
            try:
                return jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            except jwt.exceptions.InvalidAudienceError:
                return jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
        except Exception as exc:  # noqa: BLE001
            errors.append(f"hs256:{exc}")

    # 3) Ask Supabase Auth directly
    payload = _via_auth_api(token)
    if payload:
        return payload
    errors.append("auth_api:rejected")

    detail = "Invalid or expired token"
    if settings.APP_ENV == "development":
        detail = f"Invalid or expired token ({'; '.join(errors)})"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )
