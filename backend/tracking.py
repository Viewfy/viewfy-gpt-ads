from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import DATA_DIR, PIXEL_PUBLIC_URL
from store import empty_tracking


def tracking_of(run: dict[str, Any]) -> dict[str, Any]:
    cur = dict(empty_tracking())
    cur.update(run.get("tracking") or {})
    return cur


def snippet_for(run_id: str) -> str:
    return f'<script src="{PIXEL_PUBLIC_URL}/astra.js" data-id="{run_id}" async></script>'


def apply_tracking(run: dict[str, Any], *, repo: str | None = None, pr_url: str | None = None, mock: bool = False) -> dict[str, Any]:
    track = tracking_of(run)
    repo = repo or track.get("repo") or "getsuperagent/superagent"
    track.update(
        {
            "status": "pr_ready",
            "repo": repo,
            "pr_url": pr_url or f"https://github.com/{repo}/pull/12",
            "snippet": snippet_for(run["id"]),
            "note": "Mock. GPT6 Astra opened a demo pull request." if mock else "GPT6 Astra opened a pull request with the Astra pixel.",
            "error": None,
        }
    )
    run["tracking"] = track
    return run


def record_event(payload: dict[str, Any]) -> None:
    pid = str(payload.get("pid") or "unknown")
    path = Path(DATA_DIR) / "events"
    path.mkdir(parents=True, exist_ok=True)
    row = dict(payload)
    row["received_at"] = datetime.now(timezone.utc).isoformat()
    with (path / f"{pid}.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
