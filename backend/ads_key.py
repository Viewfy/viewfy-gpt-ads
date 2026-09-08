from __future__ import annotations

import json
from pathlib import Path

from config import DATA_DIR, OPENAI_ADS_API_KEY


def _path(run_id: str) -> Path:
    return DATA_DIR / f"{run_id}.ads.json"


def save_key(run_id: str, key: str) -> None:
    _path(run_id).write_text(json.dumps({"key": key.strip()}), encoding="utf-8")


def load_key(run_id: str) -> str:
    p = _path(run_id)
    if not p.exists():
        return ""
    try:
        return str((json.loads(p.read_text(encoding="utf-8")) or {}).get("key") or "").strip()
    except Exception:
        return ""


def key_for(run_id: str | None = None) -> str:
    if run_id:
        found = load_key(run_id)
        if found:
            return found
    return OPENAI_ADS_API_KEY
