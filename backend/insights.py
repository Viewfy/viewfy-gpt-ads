from __future__ import annotations

import logging
from typing import Any

from brief import _chat_json, texts_for
from config import OPENAI_API_KEY
from lint import clean_copy

log = logging.getLogger(__name__)

PROMPT = """You write advertising research notes. No performance claims.

Approved brief:
{brief}

Collected ads (headline / body / platform / advertiser / dates):
{ads}

Return ONLY JSON:
{{
  "insights": [
    {{
      "title": "",
      "observation": "",
      "recommendation": "",
      "because": ["ad id or node text that informed this"],
      "signals": ["repetition", "longevity"]
    }}
  ],
  "concepts": [
    {{
      "id": "a",
      "name": "",
      "angle": "",
      "why": "how this joins the approved brief with the ad research",
      "headline": "",
      "body": "",
      "cta": "",
      "visual": ""
    }}
  ]
}}

Rules:
- Exactly 3 concepts. Distinct directions.
- Never say best-performing, winner, ROAS, CTR, or conversion rate.
- Treat longevity and repetition as research signals only.
- Headlines 3-50 chars. Body max 100 chars. No em-dashes.
- Ground recommendations in the ads and the brief.
"""


def _ad_lines(subjects: list[dict[str, Any]]) -> str:
    lines = []
    for s in subjects:
        for side in ("meta", "google"):
            block = s.get(side) or {}
            for ad in (block.get("ads") or [])[:6]:
                lines.append(
                    f"- {ad.get('id')} | {side} | {s.get('name')} | {ad.get('headline')} | {ad.get('body')} | {ad.get('started_at')}–{ad.get('ended_at')}"
                )
    return "\n".join(lines)[:8000] or "(no matching ads)"


def _brief_lines(brief: dict[str, Any]) -> str:
    parts = [f"name={brief.get('name')} category={brief.get('category')} offer={brief.get('one_liner')}"]
    for branch in ("customers", "problems", "offers", "differentiators", "voice", "geography", "competitors"):
        vals = texts_for(brief, branch)
        if vals:
            parts.append(f"{branch}: {'; '.join(vals)}")
    return "\n".join(parts)


def heuristic_pack(brief: dict[str, Any], subjects: list[dict[str, Any]]) -> dict[str, Any]:
    customers = texts_for(brief, "customers") or ["the people this business already names"]
    offers = texts_for(brief, "offers") or [brief.get("one_liner") or brief.get("name") or "the offer"]
    diffs = texts_for(brief, "differentiators") or ["what the site actually claims"]
    name = brief.get("name") or "this business"
    hooks = []
    long_running = []
    for s in subjects:
        for side in ("meta", "google"):
            for ad in (s.get(side) or {}).get("ads") or []:
                if ad.get("headline"):
                    hooks.append(ad["headline"])
                if ad.get("started_at") and not ad.get("ended_at"):
                    long_running.append(ad.get("id") or ad.get("headline"))
    insights = [
        {
            "title": "What they keep repeating",
            "observation": f"Public ads lean on {hooks[0]}" if hooks else "No matching ads turned up. The brief is the only evidence.",
            "recommendation": f"Lead with {offers[0]} for {customers[0]}.",
            "because": hooks[:2] or texts_for(brief, "offers")[:1],
            "signals": ["repetition"] if hooks else [],
        },
        {
            "title": "What has stayed up",
            "observation": "Some creatives are still running." if long_running else "No longevity signal. Treat the brief as current.",
            "recommendation": f"Keep the claim {diffs[0]} if the site still stands behind it.",
            "because": long_running[:2] or diffs[:1],
            "signals": ["longevity"] if long_running else [],
        },
        {
            "title": "A gap we can own",
            "observation": f"{name} can talk to {customers[0]} without copying competitor hooks.",
            "recommendation": "Write an original ChatGPT card from the approved customer and offer, not from a scraped headline.",
            "because": customers[:1] + offers[:1],
            "signals": [],
        },
    ]
    concepts = [
        {
            "id": "a",
            "name": "The buyer, mid-problem",
            "angle": customers[0],
            "why": f"The approved customer is {customers[0]}. Research shows category ads talk around that person. This card speaks to them.",
            "headline": f"{name} for {customers[0][:24]}",
            "body": offers[0][:100],
            "cta": "See how it works",
            "visual": f"Calm office scene for {customers[0]}, brand colors, no stock handshake",
        },
        {
            "id": "b",
            "name": "The offer, said plainly",
            "angle": offers[0],
            "why": f"The confirmed offer is {offers[0]}. Ads we found repeat softer slogans. Say the offer.",
            "headline": offers[0][:50],
            "body": diffs[0][:100],
            "cta": "Get the walkthrough",
            "visual": f"Product UI or phone on a desk, {name} colors",
        },
        {
            "id": "c",
            "name": "The difference",
            "angle": diffs[0],
            "why": f"The brief names {diffs[0]}. Competitor ads do not. Use that, only if the site supports it.",
            "headline": diffs[0][:50],
            "body": f"Built for {customers[0]}"[:100],
            "cta": "Talk to us",
            "visual": f"Simple contrast: {name} vs generic AI receptionist clutter",
        },
    ]
    return {"insights": insights, "concepts": concepts}


async def build_insights(brief: dict[str, Any], subjects: list[dict[str, Any]]) -> dict[str, Any]:
    fallback = heuristic_pack(brief, subjects)
    if not OPENAI_API_KEY:
        return fallback
    try:
        data = await _chat_json(
            PROMPT.format(brief=_brief_lines(brief), ads=_ad_lines(subjects))
        )
    except Exception as e:
        log.warning("insights llm failed: %r", e)
        return fallback
    insights = data.get("insights") if isinstance(data.get("insights"), list) else fallback["insights"]
    concepts = data.get("concepts") if isinstance(data.get("concepts"), list) else fallback["concepts"]
    cleaned = []
    for i, c in enumerate((concepts or [])[:3]):
        if not isinstance(c, dict):
            continue
        cleaned.append(
            {
                "id": str(c.get("id") or chr(97 + i)),
                "name": clean_copy(str(c.get("name") or f"Direction {i+1}"))[:80],
                "angle": clean_copy(str(c.get("angle") or ""))[:160],
                "why": clean_copy(str(c.get("why") or ""))[:400],
                "headline": clean_copy(str(c.get("headline") or ""))[:50],
                "body": clean_copy(str(c.get("body") or ""))[:100],
                "cta": clean_copy(str(c.get("cta") or "Learn more"))[:32],
                "visual": clean_copy(str(c.get("visual") or ""))[:240],
            }
        )
    if len(cleaned) < 3:
        return fallback
    return {
        "insights": [
            {
                "title": clean_copy(str(x.get("title") or ""))[:80],
                "observation": clean_copy(str(x.get("observation") or ""))[:400],
                "recommendation": clean_copy(str(x.get("recommendation") or ""))[:400],
                "because": [str(b) for b in (x.get("because") or [])][:6],
                "signals": [str(s) for s in (x.get("signals") or []) if s in ("repetition", "longevity")],
            }
            for x in insights[:6]
            if isinstance(x, dict)
        ]
        or fallback["insights"],
        "concepts": cleaned,
    }
