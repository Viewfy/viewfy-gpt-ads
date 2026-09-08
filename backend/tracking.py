from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from config import DATA_DIR, PIXEL_PUBLIC_URL
from store import empty_tracking


def tracking_of(run: dict[str, Any]) -> dict[str, Any]:
    cur = dict(empty_tracking())
    cur.update(run.get("tracking") or {})
    return cur


def snippet_for(run_id: str) -> str:
    return f'<script src="{PIXEL_PUBLIC_URL}/astra.js" data-id="{run_id}" async></script>'


def apply_tracking(run: dict[str, Any], *, repo: str | None = None, pr_url: str | None = None) -> dict[str, Any]:
    track = tracking_of(run)
    repo = repo or track.get("repo")
    if not repo or "/" not in repo:
        raise RuntimeError("No repository is selected for conversion tracking.")
    parsed = urlparse(pr_url or "")
    if parsed.scheme != "https" or parsed.hostname != "github.com" or not re.fullmatch(rf"/{re.escape(repo)}/pull/[1-9][0-9]*/?", parsed.path, re.I):
        raise RuntimeError("GitHub did not return a verified pull request URL. Conversion tracking is not ready.")
    track.update(
        {
            "status": "pr_ready",
            "repo": repo,
            "pr_url": pr_url,
            "snippet": snippet_for(run["id"]),
            "note": "GPT6 Astra opened a pull request with the Astra pixel.",
            "error": None,
        }
    )
    run["tracking"] = track
    return run


def record_event(payload: dict[str, Any]) -> None:
    pid = str(payload.get("pid") or "unknown")
    try:
        if str(uuid.UUID(pid)) != pid:
            return
    except ValueError:
        return
    path = Path(DATA_DIR) / "events"
    path.mkdir(parents=True, exist_ok=True)
    row = dict(payload)
    row["received_at"] = datetime.now(timezone.utc).isoformat()
    with (path / f"{pid}.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(row) + "\n")
