from __future__ import annotations

import base64
import logging
import uuid
from pathlib import Path
from typing import Any

import httpx

from config import DATA_DIR, OPENAI_API_KEY, OPENAI_IMAGE_MODEL
from lint import clip_card, clean_copy

log = logging.getLogger(__name__)


async def make_creative(run: dict[str, Any], concept: dict[str, Any]) -> dict[str, Any]:
    brand = run.get("brand") or {}
    brief = run.get("brief") or {}
    dest = f"https://{brief.get('domain') or run.get('domain')}"
    title, body = clip_card(concept.get("headline") or brand.get("name") or "See this", concept.get("body") or brand.get("one_liner") or "")
    cta = clean_copy(concept.get("cta") or "Learn more")[:32]
    colors = ", ".join((brand.get("colors") or [])[:4]) or "soft blue and cream"
    prompt = (
        f"Square advertising still for a ChatGPT ad card. Brand: {brand.get('name')}. "
        f"Visual direction: {concept.get('visual') or concept.get('name')}. "
        f"Use brand colors {colors}. No logos of other companies. No small unreadable text. "
        f"No fake UI screenshots of ChatGPT. Photoreal or clean illustration. 1024x1024."
    )
    image_url = await generate_image(run["id"], prompt)
    return {
        "id": str(uuid.uuid4())[:8],
        "concept_id": concept.get("id"),
        "title": title,
        "body": body,
        "cta": cta,
        "target_url": dest,
        "visual_prompt": prompt,
        "image_url": image_url,
        "format": "chat_card",
        "brief_version": run.get("brief_version"),
    }


async def generate_image(run_id: str, prompt: str) -> str | None:
    if not OPENAI_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": OPENAI_IMAGE_MODEL,
                    "prompt": prompt,
                    "size": "1024x1024",
                    "quality": "medium",
                },
            )
            r.raise_for_status()
            data = (r.json().get("data") or [{}])[0]
            b64 = data.get("b64_json")
            url = data.get("url")
            if b64:
                raw = base64.b64decode(b64)
                dest = Path(DATA_DIR) / f"{run_id}-creative.png"
                dest.write_bytes(raw)
                return f"/api/files/{run_id}-creative.png"
            return url
    except Exception as e:
        log.warning("image gen failed: %r", e)
        return None
