from __future__ import annotations

import json
from collections import Counter
from typing import Any

from brief import node
from config import FIXTURE_DIR
from public_channels import hydrate_public_channels
from util import brief_hash, host_of


def _canonical_host(value: str | None) -> str:
    host = host_of(value)
    return "ruby.com" if host == "callruby.com" else host


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
    # The confirmed brief is the research scope. A cached library must not
    # silently reintroduce competitors the user removed from that brief.
    brief = run.get("brief")
    if isinstance(brief, dict) and isinstance(brief.get("nodes"), list):
        domains = {_canonical_host(n.get("domain")) for n in brief["nodes"] if n.get("branch") == "competitors"}
        ads["subjects"] = [s for s in ads.get("subjects", []) if s.get("kind") == "self" or _canonical_host(s.get("domain")) in domains]
    subjects = ads.get("subjects", [])
    records = [ad for subject in subjects for ad in (
        (subject.get("meta") or {}).get("ads", [])
        + (subject.get("google") or {}).get("ads", [])
        + subject.get("other_ads", [])
    )]
    count = len(records)
    source_count = sum(len(s.get("sources", [])) for s in subjects)
    ads["coverage"] = [f"{len(subjects)} brands · {count} saved ad/campaign records · {source_count} source records", "Saved records include historical ads and labeled third-party evidence. They are not campaign totals."]
    ads["analysis_stats"] = {
        **(ads.get("analysis_stats") or {}),
        "subjects": len(subjects),
        "competitors": sum(s.get("kind") == "competitor" for s in subjects),
        "ad_records": count,
        "sources": source_count,
        "by_platform": dict(Counter(ad.get("platform") for ad in records)),
        "brand_matched_meta_records": sum(ad.get("platform") == "meta" for ad in records),
        "meta_unique_copy_fingerprints": len({ad["creative_fingerprint"] for ad in records if ad.get("creative_fingerprint")}),
    }
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
    previous_defaults = {_canonical_host(n.get("domain")) for n in fixture if n.get("domain") != "sonant.ai"}
    if run.get("source") == "fixture" and {_canonical_host(n.get("domain")) for n in comps} == previous_defaults:
        # Migrate the complete legacy set for the requested Sonant addition.
        # Smaller/custom selections remain untouched.
        sonant = next((dict(n) for n in fixture if n.get("domain") == "sonant.ai"), None)
        if sonant:
            mp["nodes"] = nodes + [sonant]
            brief = run.get("brief")
            if isinstance(brief, dict) and {_canonical_host(n.get("domain")) for n in brief.get("nodes", []) if n.get("branch") == "competitors"} == previous_defaults:
                brief["nodes"] = list(brief["nodes"]) + [dict(sonant)]
                version_input = {k: v for k, v in brief.items() if k != "version"}
                brief["version"] = run["brief_version"] = brief_hash(version_input)
            return run
    if comps and all(n.get("domain") in allowed for n in comps):
        return run
    if run.get("confirmed_at") or run.get("source") != "fixture":
        return run
    mp["nodes"] = others + fixture
    return run


def hydrate_ads(run: dict[str, Any]) -> dict[str, Any]:
    hydrate_public_channels(run)
    hydrate_map(run)
    if not is_superagent(str(run.get("domain") or "")):
        return run
    pack = load_pack()
    library = load_library()
    current = run.get("ads") or {}
    # Upgrade persisted research snapshots too, without changing live research,
    # the approved brief, generated creatives, or the current workflow step.
    if (current.get("subjects") and current.get("source", "fixture" if run.get("source") == "fixture" else "live") in {"fixture", "public_snapshot"}
            and current.get("research_version") != library.get("research_version")):
        status, step = run.get("status"), run.get("step")
        apply_ads(run)
        run["insights"] = _scoped_insights(run, pack)
        run["status"], run["step"] = status, step
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
    run["insights"] = _scoped_insights(run, pack)
    run["concepts"] = pack.get("concepts") or []
    run["status"] = "ready"
    return run


def _scoped_insights(run: dict[str, Any], pack: dict[str, Any]) -> list[dict[str, Any]]:
    source_ids = {source.get("id") for s in (run.get("ads") or {}).get("subjects", []) for source in s.get("sources", [])}
    return [i for i in pack.get("insights", []) if all(e.get("source_id") in source_ids for e in i.get("evidence", []) if e.get("source_id"))]


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
