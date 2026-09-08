from __future__ import annotations

import re

DASH_RE = re.compile(r"[\u2014\u2013]")
BANNED = re.compile(
    r"\b(delve|leverage|unlock|seamless|empower|groundbreaking|transformative|"
    r"holistic|robust|vibrant|game[- ]changing|cutting[- ]edge|synerg(?:y|ies))\b",
    re.I,
)
_QUOTE = str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"'})


def clean_copy(text: str) -> str:
    s = (text or "").translate(_QUOTE)
    s = DASH_RE.sub(", ", s)
    s = BANNED.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip()


def clip_card(title: str, body: str) -> tuple[str, str]:
    title = clean_copy(title)[:50]
    body = clean_copy(body)[:100]
    if len(title) < 3:
        title = "See how this works"
    return title, body
