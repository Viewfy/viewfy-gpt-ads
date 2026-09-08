"""Google Ads Transparency Center via Apify. Sibling of meta_library."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from config import APIFY_TOKEN
from meta_library import DONE, MetaLibraryError, _run_cost
from util import clip, host_of

log = logging.getLogger(__name__)

APIFY = "https://api.apify.com/v2"
ACTOR = "automation-lab~google-ads-scraper"
WAIT_S = 180


def transparency_url(domain: str) -> str:
    host = host_of(domain)
    return f"https://adstransparency.google.com/?region=US&domain={host}"


async def scrape_google(domain: str, name: str) -> dict[str, Any]:
    host = host_of(domain)
    source = transparency_url(host)
    if not APIFY_TOKEN:
        return {
            "kind": "self",
            "platform": "google",
            "name": name,
            "domain": host,
            "status": "error",
            "error": "APIFY_TOKEN is not set",
            "source_url": source,
            "ads": [],
        }
    try:
        items = await _run(
            {
                "domains": [host],
                "searchTerms": [name] if name else [],
                "region": "US",
                "maxAds": 12,
            }
        )
    except MetaLibraryError as e:
        log.warning("google atc failed domain=%s: %s", host, e)
        return {
            "kind": "self",
            "platform": "google",
            "name": name,
            "domain": host,
            "status": "error",
            "error": str(e)[:300],
            "source_url": source,
            "ads": [],
        }
    ads = [_parse(item, source) for item in items if isinstance(item, dict)]
    ads = [a for a in ads if a]
    return {
        "kind": "self",
        "platform": "google",
        "name": name,
        "domain": host,
        "status": "ok" if ads else "empty",
        "error": None,
        "source_url": source,
        "ads": ads[:8],
    }


def _parse(item: dict, source: str) -> dict[str, Any] | None:
    headline = (
        clip(item.get("headline") or item.get("title") or (item.get("headlines") or [None])[0], 240)
    )
    body = clip(
        item.get("description")
        or item.get("body")
        or " ".join(item.get("descriptions") or []),
        800,
    )
    image = clip(
        item.get("imageUrl") or item.get("image_url") or item.get("previewUrl") or item.get("image"),
        2048,
    )
    if not headline and not body and not image:
        return None
    return {
        "id": clip(item.get("creativeId") or item.get("id") or headline, 80) or headline,
        "platform": "google",
        "advertiser": clip(item.get("advertiserName") or item.get("advertiser"), 160),
        "headline": headline,
        "body": body,
        "cta": None,
        "image_url": image,
        "link_url": clip(item.get("destinationUrl") or item.get("url"), 1024),
        "format": clip(item.get("format") or item.get("adFormat") or item.get("type"), 40),
        "started_at": clip(item.get("firstShown") or item.get("startDate") or item.get("dateFrom"), 40),
        "ended_at": clip(item.get("endDate"), 40) if item.get("isActive") is False else None,
        "last_shown_at": clip(item.get("lastShown") or item.get("dateTo"), 40),
        "is_active": item.get("isActive") if isinstance(item.get("isActive"), bool) else None,
        "source_url": clip(item.get("transparencyUrl") or item.get("url") or source, 512),
        "status": "active" if item.get("isActive") is True else "inactive" if item.get("isActive") is False else "unknown",
        "evidence_type": "ad_library",
    }


async def _run(payload: dict) -> list[dict]:
    params = {"token": APIFY_TOKEN, "waitForFinish": WAIT_S}
    timeout = max(60.0, float(WAIT_S) + 30)
    async with httpx.AsyncClient(timeout=timeout) as c:
        start = await c.post(f"{APIFY}/acts/{ACTOR}/runs", params=params, json=payload)
        if start.status_code >= 400:
            raise MetaLibraryError(f"google apify start failed {start.status_code}: {start.text[:300]}")
        run = start.json().get("data") or {}
        if (run.get("status") or "") not in DONE:
            import time

            deadline = time.time() + WAIT_S
            while time.time() < deadline:
                r = await c.get(f"{APIFY}/actor-runs/{run.get('id')}", params={"token": APIFY_TOKEN})
                run = (r.json() or {}).get("data") or {}
                if (run.get("status") or "") in DONE:
                    break
                import asyncio

                await asyncio.sleep(3)
        _run_cost(run)
        if (run.get("status") or "") != "SUCCEEDED":
            raise MetaLibraryError(f"google apify {run.get('status')}: {run.get('statusMessage') or run}")
        ds = run.get("defaultDatasetId")
        if not ds:
            return []
        items = await c.get(
            f"{APIFY}/datasets/{ds}/items",
            params={"token": APIFY_TOKEN, "format": "json", "clean": "true"},
        )
        if items.status_code >= 400:
            raise MetaLibraryError(f"google dataset failed {items.status_code}: {items.text[:300]}")
        data = items.json()
        return data if isinstance(data, list) else []
