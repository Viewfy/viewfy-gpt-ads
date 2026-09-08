from __future__ import annotations

import logging
import re
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx

from ads_key import key_for
from config import DATA_DIR, STATIC_DIR

log = logging.getLogger(__name__)
ADS = "https://api.ads.openai.com/v1"
COUNTRY_QUERY = {
    "US": "United States",
    "USA": "United States",
    "UK": "United Kingdom",
    "GB": "United Kingdom",
    "CA": "Canada",
    "AU": "Australia",
    "DE": "Germany",
    "FR": "France",
    "NL": "Netherlands",
    "ES": "Spain",
    "IT": "Italy",
    "IE": "Ireland",
    "IN": "India",
    "BR": "Brazil",
    "MX": "Mexico",
    "JP": "Japan",
}


def budget_micros(usd: float) -> int:
    return max(1_000_000, int(round(float(usd or 0) * 1_000_000)))


def valid_external_id(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip()) and not re.search(r"(?:^|[_-])(?:demo|mock|fixture)(?:$|[_-])", value, re.I)


def map_status(campaign_status: str | None, review: str | None) -> str:
    review = (review or "").lower()
    status = (campaign_status or "").lower()
    if review == "rejected" or status in {"failed", "error"}:
        return "failed"
    if review in {"in_review", "under_review", "pending", "pending_review"}:
        return "under_review"
    if status == "active" and review == "approved":
        return "active"
    if status in {"paused", "submitted", "active"}:
        return "submitted"
    return "draft"


def context_hints(run: dict[str, Any]) -> list[str]:
    brand = run.get("brand") or {}
    hints: list[str] = []
    for raw in (brand.get("category"), brand.get("one_liner"), brand.get("name")):
        text = (raw or "").strip()
        if text:
            hints.append(text[:80])
    for node in ((run.get("brief") or {}).get("nodes") or run.get("map", {}).get("nodes") or [])[:8]:
        if node.get("branch") in {"problems", "offers", "customers"} and node.get("text"):
            hints.append(str(node["text"])[:80])
    out: list[str] = []
    seen: set[str] = set()
    for h in hints:
        key = h.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(h)
        if len(out) == 6:
            break
    return out or ["B2B software", "founders"]


def _headers(token: str | None = None, *, json_body: bool = True, idem: str | None = None) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {(token or key_for()).strip()}", "Accept": "application/json"}
    if json_body:
        headers["Content-Type"] = "application/json"
    if idem:
        headers["Idempotency-Key"] = idem
    return headers


def _err(r: httpx.Response) -> str:
    try:
        data = r.json()
        if isinstance(data, dict):
            return str(data.get("error") or data.get("message") or data)[:240]
    except Exception:
        pass
    return r.text[:240]


async def ad_account(token: str | None = None) -> dict[str, Any]:
    tok = (token or key_for()).strip()
    if not tok:
        return {"ok": False, "mode": "unconnected", "error": "No Ads Manager key is configured. Connect an ad account before launching."}
    try:
        async with httpx.AsyncClient(timeout=20.0) as c:
            r = await c.get(f"{ADS}/ad_account", headers=_headers(tok))
        if r.status_code >= 400:
            return {"ok": False, "mode": "unconnected", "error": f"{r.status_code}: {_err(r)}"}
        data = r.json()
        if not isinstance(data, dict) or not valid_external_id(data.get("id")):
            return {"ok": False, "mode": "unconnected", "error": "Ads Manager returned no ad account ID. The connection could not be verified."}
        return {
            "ok": True,
            "mode": "live",
            "id": data.get("id"),
            "name": data.get("name"),
            "status": data.get("status"),
            "currency": data.get("currency_code"),
            "timezone": data.get("timezone"),
            "url": data.get("url"),
            "review": (data.get("review") or {}).get("status"),
        }
    except Exception as e:
        log.warning("ad_account failed: %r", e)
        return {"ok": False, "mode": "unconnected", "error": str(e)[:240] or "Ads Manager is unavailable"}


def _unconnected(campaign: dict[str, Any], error: str) -> dict[str, Any]:
    campaign.update({
        "status": "draft", "mode": "unconnected", "connected": False,
        "account": None, "note": None, "error": error,
    })
    return campaign


async def lookup_location(query: str, token: str | None = None) -> dict[str, str] | None:
    q = COUNTRY_QUERY.get(query.strip().upper(), query.strip())
    async with httpx.AsyncClient(timeout=20.0) as c:
        r = await c.get(
            f"{ADS}/geo_lookup/search",
            headers=_headers(token, json_body=False),
            params={"q": q, "limit": 5},
        )
    if r.status_code >= 400:
        raise RuntimeError(f"geo lookup failed: {r.status_code} {_err(r)}")
    results = (r.json() or {}).get("results") or []
    want = query.strip().upper()
    for row in results:
        if (row.get("country_code") or "").upper() == want and row.get("type") == "country":
            return {"id": str(row["id"])}
    for row in results:
        if (row.get("country_code") or "").upper() == want:
            return {"id": str(row["id"])}
    if results:
        return {"id": str(results[0]["id"])}
    return None


async def resolve_locations(places: list[str], token: str | None = None) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for place in places or ["US"]:
        hit = await lookup_location(place, token)
        if not hit or hit["id"] in seen:
            continue
        seen.add(hit["id"])
        out.append(hit)
    return out


def _local_image(image_url: str | None) -> Path | None:
    if not image_url:
        return None
    if image_url.startswith("/api/files/"):
        path = Path(DATA_DIR) / image_url.rsplit("/", 1)[-1]
        return path if path.exists() else None
    if image_url.startswith("/") and not image_url.startswith("//"):
        path = Path(STATIC_DIR) / image_url.lstrip("/")
        return path if path.exists() else None
    parsed = urlparse(image_url)
    if parsed.scheme in {"http", "https"} and parsed.hostname in {"127.0.0.1", "localhost"}:
        if parsed.path.startswith("/api/files/"):
            path = Path(DATA_DIR) / parsed.path.rsplit("/", 1)[-1]
            return path if path.exists() else None
        path = Path(STATIC_DIR) / parsed.path.lstrip("/")
        return path if path.exists() else None
    return None


async def upload_asset(image_url: str | None, token: str | None = None) -> str | None:
    local = _local_image(image_url)
    fallback = Path(STATIC_DIR) / "superagent-ads.png"
    async with httpx.AsyncClient(timeout=60.0) as c:
        if local and local.exists():
            mime = "image/png" if local.suffix.lower() == ".png" else "image/jpeg"
            r = await c.post(
                f"{ADS}/upload",
                headers=_headers(token, json_body=False),
                files={"file": (local.name, local.read_bytes(), mime)},
            )
        elif image_url and image_url.startswith("http"):
            r = await c.post(f"{ADS}/upload", headers=_headers(token), json={"image_url": image_url})
        elif fallback.exists():
            r = await c.post(
                f"{ADS}/upload",
                headers=_headers(token, json_body=False),
                files={"file": (fallback.name, fallback.read_bytes(), "image/png")},
            )
        else:
            return None
        if r.status_code >= 400:
            raise RuntimeError(f"upload failed: {r.status_code} {_err(r)}")
        return (r.json() or {}).get("file_id")


async def _post(c: httpx.AsyncClient, path: str, body: dict[str, Any], *, token: str | None = None, idem: str | None = None) -> dict[str, Any]:
    r = await c.post(f"{ADS}{path}", headers=_headers(token, idem=idem), json=body)
    if r.status_code >= 400:
        raise RuntimeError(f"{path} {r.status_code}: {_err(r)}")
    return r.json() or {}


async def launch_campaign(run: dict[str, Any]) -> dict[str, Any]:
    campaign = dict(run.get("campaign") or {})
    if campaign.get("preview"):
        campaign.update({"error": None, "note": None, "connected": True, "mode": "live"})
        return campaign
    token = key_for(run.get("id"))
    health = await ad_account(token)
    creative = run.get("creative") or {}
    campaign = dict(run.get("campaign") or {})
    campaign["account"] = {k: health.get(k) for k in ("id", "name", "status", "currency", "review") if health.get(k)}
    if not health.get("ok"):
        return _unconnected(campaign, health.get("error") or "Connect an Ads Manager account before launching.")
    campaign.update({"mode": "live", "connected": True, "error": None, "note": None})

    micros = budget_micros(campaign.get("budget_usd") or 25)
    places = [str(x).strip() for x in (campaign.get("geo") or ["US"]) if str(x).strip()]
    idem = f"run-{run.get('id') or uuid.uuid4()}-campaign"
    try:
        file_id = await upload_asset(creative.get("image_url"), token)
        if not file_id:
            raise RuntimeError("ChatGPT ads need a chat_card image. Generate one, then launch again.")
        locations = await resolve_locations(places, token)
        async with httpx.AsyncClient(timeout=40.0) as c:
            cmpn = await _post(
                c,
                "/campaigns",
                {
                    "name": f"{(run.get('brand') or {}).get('name') or 'Campaign'} ChatGPT Ads"[:1000],
                    "status": "paused",
                    "bidding_type": "clicks",
                    "budget": {"lifetime_spend_limit_micros": micros},
                    **({"targeting": {"locations": {"include": locations}}} if locations else {}),
                },
                token=token,
                idem=idem,
            )
            campaign_id = cmpn.get("id")
            if not valid_external_id(campaign_id):
                raise RuntimeError("Ads Manager did not return a campaign ID. Submission could not be verified.")
            ids = {"campaign_id": campaign_id, "file_id": file_id}
            campaign["external_ids"] = ids
            grp = await _post(
                c,
                "/ad_groups",
                {
                    "campaign_id": campaign_id,
                    "name": "Primary",
                    "status": "active",
                    "context_hints": context_hints(run),
                    "bidding_config": {"billing_event_type": "click", "max_bid_micros": 2_000_000},
                },
                token=token,
                idem=f"{idem}-group",
            )
            group_id = grp.get("id")
            if not valid_external_id(group_id):
                raise RuntimeError("Ads Manager did not return an ad group ID. Submission could not be verified.")
            ids["ad_group_id"] = group_id
            title = (creative.get("title") or "See this")[:50]
            body = (creative.get("body") or "")[:100]
            ad = await _post(
                c,
                "/ads",
                {
                    "ad_group_id": group_id,
                    "name": title if len(title) >= 3 else "Chat card",
                    "status": "active",
                    "creative": {
                        "type": "chat_card",
                        "title": title,
                        "body": body,
                        "target_url": creative.get("target_url") or f"https://{run.get('domain')}",
                        "file_id": file_id,
                    },
                },
                token=token,
                idem=f"{idem}-ad",
            )
            ad_id = ad.get("id")
            if not valid_external_id(ad_id):
                raise RuntimeError("Ads Manager did not return an ad ID. Submission could not be verified.")
            ids["ad_id"] = ad_id
            act = await c.post(f"{ADS}/campaigns/{campaign_id}/activate", headers=_headers(token))
            activated = 200 <= act.status_code < 300
            act_status = "active" if activated else "paused"
            review = ad.get("review_status")
            campaign.update(
                {
                    "status": map_status(act_status, review) if activated or review == "rejected" else "submitted",
                    "mode": "live",
                    "error": None,
                    "note": None if activated else f"Campaign submitted but remains paused. Activation failed: {act.status_code}: {_err(act)}",
                    "external_ids": ids,
                    "review_status": review,
                    "locations": locations,
                }
            )
            campaign["insights"] = await _insights(c, ad_id, token)
            return campaign
    except Exception as e:
        log.warning("launch failed: %r", e)
        campaign.update({"status": "failed", "mode": "live", "error": str(e)[:300]})
        return campaign


async def _insights(c: httpx.AsyncClient, ad_id: str | None, token: str | None = None) -> dict[str, Any] | None:
    if not ad_id:
        return None
    try:
        r = await c.get(
            f"{ADS}/ads/{ad_id}/insights",
            headers=_headers(token, json_body=False),
            params={"time_granularity": "daily", "limit": 7},
        )
        if r.status_code >= 400:
            return None
        rows = (r.json() or {}).get("data") or []
        impressions = sum(int(x.get("impressions") or 0) for x in rows)
        clicks = sum(int(x.get("clicks") or 0) for x in rows)
        spend = round(sum(float(x.get("spend") or 0) for x in rows), 2)
        return {"impressions": impressions, "clicks": clicks, "spend": spend, "days": len(rows)}
    except Exception as e:
        log.warning("campaign insights unavailable: %r", e)
        return None


async def refresh_campaign(run: dict[str, Any]) -> dict[str, Any]:
    campaign = dict(run.get("campaign") or {})
    ids = campaign.get("external_ids") or {}
    ad_id = ids.get("ad_id")
    campaign_id = ids.get("campaign_id")
    token = key_for(run.get("id"))
    health = await ad_account(token)
    if not health.get("ok"):
        return _unconnected(campaign, health.get("error") or "Could not verify the Ads Manager account.")
    campaign.update({
        "mode": "live", "connected": True, "error": None,
        "account": {k: health.get(k) for k in ("id", "name", "status", "currency", "review") if health.get(k)},
    })
    if not ad_id or not campaign_id or not ids.get("ad_group_id"):
        campaign.update({"status": "draft", "error": "No submitted campaign is saved. Launch a campaign before refreshing its status."})
        return campaign
    try:
        async with httpx.AsyncClient(timeout=20.0) as c:
            ad = await c.get(f"{ADS}/ads/{ad_id}", headers=_headers(token, json_body=False))
            if ad.status_code in {401, 403}:
                return _unconnected(campaign, f"Ad refresh failed: {ad.status_code}: {_err(ad)}")
            if ad.status_code >= 400:
                raise RuntimeError(f"Ad refresh failed: {ad.status_code}: {_err(ad)}")
            data = ad.json() or {}
            if data.get("id") != ad_id:
                raise RuntimeError("Ads Manager returned no matching ad record. Status could not be verified.")
            campaign["review_status"] = data.get("review_status")
            cr = await c.get(f"{ADS}/campaigns/{campaign_id}", headers=_headers(token, json_body=False))
            if cr.status_code in {401, 403}:
                return _unconnected(campaign, f"Campaign refresh failed: {cr.status_code}: {_err(cr)}")
            if cr.status_code >= 400:
                raise RuntimeError(f"Campaign refresh failed: {cr.status_code}: {_err(cr)}")
            campaign_data = cr.json() or {}
            if campaign_data.get("id") != campaign_id:
                raise RuntimeError("Ads Manager returned no matching campaign record. Status could not be verified.")
            campaign["status"] = map_status(campaign_data.get("status"), campaign.get("review_status"))
            campaign["insights"] = await _insights(c, ad_id, token)
            campaign["note"] = None
    except Exception as e:
        log.warning("refresh failed: %r", e)
        campaign.update({"status": "failed", "error": str(e)[:240] or "Campaign status could not be refreshed."})
    return campaign
