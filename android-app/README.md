# RYVV native Android (Kotlin + Jetpack Compose)

Pure Android app — **not** a WebView wrapper.  
Web stays in `frontend/` (Next.js). Both talk to the same FastAPI + Supabase.

```
android-app/   ← Kotlin Compose (this)
frontend/      ← Next.js web
backend/       ← FastAPI
```

## Open in Android Studio

1. Install [Android Studio](https://developer.android.com/studio) (Ladybug / latest)
2. **File → Open** → `D:\freelance\ryvv\android-app`
3. Let Gradle sync (downloads SDK / deps)
4. Create `local.properties` if missing:

```properties
sdk.dir=C\:\\Users\\YOUR_USER\\AppData\\Local\\Android\\Sdk
```

(Android Studio usually writes this automatically.)

## Point at your API

Edit `app/build.gradle.kts` → `defaultConfig` → `buildConfigField`:

| Field | Emulator | Phone on Wi‑Fi |
|-------|----------|----------------|
| `API_BASE_URL` | `http://10.0.2.2:8000/api/v1` | `http://192.168.29.101:8000/api/v1` (your PC Wi‑Fi IP — run `ipconfig`) |
| Supabase URL / key | same as web `.env` | same |

Then **Sync Gradle**.

## Run

1. Start backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Android Studio → pick emulator / USB device → **Run ▶**
3. Log in with same Supabase email/password as web

## Build APK

**Build → Build Bundle(s) / APK(s) → Build APK(s)**  

Output: `app/build/outputs/apk/debug/app-debug.apk`

## What’s included (native UI)

- Login / signup (Supabase Auth)
- Dashboard (balances, get/give, contacts)
- Contacts + Gave / Got / Settle
- Accounts + On hand + txn lists
- Transactions list
- Profile + Telegram link code
- Sign out

## Later (same app)

Edit/delete polish, PDF share intent, offline cache, Play Store signing.

Web (`frontend/`) is unchanged and still fully usable in the browser.
