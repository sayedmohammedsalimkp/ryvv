"""Optional long-polling when no public webhook URL."""

from __future__ import annotations

import asyncio
import logging

import httpx

from app.core.config import get_settings
from app.services.telegram.handlers import process_update

log = logging.getLogger("ryvv.telegram.poll")
_offset = 0


async def poll_loop(stop: asyncio.Event) -> None:
    global _offset
    settings = get_settings()
    token = settings.TELEGRAM_BOT_TOKEN
    if not token:
        log.warning("No TELEGRAM_BOT_TOKEN — poller exit")
        return

    base = f"https://api.telegram.org/bot{token}"
    log.info("Telegram polling starting (deleteWebhook first)…")

    async with httpx.AsyncClient(timeout=60.0, http2=False) as client:
        # Webhook blocks getUpdates — must clear for local polling
        try:
            wr = await client.post(
                f"{base}/deleteWebhook",
                json={"drop_pending_updates": False},
            )
            log.info("deleteWebhook: %s", wr.json())
        except Exception as e:
            log.warning("deleteWebhook failed: %s", e)

        log.info("Telegram polling started")
        while not stop.is_set():
            try:
                r = await client.get(
                    f"{base}/getUpdates",
                    params={
                        "timeout": 25,
                        "offset": _offset,
                        "allowed_updates": json_allowed(),
                    },
                )
                data = r.json()
                if not data.get("ok"):
                    log.warning("getUpdates not ok: %s", data)
                    await asyncio.sleep(3)
                    continue
                for upd in data.get("result") or []:
                    _offset = int(upd["update_id"]) + 1
                    try:
                        kinds = [
                            k
                            for k in (
                                "message",
                                "edited_message",
                                "callback_query",
                            )
                            if upd.get(k)
                        ]
                        log.info("update %s kinds=%s", upd.get("update_id"), kinds)
                        process_update(upd)
                    except Exception:
                        log.exception("update fail")
            except Exception as e:
                log.warning("poll error: %s", e)
                await asyncio.sleep(3)
    log.info("Telegram polling stopped")


def json_allowed() -> str:
    return '["message","callback_query","edited_message"]'
