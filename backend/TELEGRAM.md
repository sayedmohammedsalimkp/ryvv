# RYVV Telegram + Groq

Chat bot for money: Gave/Got, balances, settle, PDF, voice, reminders, digest.

## 1. Supabase SQL

Run in SQL editor:

- `backend/supabase/migrations/00005_telegram.sql`

## 2. BotFather

1. Talk to [@BotFather](https://t.me/BotFather) → `/newbot`
2. Copy token → `TELEGRAM_BOT_TOKEN`
3. Username without `@` → `TELEGRAM_BOT_USERNAME`

## 3. Groq

1. [console.groq.com](https://console.groq.com) → API key → `GROQ_API_KEY`
2. Model default: `openai/gpt-oss-20b` (or `openai/gpt-oss-120b`)

## 4. Backend `.env`

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=YourBot
TELEGRAM_WEBHOOK_SECRET=long-random
TELEGRAM_MODE=polling
GROQ_API_KEY=...
GROQ_MODEL=openai/gpt-oss-20b
```

Install deps:

```powershell
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## 5. Run (local)

```powershell
uvicorn app.main:app --reload --port 8000
```

`TELEGRAM_MODE=polling` long-polls Telegram (no public URL needed).

## 6. Link account

1. App → Profile → **Generate link code**
2. Telegram → `/start 123456` (or deep link)
3. Try: `Gave Amit 500 lunch`

## 7. Production webhook

```env
TELEGRAM_MODE=webhook
```

Set webhook (replace URL + secret):

```powershell
curl "https://api.telegram.org/bot$TOKEN/setWebhook?url=https://YOUR_API/api/v1/telegram/webhook&secret_token=YOUR_SECRET"
```

## 8. Cron jobs

Every minute (reminders). Digests auto at **8:00 IST** when jobs run:

```http
POST /api/v1/telegram/jobs/run
Header: X-Jobs-Secret: YOUR_SECRET
```

Force digests: `?force_digest=true`

## Commands

| Command | Action |
|--------|--------|
| `/help` | Help |
| `/balance` | Totals + On hand |
| `/contacts` `/get` `/give` | People balances |
| `/settle Name` | Settle → ₹0 (confirm) |
| `/report Name` | PDF statement |
| `/digest` | Snapshot now |
| `/remind …` | Reminder |
| `/status` `/unlink` | Link status |

Natural language (Hindi/English) + **voice notes** also work via Groq.
