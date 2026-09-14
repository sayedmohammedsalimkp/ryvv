"""Contact name matching — exact, substring, then fuzzy (typos like rahal→rahul)."""

from __future__ import annotations

from difflib import SequenceMatcher


def match_contacts(
    contacts: list[dict],
    name: str | None,
    *,
    fuzzy_threshold: float = 0.72,
    limit: int = 5,
) -> dict:
    """
    Return {
      matches: list[dict],          # exact / substring first, else fuzzy
      mode: "exact" | "substring" | "fuzzy" | "none",
      query: str,
    }
    """
    if not name:
        return {"matches": [], "mode": "none", "query": ""}
    q = name.lower().strip()
    if not q:
        return {"matches": [], "mode": "none", "query": ""}

    exact = [c for c in contacts if (c.get("name") or "").lower() == q]
    if exact:
        return {"matches": exact[:limit], "mode": "exact", "query": name.strip()}

    substr = [c for c in contacts if q in (c.get("name") or "").lower()]
    if substr:
        return {"matches": substr[:limit], "mode": "substring", "query": name.strip()}

    scored: list[tuple[float, dict]] = []
    for c in contacts:
        n = (c.get("name") or "").lower()
        if not n:
            continue
        ratio = SequenceMatcher(None, q, n).ratio()
        # Bonus if same first letter and close length (typo-friendly)
        if q[0] == n[0] and abs(len(q) - len(n)) <= 2:
            ratio = min(1.0, ratio + 0.05)
        if ratio >= fuzzy_threshold:
            scored.append((ratio, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    fuzzy = [c for _, c in scored[:limit]]
    if fuzzy:
        return {"matches": fuzzy, "mode": "fuzzy", "query": name.strip()}

    return {"matches": [], "mode": "none", "query": name.strip()}
