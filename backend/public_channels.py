"""Attach reviewed public channel evidence without altering campaign or ad data."""
from __future__ import annotations

import json
from typing import Any

from config import FIXTURE_DIR
from util import host_of


def hydrate_public_channels(run: dict[str, Any]) -> dict[str, Any]:
    path = FIXTURE_DIR / "channels.json"
    snapshot = json.loads(path.read_text(encoding="utf-8"))
    if host_of(run.get("domain") or "") != snapshot["domain"]:
        return run
    current = run.get("public_channels")
    if not current or (
        current.get("source") == "public_snapshot"
        and current.get("domain") == snapshot["domain"]
        and current.get("version") != snapshot["version"]
    ):
        run["public_channels"] = snapshot
    return run
