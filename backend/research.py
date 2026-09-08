from __future__ import annotations

import asyncio
import logging
from typing import Any

from brief import approved_competitors
from google_ads import scrape_google, transparency_url
from meta_library import MetaLibrary, MetaLibraryError, SubjectSpec, library_search_url
from util import host_of

log = logging.getLogger(__name__)


def _ad_row(platform: str, ad: Any, advertiser: str, domain: str) -> dict[str, Any]:
    if isinstance(ad, dict):
        return ad
    return {
        "id": ad.archive_id,
        "platform": platform,
        "advertiser": ad.page_name or advertiser,
        "headline": ad.headline,
        "body": ad.body,
        "cta": ad.cta,
        "image_url": ad.image_url,
        "link_url": ad.link_url,
        "format": ad.display_format,
        "started_at": ad.started_at,
        "ended_at": ad.ended_at,
        "is_active": ad.is_active,
        "source_url": ad.library_url,
        "status": "active" if ad.is_active is True else "inactive" if ad.is_active is False else "unknown",
        "last_shown_at": ad.last_shown_at,
        "video_url": ad.video_url,
        "evidence_type": "ad_library",
        "page_id": ad.page_id,
        "page_name": ad.page_name,
        "impressions": ad.impressions,
        "extra": ad.extra,
        "domain": domain,
    }


async def research_ads(brief: dict[str, Any]) -> dict[str, Any]:
    name = brief.get("name") or host_of(brief.get("domain"))
    domain = host_of(brief.get("domain"))
    comps = approved_competitors(brief, 30)
    specs = [SubjectSpec(kind="self", name=name, domain=domain, query=domain)]
    for c in comps:
        host = host_of(c.get("domain")) or host_of(c.get("name"))
        if host:
            specs.append(SubjectSpec(kind="competitor", name=c["name"], domain=host, query=host))

    meta_task = _meta(specs)
    google_tasks = [_google(s) for s in specs]
    meta_subjects, google_subjects = await asyncio.gather(meta_task, asyncio.gather(*google_tasks))

    subjects = []
    for spec, g in zip(specs, google_subjects):
        meta = next((m for m in meta_subjects if m["domain"] == spec.domain and m["platform"] == "meta"), None)
        subjects.append(
            {
                "kind": spec.kind,
                "name": spec.name,
                "domain": spec.domain,
                "meta": meta
                or {
                    "status": "error",
                    "error": "missing",
                    "ads": [],
                    "source_url": library_search_url(spec.query),
                },
                "google": g,
            }
        )
    return {"status": "ready", "subjects": subjects, "error": None, "brief_version": brief.get("version")}


async def _meta(specs: list[SubjectSpec]) -> list[dict[str, Any]]:
    try:
        lib = MetaLibrary()
        rows = await lib.scrape(specs)
    except MetaLibraryError as e:
        return [
            {
                "platform": "meta",
                "kind": s.kind,
                "name": s.name,
                "domain": s.domain,
                "status": "error",
                "error": str(e)[:300],
                "source_url": library_search_url(s.query),
                "ads": [],
            }
            for s in specs
        ]
    out = []
    for row in rows:
        out.append(
            {
                "platform": "meta",
                "kind": row.spec.kind,
                "name": row.spec.name,
                "domain": row.spec.domain,
                "status": row.status if row.status != "failed" else "error",
                "error": row.error,
                "source_url": library_search_url(row.query),
                "page_id": row.ads[0].page_id if row.ads else None,
                "page_name": row.ads[0].page_name if row.ads else None,
                "ads": [_ad_row("meta", a, row.spec.name, row.spec.domain) for a in row.ads],
            }
        )
    return out


async def _google(spec: SubjectSpec) -> dict[str, Any]:
    row = await scrape_google(spec.domain, spec.name)
    row["kind"] = spec.kind
    row["source_url"] = row.get("source_url") or transparency_url(spec.domain)
    return row
