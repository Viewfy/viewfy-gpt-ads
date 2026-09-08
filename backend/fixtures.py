from __future__ import annotations

import json
from typing import Any

from brief import node
from config import FIXTURE_DIR
from tracking import apply_tracking
from util import host_of


def is_superagent(domain: str) -> bool:
    return host_of(domain) in {"getsuperagent.com", "getsuperagent.me", "superagent.ai"}


def load_pack() -> dict[str, Any]:
    return json.loads((FIXTURE_DIR / "run.json").read_text(encoding="utf-8"))


def load_library() -> dict[str, Any]:
    path = FIXTURE_DIR / "library.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return (load_pack().get("ads") or {})


def apply_crawl(run: dict[str, Any]) -> dict[str, Any]:
    pack = load_pack()
    run["source"] = "fixture"
    run["brand"] = pack["brand"]
    run["pages"] = pack["pages"]
    nodes = []
    for raw in pack["nodes"]:
        n = node(raw["branch"], raw["text"], raw.get("source_url"), raw["provenance"], raw.get("domain") or "")
        n["id"] = raw.get("id") or n["id"]
        nodes.append(n)
    run["map"] = {"nodes": nodes, "missing": pack.get("missing") or []}
    run["status"] = "ready"
    run["step"] = "confirmation"
    run["error"] = None
    return run


def apply_ads(run: dict[str, Any]) -> dict[str, Any]:
    ads = dict(load_library())
    ads["brief_version"] = run.get("brief_version")
    ads["source"] = ads.get("source") or "fixture"
    ads["status"] = "ready"
    run["ads"] = ads
    run["status"] = "ready"
    run["step"] = "research"
    return run


def _fixture_competitors() -> list[dict[str, Any]]:
    return [dict(n) for n in load_pack().get("nodes") or [] if n.get("branch") == "competitors"]


def hydrate_map(run: dict[str, Any]) -> dict[str, Any]:
    if not is_superagent(str(run.get("domain") or "")):
        return run
    fixture = _fixture_competitors()
    if not fixture:
        return run
    allowed = {n.get("domain") for n in fixture}
    mp = run.setdefault("map", {"nodes": [], "missing": []})
    nodes = list(mp.get("nodes") or [])
    comps = [n for n in nodes if n.get("branch") == "competitors"]
    others = [n for n in nodes if n.get("branch") != "competitors"]
    if comps and all(n.get("domain") in allowed for n in comps):
        return run
    mp["nodes"] = others + fixture
    return run


def hydrate_ads(run: dict[str, Any]) -> dict[str, Any]:
    hydrate_map(run)
    if not is_superagent(str(run.get("domain") or "")):
        return run
    pack = load_pack()
    extra = [dict(c) for c in pack.get("creatives") or []]
    if not extra:
        return run
    existing = [dict(c) for c in run.get("creatives") or []]
    seen = {c.get("id") for c in existing}
    for item in extra:
        if item.get("id") not in seen:
            existing.append(item)
    run["creatives"] = existing
    if not run.get("creative"):
        run["creative"] = existing[0]
    return run


def apply_insights(run: dict[str, Any]) -> dict[str, Any]:
    pack = load_pack()
    run["insights"] = pack.get("insights") or []
    run["concepts"] = pack.get("concepts") or []
    run["status"] = "ready"
    return run


def apply_creative(run: dict[str, Any]) -> dict[str, Any]:
    pack = load_pack()
    concept = next((c for c in run.get("concepts") or [] if c.get("id") == run.get("selected_concept_id")), None)
    creative = dict(pack.get("creative") or {})
    if concept:
        creative["concept_id"] = concept.get("id")
        creative["title"] = concept.get("headline") or creative.get("title")
        creative["body"] = concept.get("body") or creative.get("body")
        creative["cta"] = concept.get("cta") or creative.get("cta")
    creative["target_url"] = f"https://{run.get('domain')}"
    creative["brief_version"] = run.get("brief_version")
    creative["image_url"] = creative.get("image_url") or "/superagent-ads.png"
    creative["format"] = "chat_card"
    creatives = [dict(c) for c in pack.get("creatives") or []]
    if not creatives:
        creatives = [creative]
    run["creatives"] = creatives
    pick = run.get("selected_concept_id")
    run["creative"] = next((c for c in creatives if c.get("concept_id") == pick or c.get("id") == pick), creatives[0])
    run["status"] = "ready"
    run["step"] = "creatives"
    run["error"] = None
    return run


def apply_launch(run: dict[str, Any], budget_usd: float = 25, geo: list[str] | None = None) -> dict[str, Any]:
    campaign = dict(run.get("campaign") or {})
    campaign.update(
        {
            "status": "draft",
            "mode": "demo",
            "budget_usd": budget_usd,
            "geo": geo or ["US"],
            "error": None,
            "note": "Mock. Nothing was submitted or spent.",
            "connected": True,
        }
    )
    campaign["account"] = campaign.get("account") or {"id": "adacct_demo", "name": "Demo Ads Manager"}
    run["campaign"] = campaign
    run["step"] = "autopilot"
    run["status"] = "ready"
    return run


def apply_github(run: dict[str, Any]) -> dict[str, Any]:
    from tracking import tracking_of

    track = tracking_of(run)
    track.update(
        {
            "status": "connected",
            "login": "astra-demo",
            "repos": [
                {"full_name": "getsuperagent/superagent", "default_branch": "main", "html_url": "https://github.com/getsuperagent/superagent", "private": False},
                {"full_name": "getsuperagent/web", "default_branch": "main", "html_url": "https://github.com/getsuperagent/web", "private": False},
            ],
            "repo": "getsuperagent/superagent",
            "error": None,
        }
    )
    run["tracking"] = track
    return run


def apply_pixel_pr(run: dict[str, Any], repo: str | None = None) -> dict[str, Any]:
    return apply_tracking(run, repo=repo, mock=True)
