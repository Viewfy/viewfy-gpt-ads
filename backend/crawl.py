from __future__ import annotations

import logging
import re
from collections import Counter
from html import unescape
from io import BytesIO
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx

from util import host_of, meta_val, origin_of, visible_text

log = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ViewfyLovesGptAds/1.0; +https://viewfy.ai)",
    "Accept": "text/html,application/xhtml+xml",
}

PAGE_KINDS = (
    ("home", ("/",)),
    ("about", ("/about", "/about-us", "/company", "/our-story")),
    ("products", ("/products", "/product", "/services", "/solutions", "/platform")),
    ("pricing", ("/pricing", "/plans", "/price")),
    ("faq", ("/faq", "/faqs", "/help", "/questions")),
)

_KIND_HREF = {
    "about": re.compile(r"(?:about|company|our[-_]?story)", re.I),
    "products": re.compile(r"(?:product|service|solution|platform|features)", re.I),
    "pricing": re.compile(r"(?:pricing|plans|price)", re.I),
    "faq": re.compile(r"(?:faq|preguntas|help|questions)", re.I),
}


def extract_meta(html: str) -> tuple[str, str]:
    title = ""
    m = re.search(r"<title[^>]*>([^<]+)</title>", html or "", re.I)
    if m:
        title = unescape(m.group(1).strip())
    og = meta_val(html, "property", "og:title")
    if og:
        title = og
    desc = meta_val(html, "property", "og:description") or meta_val(html, "name", "description")
    return title, desc


def extract_logo(html: str, base_url: str) -> str | None:
    icons: list[tuple[int, str]] = []
    for tag in re.findall(r"<link[^>]+>", html or "", re.I):
        rel = re.search(r'rel=["\']([^"\']+)["\']', tag, re.I)
        href = re.search(r'href=["\']([^"\']+)["\']', tag, re.I)
        if not rel or not href:
            continue
        rel_v = rel.group(1).lower()
        if "icon" not in rel_v:
            continue
        size_m = re.search(r'sizes=["\'](\d+)x\d+["\']', tag, re.I)
        size = int(size_m.group(1)) if size_m else (180 if "apple" in rel_v else 32)
        icons.append((size, href.group(1)))
    if not icons:
        icons.append((16, "/favicon.ico"))
    icons.sort(key=lambda x: x[0], reverse=True)
    url = icons[0][1]
    if url.startswith("//"):
        return "https:" + url
    if not url.startswith(("http://", "https://")):
        return urljoin(base_url, url)
    return url


def extract_colors(img_bytes: bytes, n: int = 5) -> list[str]:
    try:
        from PIL import Image
    except Exception:
        return []
    try:
        img = Image.open(BytesIO(img_bytes)).convert("RGB").resize((120, 120))
    except Exception:
        return []
    pixels = list(img.getdata())

    def q(c: tuple[int, int, int]) -> tuple[int, int, int]:
        return (c[0] // 32 * 32, c[1] // 32 * 32, c[2] // 32 * 32)

    def neutral(c: tuple[int, int, int]) -> bool:
        avg = sum(c) / 3
        diff = max(abs(c[0] - avg), abs(c[1] - avg), abs(c[2] - avg))
        return diff < 20 and (avg < 40 or avg > 215)

    counted = Counter(q(p) for p in pixels)
    filtered = [(c, k) for c, k in counted.most_common(40) if not neutral(c)]
    top = filtered[:n] or counted.most_common(n)
    return [f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}" for c, _ in top]


def brand_name(title: str, domain: str) -> str:
    host = host_of(domain)
    if not title:
        return host.split(".")[0].title() if host else "Business"
    clean = re.split(r"\s+[|\-–—:]\s+", title)[0].strip()
    return clean[:80] or host.split(".")[0].title()


def _same_host(url: str, host: str) -> bool:
    return host_of(url) == host


def find_page_urls(home_html: str, base: str) -> dict[str, str]:
    host = host_of(base)
    found: dict[str, str] = {"home": str(base)}
    for m in re.finditer(r"""href\s*=\s*["']([^"'#]+)""", home_html or "", re.I):
        href = m.group(1).strip()
        if href.startswith(("mailto:", "javascript:", "tel:")):
            continue
        abs_url = urljoin(base if base.endswith("/") else base + "/", href)
        if not _same_host(abs_url, host):
            continue
        path = urlparse(abs_url).path.rstrip("/") or "/"
        for kind, rx in _KIND_HREF.items():
            if kind in found:
                continue
            if rx.search(path):
                found[kind] = f"{urlparse(abs_url).scheme}://{urlparse(abs_url).netloc}{path}"
    root = origin_of(base)
    for kind, paths in PAGE_KINDS:
        if kind in found:
            continue
        found[kind] = root + paths[0]
    return found


async def crawl_domain(domain: str) -> dict[str, Any]:
    host = host_of(domain)
    if not host:
        raise ValueError("Enter a domain like getsuperagent.com")
    home = origin_of(host)
    pages: list[dict[str, Any]] = []
    home_html = ""
    title = ""
    desc = ""
    logo = None
    colors: list[str] = []

    async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, headers=HEADERS) as client:
        try:
            resp = await client.get(home)
            resp.raise_for_status()
            home_html = resp.text
            home = str(resp.url)
        except Exception as e:
            log.warning("home fetch failed host=%s: %r", host, e)
            pages.append({"kind": "home", "url": home, "status": "unavailable", "excerpt": "", "error": str(e)[:200]})
            return {
                "host": host,
                "brand": {"name": host.split(".")[0].title(), "one_liner": "", "logo_url": None, "colors": [], "category": ""},
                "pages": pages,
            }

        title, desc = extract_meta(home_html)
        logo = extract_logo(home_html, home)
        home_text = visible_text(home_html)
        pages.append(
            {
                "kind": "home",
                "url": home,
                "status": "ok",
                "excerpt": home_text[:4000],
                "error": None,
            }
        )
        if logo:
            try:
                img = await client.get(logo)
                if img.status_code == 200 and len(img.content) > 80:
                    colors = extract_colors(img.content)
            except Exception as e:
                log.info("logo colors failed: %r", e)

        wanted = find_page_urls(home_html, home)
        for kind, url in wanted.items():
            if kind == "home":
                continue
            try:
                r = await client.get(url)
                if r.status_code >= 400:
                    pages.append({"kind": kind, "url": url, "status": "missing", "excerpt": "", "error": f"HTTP {r.status_code}"})
                    continue
                text = visible_text(r.text)
                if len(text.split()) < 30:
                    pages.append({"kind": kind, "url": str(r.url), "status": "missing", "excerpt": "", "error": "thin page"})
                    continue
                pages.append({"kind": kind, "url": str(r.url), "status": "ok", "excerpt": text[:3500], "error": None})
            except Exception as e:
                pages.append({"kind": kind, "url": url, "status": "unavailable", "excerpt": "", "error": str(e)[:200]})

    return {
        "host": host,
        "brand": {
            "name": brand_name(title, host),
            "one_liner": (desc or "")[:220],
            "logo_url": logo,
            "colors": colors,
            "category": "",
        },
        "pages": pages,
    }
