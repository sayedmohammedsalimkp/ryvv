from app.db.supabase import get_service_client


DEFAULT_CATEGORIES = [
    ("Salary", "income"),
    ("Other Income", "income"),
    ("Food", "expense"),
    ("Rent", "expense"),
    ("Travel", "expense"),
    ("Shopping", "expense"),
    ("Other", "expense"),
]


def ensure_user_profile(user_id: str, email: str | None = None) -> dict:
    sb = get_service_client()
    existing = sb.table("users").select("*").eq("id", user_id).limit(1).execute()
    if existing.data:
        return existing.data[0]

    name = (email or "user").split("@")[0]
    row = {
        "id": user_id,
        "full_name": name or "Ryvv user",
        "email": email,
        "currency": "INR",
    }
    inserted = sb.table("users").upsert(row).execute()
    profile = (inserted.data or [row])[0]

    # No default accounts — only On hand until user adds one

    cats = sb.table("categories").select("id").eq("user_id", user_id).limit(1).execute()
    if not cats.data:
        sb.table("categories").insert(
            [
                {
                    "user_id": user_id,
                    "name": name_,
                    "kind": kind,
                    "is_system": True,
                }
                for name_, kind in DEFAULT_CATEGORIES
            ]
        ).execute()

    return profile


def get_user(user_id: str) -> dict:
    sb = get_service_client()
    res = sb.table("users").select("*").eq("id", user_id).single().execute()
    return res.data


def update_user(user_id: str, payload: dict) -> dict:
    sb = get_service_client()
    res = sb.table("users").update(payload).eq("id", user_id).execute()
    return res.data[0]
