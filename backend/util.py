from __future__ import annotations

import hashlib
import json
import re
from html import unescape
from urllib.parse import urlparse

_BARE_SUFFIX = re.compile(r"^(co|com|org|net|gov|edu)\.[a-z]{2}$", re.I)
MULTI_TLD = frozenset({"co.uk", "com.ua", "com.au", "co.nz", "com.br", "co.jp"})


def host_of(raw: str | None) -> str:
    s = (raw or "").strip()
    if not s:
        return ""
    if "://" not in s:
        s = "https://" + s
    host = (urlparse(s).hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def registrable(host: str | None) -> str:
    h = host_of(host)
    if not h:
        return ""
    parts = h.split(".")
    tail2 = ".".join(parts[-2:]) if len(parts) >= 2 else h
    if len(parts) >= 3 and (_BARE_SUFFIX.match(tail2) or tail2 in MULTI_TLD):
        return ".".join(parts[-3:])
    return tail2 if len(parts) >= 2 else h


def same_market_host(ad_host: str | None, target_host: str | None) -> bool:
    a, b = registrable(ad_host), registrable(target_host)
    return bool(a and b and a == b)


def origin_of(domain: str) -> str:
    host = host_of(domain)
    return f"https://{host}" if host else ""


def brief_hash(payload: object) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def clip(v: object, n: int) -> str | None:
    s = str(v).strip() if v is not None else ""
    return s[:n] if s else None


def visible_text(html: str) -> str:
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html or "")
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    text = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = unescape(re.sub(r"\s+", " ", text))
    return text.strip()


def meta_val(html: str, attr: str, name: str) -> str:
    pat = rf'<meta[^>]+{attr}=["\']{re.escape(name)}["\'][^>]+content=["\']([^"\']+)["\']'
    m = re.search(pat, html or "", re.I)
    if m:
        return unescape(m.group(1).strip())
    pat = rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+{attr}=["\']{re.escape(name)}["\']'
    m = re.search(pat, html or "", re.I)
    return unescape(m.group(1).strip()) if m else ""
