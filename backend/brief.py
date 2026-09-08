from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Any

import httpx

from config import OPENAI_API_KEY, OPENAI_MODEL
from lint import clean_copy

log = logging.getLogger(__name__)

BRANCHES = (
    "products",
    "customers",
    "problems",
    "offers",
    "differentiators",
    "voice",
    "geography",
    "competitors",
)

PROMPT = """You build an advertising brief from website evidence only.

Return ONLY JSON:
{{
  "category": "",
  "nodes": [
    {{
      "branch": "products|customers|problems|offers|differentiators|voice|geography|competitors",
      "text": "",
      "source_url": "",
      "provenance": "website|inference",
      "domain": ""
    }}
  ],
  "missing": ["pricing"]
}}

Rules:
- Ground every node in SITE PAGES. If a fact is not on the pages, omit it.
- provenance=website when the page states it. provenance=inference only for a cautious competitor or customer guess, and say it is a guess in the text.
- competitors: up to 4 objects with name in text and their public domain in domain. Do not invent domains.
- customers: who buys it, not who the site markets at if those differ. Do not invent a segment.
- missing: page kinds we needed but did not get (about, products, pricing, faq).
- No invented metrics, prices, or awards.
- Short node text. No em-dashes.

BRAND NAME: {name}
ONE LINER: {blurb}
DOMAIN: {domain}

SITE PAGES:
{pages}
"""


def _site_block(pages: list[dict[str, Any]]) -> str:
    parts = []
    for p in pages:
        if p.get("status") != "ok":
            parts.append(f"--- {p.get('kind')} {p.get('url')} MISSING ---")
            continue
        parts.append(f"--- {p.get('kind')} {p.get('url')} ---\n{(p.get('excerpt') or '')[:2800]}")
    return "\n\n".join(parts)[:12000]


def heuristic_map(crawl: dict[str, Any]) -> dict[str, Any]:
    brand = crawl.get("brand") or {}
    pages = crawl.get("pages") or []
    home = next((p for p in pages if p.get("kind") == "home" and p.get("status") == "ok"), None)
    url = (home or {}).get("url") or ""
    nodes = []
    if brand.get("one_liner"):
        nodes.append(node("offers", brand["one_liner"], url, "website"))
    if brand.get("name"):
        nodes.append(node("products", brand["name"], url, "website"))
    missing = [p["kind"] for p in pages if p.get("status") != "ok" and p.get("kind") != "home"]
    return {"nodes": nodes, "missing": missing, "category": brand.get("category") or ""}


def node(branch: str, text: str, source_url: str | None, provenance: str, domain: str = "") -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4())[:8],
        "branch": branch,
        "text": clean_copy(text)[:220],
        "source_url": source_url or "",
        "provenance": provenance,
        "domain": domain,
    }


async def build_map(crawl: dict[str, Any]) -> dict[str, Any]:
    fallback = heuristic_map(crawl)
    if not OPENAI_API_KEY:
        return fallback
    brand = crawl.get("brand") or {}
    body = PROMPT.format(
        name=brand.get("name") or "",
        blurb=brand.get("one_liner") or "",
        domain=crawl.get("host") or "",
        pages=_site_block(crawl.get("pages") or []),
    )
    try:
        data = await _chat_json(body)
    except Exception as e:
        log.warning("brief llm failed: %r", e)
        return fallback
    nodes = []
    for raw in data.get("nodes") or []:
        if not isinstance(raw, dict):
            continue
        branch = str(raw.get("branch") or "")
        if branch not in BRANCHES:
            continue
        text = clean_copy(str(raw.get("text") or ""))
        if not text:
            continue
        prov = raw.get("provenance") if raw.get("provenance") in ("website", "inference") else "inference"
        nodes.append(node(branch, text, str(raw.get("source_url") or ""), prov, str(raw.get("domain") or "")))
    if not nodes:
        return fallback
    missing = [m for m in (data.get("missing") or []) if isinstance(m, str)]
    return {
        "nodes": nodes,
        "missing": missing or fallback["missing"],
        "category": clean_copy(str(data.get("category") or fallback.get("category") or "")),
    }


async def _chat_json(prompt: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=90.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": OPENAI_MODEL,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": "Return only valid JSON. Never invent facts."},
                    {"role": "user", "content": prompt},
                ],
            },
        )
        r.raise_for_status()
        content = ((r.json().get("choices") or [{}])[0].get("message") or {}).get("content") or "{}"
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?", "", content).strip().rstrip("`")
    data = json.loads(content)
    return data if isinstance(data, dict) else {}


def snapshot_brief(run: dict[str, Any]) -> dict[str, Any]:
    brand = run.get("brand") or {}
    nodes = (run.get("map") or {}).get("nodes") or []
    return {
        "domain": run.get("domain"),
        "name": brand.get("name"),
        "one_liner": brand.get("one_liner"),
        "category": brand.get("category"),
        "colors": brand.get("colors") or [],
        "logo_url": brand.get("logo_url"),
        "nodes": [
            {
                "id": n.get("id"),
                "branch": n.get("branch"),
                "text": n.get("text"),
                "source_url": n.get("source_url"),
                "provenance": n.get("provenance"),
                "domain": n.get("domain"),
            }
            for n in nodes
        ],
    }


def approved_competitors(brief: dict[str, Any], limit: int = 2) -> list[dict[str, str]]:
    out = []
    seen = set()
    for n in brief.get("nodes") or []:
        if n.get("branch") != "competitors":
            continue
        domain = (n.get("domain") or "").strip().lower()
        name = (n.get("text") or "").strip()
        if not name:
            continue
        key = domain or name.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append({"name": name.split("(")[0].strip()[:80], "domain": domain})
        if len(out) >= limit:
            break
    return out


def texts_for(brief: dict[str, Any], branch: str) -> list[str]:
    return [n["text"] for n in (brief.get("nodes") or []) if n.get("branch") == branch and n.get("text")]
