"""Meta Ad Library scrape via Apify. Domain + market, never a bare brand.

Copied and slimmed from Viewfy backend/core/meta_library.py.
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any
from urllib.parse import quote

import httpx

from config import APIFY_TOKEN
from util import clip, host_of, registrable, same_market_host

log = logging.getLogger(__name__)

APIFY = "https://api.apify.com/v2"
ACTOR = "apify~facebook-ads-scraper"
WAIT_S = 180
SAMPLE_PER = 12
COST_CAP_USD = Decimal("0.45")
DONE = frozenset({"SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"})
_HOST_IN_TEXT = re.compile(r"(?:https?://)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)", re.I)
_SKIP_HOST_TAIL = frozenset(
    {"facebook.com", "fb.com", "instagram.com", "l.facebook.com", "lm.facebook.com", "fb.me", "bit.ly", "tinyurl.com"}
)


class MetaLibraryError(Exception):
    pass


@dataclass
class SubjectSpec:
    kind: str
    name: str
    domain: str
    query: str


@dataclass
class KeptAd:
    archive_id: str
    is_active: bool
    started_at: str | None
    ended_at: str | None
    display_format: str | None
    headline: str | None
    body: str | None
    cta: str | None
    link_url: str | None
    platforms: list[str] | None
    image_url: str | None
    library_url: str
    page_id: str | None
    page_name: str | None
    impressions: str | None = None
    extra: dict[str, Any] | None = None


@dataclass
class SubjectResult:
    spec: SubjectSpec
    country: str
    query: str
    total_count: int
    status: str
    ads: list[KeptAd] = field(default_factory=list)
    error: str | None = None


def library_search_url(query: str, country: str = "ALL") -> str:
    q = quote(query, safe="")
    cc = (country or "ALL").upper()
    return (
        "https://www.facebook.com/ads/library/"
        f"?active_status=all&ad_type=all&country={cc}"
        f"&is_targeted_country=false&media_type=all&q={q}"
        "&search_type=keyword_exact_phrase"
        "&sort_data[mode]=total_impressions&sort_data[direction]=desc"
    )


def keep_ad(ad: dict, target_domain: str) -> bool:
    for host in ad_hosts(ad):
        if same_market_host(host, target_domain):
            return True
    return False


def ad_hosts(ad: dict) -> list[str]:
    hosts: list[str] = []
    seen: set[str] = set()

    def add(raw: str | None) -> None:
        h = host_of(raw)
        if not h or h in seen:
            return
        if any(h == s or h.endswith("." + s) for s in _SKIP_HOST_TAIL):
            return
        seen.add(h)
        hosts.append(h)

    snap = ad.get("snapshot") if isinstance(ad.get("snapshot"), dict) else {}
    add(snap.get("linkUrl") or ad.get("linkUrl"))
    for card in snap.get("cards") or []:
        if isinstance(card, dict):
            add(card.get("linkUrl") or card.get("link_url"))
    for text in _caption_blobs(ad, snap):
        for m in _HOST_IN_TEXT.finditer(text):
            add(m.group(1))
    return hosts


def parse_kept(ad: dict) -> KeptAd | None:
    archive = str(ad.get("adArchiveID") or ad.get("adArchiveId") or "").strip()
    if not archive:
        return None
    snap = ad.get("snapshot") if isinstance(ad.get("snapshot"), dict) else {}
    body = _body_text(snap)
    extra = parse_extra(ad)
    return KeptAd(
        archive_id=archive[:64],
        is_active=bool(ad.get("isActive", True)),
        started_at=_date(ad.get("startDateFormatted") or ad.get("startDate")),
        ended_at=_date(ad.get("endDateFormatted") or ad.get("endDate")),
        display_format=clip(snap.get("displayFormat"), 40),
        headline=clip(snap.get("title"), 512),
        body=body[:4000] if body else None,
        cta=clip(snap.get("ctaText"), 80),
        link_url=clip(snap.get("linkUrl") or ad.get("linkUrl"), 1024),
        platforms=_platforms(ad),
        image_url=_image_url(snap),
        library_url=f"https://www.facebook.com/ads/library/?id={archive}",
        page_id=clip(ad.get("pageID") or ad.get("pageId") or snap.get("pageID"), 64),
        page_name=clip(ad.get("pageName") or snap.get("pageName"), 255),
        impressions=clip((extra or {}).get("impressions"), 80),
        extra=extra,
    )


def parse_extra(ad: dict) -> dict[str, Any] | None:
    out: dict[str, Any] = {}
    blob = ad.get("impressionsWithIndex") or ad.get("impressions_with_index") or {}
    if isinstance(blob, dict):
        text = clip(blob.get("impressionsText") or ad.get("impressionsText"), 80)
        if text:
            out["impressions"] = text
    spend = ad.get("spend") if isinstance(ad.get("spend"), dict) else None
    if spend:
        out["spend"] = {k: str(spend[k]) for k in ("lower_bound", "upper_bound", "lower", "upper") if spend.get(k)}
    currency = clip(ad.get("currency"), 8)
    if currency:
        out["currency"] = currency
    return out or None


def flatten_ads(items: list[dict]) -> list[dict]:
    out: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        nested = item.get("results")
        if isinstance(nested, list):
            out.extend(a for a in nested if isinstance(a, dict))
            continue
        if item.get("adArchiveID") or item.get("adArchiveId") or item.get("snapshot"):
            out.append(item)
    return out


def parse_total(items: list[dict]) -> int:
    if not items:
        return 0
    first = items[0] if isinstance(items[0], dict) else {}
    for key in ("total", "adsCount", "totalCount", "count", "ads_count"):
        val = first.get(key)
        if isinstance(val, int) and val >= 0:
            return val
        if isinstance(val, str) and val.isdigit():
            return int(val)
    ads = flatten_ads(items)
    return len(ads) if ads else 0


class MetaLibrary:
    def __init__(self, token: str | None = None) -> None:
        self._token = token if token is not None else APIFY_TOKEN
        if not self._token:
            raise MetaLibraryError("APIFY_TOKEN is not set")

    async def scrape(self, specs: list[SubjectSpec]) -> list[SubjectResult]:
        rows: list[SubjectResult] = []
        cost = Decimal("0")
        for spec in specs:
            row, spent = await self._subject(spec, COST_CAP_USD - cost)
            cost += spent
            rows.append(row)
        return rows

    async def _subject(self, spec: SubjectSpec, budget: Decimal) -> tuple[SubjectResult, Decimal]:
        spent = Decimal("0")
        used = "ALL"
        try:
            total, c1 = await self.count(spec.query, used)
            spent += c1
            if total <= 0:
                return SubjectResult(spec=spec, country=used, query=spec.query, total_count=0, status="empty"), spent
            if spent >= budget:
                return SubjectResult(spec=spec, country=used, query=spec.query, total_count=total, status="error", error="budget"), spent
            raw, c3 = await self.sample(spec.query, used)
            spent += c3
            keepers: list[KeptAd] = []
            seen: set[str] = set()
            for ad in flatten_ads(raw):
                if spec.kind != "self" and not keep_ad(ad, spec.domain):
                    if not keep_ad(ad, spec.domain):
                        # still keep a few keyword matches when landing host is missing
                        parsed = parse_kept(ad)
                        if parsed and parsed.archive_id not in seen:
                            seen.add(parsed.archive_id)
                            keepers.append(parsed)
                        continue
                parsed = parse_kept(ad)
                if not parsed or parsed.archive_id in seen:
                    continue
                seen.add(parsed.archive_id)
                keepers.append(parsed)
            return (
                SubjectResult(
                    spec=spec,
                    country=used,
                    query=spec.query,
                    total_count=total,
                    status="ok" if keepers else "empty",
                    ads=keepers[:8],
                ),
                spent,
            )
        except MetaLibraryError as e:
            log.warning("meta subject failed domain=%s: %s", spec.domain, e)
            return (
                SubjectResult(
                    spec=spec, country=used, query=spec.query, total_count=0, status="error", error=str(e)[:300]
                ),
                spent,
            )

    async def count(self, query: str, country: str) -> tuple[int, Decimal]:
        items, cost = await self._run(
            {
                "startUrls": [{"url": library_search_url(query, country)}],
                "resultsLimit": 1,
                "onlyTotal": True,
                "activeStatus": "",
                "isDetailsPerAd": False,
                "enrichWithEcommerceData": False,
            }
        )
        return parse_total(items), cost

    async def sample(self, query: str, country: str) -> tuple[list[dict], Decimal]:
        return await self._run(
            {
                "startUrls": [{"url": library_search_url(query, country)}],
                "resultsLimit": SAMPLE_PER,
                "onlyTotal": False,
                "activeStatus": "",
                "isDetailsPerAd": True,
                "enrichWithEcommerceData": False,
            }
        )

    async def _run(self, payload: dict) -> tuple[list[dict], Decimal]:
        params = {"token": self._token, "waitForFinish": WAIT_S}
        timeout = max(60.0, float(WAIT_S) + 30)
        async with httpx.AsyncClient(timeout=timeout) as c:
            start = await c.post(f"{APIFY}/acts/{ACTOR}/runs", params=params, json=payload)
            if start.status_code >= 400:
                raise MetaLibraryError(f"apify start failed {start.status_code}: {start.text[:300]}")
            run = start.json().get("data") or {}
            if (run.get("status") or "") not in DONE:
                run = await self._poll(c, run.get("id") or "")
            cost = _run_cost(run)
            if (run.get("status") or "") != "SUCCEEDED":
                raise MetaLibraryError(f"apify run {run.get('status')}: {run.get('statusMessage') or run}")
            ds = run.get("defaultDatasetId")
            if not ds:
                return [], cost
            items = await c.get(
                f"{APIFY}/datasets/{ds}/items",
                params={"token": self._token, "format": "json", "clean": "true"},
            )
            if items.status_code >= 400:
                raise MetaLibraryError(f"apify dataset failed {items.status_code}: {items.text[:300]}")
            data = items.json()
            return (data if isinstance(data, list) else []), cost

    async def _poll(self, c: httpx.AsyncClient, run_id: str) -> dict:
        if not run_id:
            return {}
        data: dict = {}
        deadline = time.time() + WAIT_S
        while time.time() < deadline:
            r = await c.get(f"{APIFY}/actor-runs/{run_id}", params={"token": self._token})
            data = (r.json() or {}).get("data") or {}
            if (data.get("status") or "") in DONE:
                return data
            await asyncio.sleep(3)
        return data


def _run_cost(run: dict) -> Decimal:
    raw = run.get("usageTotalUsd")
    try:
        return Decimal(str(raw or 0))
    except Exception:
        return Decimal("0")


def _body_text(snap: dict) -> str:
    body = snap.get("body")
    if isinstance(body, dict):
        return str(body.get("text") or "").strip()
    return str(body or "").strip()


def _caption_blobs(ad: dict, snap: dict) -> list[str]:
    out = [_body_text(snap)]
    for key in ("caption", "currentDescription", "title"):
        val = snap.get(key)
        if isinstance(val, str) and val.strip():
            out.append(val)
    return out


def _date(raw: Any) -> str | None:
    if raw is None or raw == "":
        return None
    return str(raw).strip()[:40] or None


def _platforms(ad: dict) -> list[str] | None:
    raw = ad.get("publisherPlatform") or ad.get("publisherPlatforms")
    if isinstance(raw, list):
        return [str(x) for x in raw if x][:12]
    if isinstance(raw, str) and raw.strip():
        return [raw.strip()]
    return None


def _image_url(snap: dict) -> str | None:
    for img in snap.get("images") or []:
        if isinstance(img, dict):
            url = img.get("originalImageUrl") or img.get("resizedImageUrl") or img.get("url")
            if url:
                return str(url)[:2048]
    return None
