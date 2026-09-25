<h1 align="center">RYVV</h1>

<p align="center">
  <strong>Your money, tracked from chat.</strong><br>
  India-first personal money manager — Telegram, web, and Android. Indian ₹.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Android-Kotlin-7F52FF?logo=kotlin&logoColor=white" alt="Kotlin">
  <img src="https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white" alt="Telegram">
  <img src="https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white" alt="Supabase">
</p>

<p align="center">
  <img src="docs/screens/landing-light.png" alt="RYVV landing — light mode" width="920">
</p>

Create a RYVV account, link Telegram, then log money by texting or talking. Everything syncs to the dashboard.

---

## What you get

| | |
|---|---|
| **Chat ledger** | `gave rahul 500` · Hindi + English · voice notes via Groq |
| **Who owes whom** | Contacts, gave / got / borrowed / lent / settle |
| **Where money lives** | On hand, UPI, bank, other accounts |
| **Full picture** | Dashboard, activity, categories, income / expense |
| **Share** | CSV + PDF statements |
| **Native app** | Kotlin + Compose Android — same API as web |

---

## Screens

<p align="center">
  <img src="docs/screens/landing-dark.png" alt="RYVV landing — dark mode" width="920">
</p>

<p align="center">
  <img src="docs/screens/landing-mobile-light.png" alt="RYVV mobile — light" width="280">
  &nbsp;&nbsp;
  <img src="docs/screens/landing-mobile-dark.png" alt="RYVV mobile — dark" width="280">
</p>

---

## Repo

```
ryvv/
├── frontend/      Next.js 14 web app + landing
├── backend/       FastAPI + Telegram bot + Groq
├── android-app/   Kotlin Jetpack Compose
└── docs/screens/  Product screenshots
```

Auth and data live in **Supabase**. Web, Android, and Telegram all hit the same FastAPI.

| Doc | For |
|---|---|
| [`backend/TELEGRAM.md`](backend/TELEGRAM.md) | Bot, link codes, webhook, Groq |
| [`android-app/README.md`](android-app/README.md) | Android Studio, emulator, APK |
| [`GO_LIVE.md`](GO_LIVE.md) | Render API, Vercel web, health, rate limits |

---

## Run locally

### 1. Database

Run SQL in the Supabase editor:

- [`backend/supabase/migrations/00001_money_init.sql`](backend/supabase/migrations/00001_money_init.sql)
- [`backend/supabase/migrations/00005_telegram.sql`](backend/supabase/migrations/00005_telegram.sql) (bot tables)

### 2. API

```powershell
cd backend
copy .env.example .env
# fill SUPABASE_* keys
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API → http://localhost:8000 &nbsp;·&nbsp; Docs → http://localhost:8000/docs

### 3. Web

```powershell
cd frontend
copy .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_* and NEXT_PUBLIC_API_URL
npm install
npm run dev
```

App → http://localhost:3000

### 4. Telegram (optional)

See [`backend/TELEGRAM.md`](backend/TELEGRAM.md). Local: `TELEGRAM_MODE=polling`. Link from **Profile → Generate link code**, then `/start CODE` in the bot.

### 5. Android (optional)

Open `android-app/` in Android Studio. Point `API_BASE_URL` at your machine (`10.0.2.2:8000` on emulator). Details in [`android-app/README.md`](android-app/README.md).

---

## How money is logged

```
Create account  →  Link Telegram  →  "gave amit 500 lunch"  →  Dashboard
```

Same rupee in chat, web, and phone. Confirm in Telegram when the bot is unsure. PDF when you need a statement.

---

## Go live

[`GO_LIVE.md`](GO_LIVE.md) — Docker / Render for the API (`Dockerfile`, `render.yaml`), Vercel for the web app, Sentry, `/health` + `/ready`.
