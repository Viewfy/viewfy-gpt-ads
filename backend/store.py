from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import DATA_DIR

_lock = threading.Lock()


def empty_tracking() -> dict[str, Any]:
    return {
        "status": "idle",
        "login": None,
        "repos": [],
        "repo": None,
        "agent_id": None,
        "pr_url": None,
        "snippet": None,
        "note": None,
        "error": None,
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _path(run_id: str) -> Path:
    return DATA_DIR / f"{run_id}.json"


def new_run(domain: str) -> dict[str, Any]:
    run = {
        "id": str(uuid.uuid4()),
        "domain": domain,
        "step": "understanding",
        "status": "crawling",
        "error": None,
        "source": "live",
        "brand": {"name": "", "one_liner": "", "logo_url": None, "colors": [], "category": ""},
        "pages": [],
        "map": {"nodes": [], "missing": []},
        "brief": None,
        "brief_version": None,
        "confirmed_at": None,
        "ads": {"status": "idle", "subjects": [], "error": None},
        "insights": [],
        "concepts": [],
        "selected_concept_id": None,
        "creative": None,
        "campaign": {
            "status": "draft",
            "mode": "unconnected",
            "connected": False,
            "budget_usd": 25,
            "geo": ["US"],
            "account": None,
            "external_ids": {},
            "error": None,
        },
        "tracking": empty_tracking(),
        "stale": {"research": False, "concepts": False, "creatives": False},
        "created_at": _now(),
        "updated_at": _now(),
    }
    save(run)
    return run


def save(run: dict[str, Any]) -> dict[str, Any]:
    run["updated_at"] = _now()
    with _lock:
        _path(run["id"]).write_text(json.dumps(run, indent=2), encoding="utf-8")
    return run


def get(run_id: str) -> dict[str, Any] | None:
    # Run identifiers are public bearer links, never arbitrary data filenames.
    try:
        if str(uuid.UUID(run_id)) != run_id:
            return None
    except (ValueError, TypeError, AttributeError):
        return None
    p = _path(run_id)
    if not p.exists():
        return None
    with _lock:
        run = json.loads(p.read_text(encoding="utf-8"))
    if "tracking" not in run:
        run["tracking"] = empty_tracking()
    migrated = False
    campaign = run.get("campaign") or {}
    if campaign.get("mode") == "demo":
        campaign.update({
            "status": "draft", "mode": "unconnected", "connected": False,
            "account": None, "external_ids": {}, "insights": None,
            "note": None, "review_status": None, "error": None,
        })
        campaign.pop("review", None)
        run["campaign"] = campaign
        if run.get("step") in {"autopilot", "done"}:
            run["step"] = "ads"
            run["status"] = "ready"
        migrated = True
    tracking = run.get("tracking") or {}
    old_note = str(tracking.get("note") or "").strip().lower()
    if tracking.get("login") == "astra-demo" or old_note.startswith(("demo", "mock")) or "demo pull request" in old_note:
        run["tracking"] = {
            **empty_tracking(), "status": "error",
            "error": "Connect GitHub to set up conversion tracking. No verified connection or pull request is saved.",
        }
        migrated = True
    if migrated:
        save(run)
    return run


def update(run_id: str, **fields: Any) -> dict[str, Any] | None:
    run = get(run_id)
    if not run:
        return None
    run.update(fields)
    return save(run)
