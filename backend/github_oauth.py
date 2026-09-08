from __future__ import annotations

import json
import logging
import secrets
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx

from config import DATA_DIR, FRONTEND_ORIGIN, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI

log = logging.getLogger(__name__)
API = "https://api.github.com"
UA = "viewfy-gpt-ads"
TIMEOUT = 20.0


def configured() -> bool:
    return bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET)


def _secret_path(run_id: str) -> Path:
    return DATA_DIR / f"{run_id}.github.json"


def save_token(run_id: str, token: str, login: str) -> None:
    _secret_path(run_id).write_text(json.dumps({"token": token, "login": login}), encoding="utf-8")


def load_secret(run_id: str) -> dict[str, str] | None:
    p = _secret_path(run_id)
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def token_for(run_id: str) -> str | None:
    secret = load_secret(run_id)
    return (secret or {}).get("token")


def login_url(run_id: str) -> str:
    state = f"{run_id}.{secrets.token_urlsafe(16)}"
    qs = urlencode(
        {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": GITHUB_REDIRECT_URI,
            "scope": "repo read:user",
            "state": state,
        }
    )
    return f"https://github.com/login/oauth/authorize?{qs}"


def frontend_return(run_id: str) -> str:
    return f"{FRONTEND_ORIGIN}/?run={run_id}"


async def exchange_code(code: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json", "User-Agent": UA},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
        )
    data = r.json() if r.content else {}
    token = data.get("access_token")
    if not token:
        raise RuntimeError(data.get("error_description") or data.get("error") or "GitHub OAuth failed")
    return token


def _headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": UA,
    }


async def github_me(token: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        r = await c.get(f"{API}/user", headers=_headers(token))
    r.raise_for_status()
    return r.json()


async def list_repos(token: str, domain: str = "") -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        for page in range(1, 4):
            r = await c.get(
                f"{API}/user/repos",
                headers=_headers(token),
                params={"affiliation": "owner,collaborator,organization_member", "sort": "updated", "per_page": 50, "page": page},
            )
            r.raise_for_status()
            batch = r.json() or []
            for repo in batch:
                out.append(
                    {
                        "full_name": repo.get("full_name") or "",
                        "default_branch": repo.get("default_branch") or "main",
                        "html_url": repo.get("html_url") or "",
                        "private": bool(repo.get("private")),
                    }
                )
            if len(batch) < 50:
                break
    host = (domain or "").split(".")[0].lower()
    if host:
        out.sort(key=lambda r: (0 if host in (r["full_name"] or "").lower() else 1, r["full_name"]))
    return out[:80]


async def open_pixel_pr(token: str, repo: str, snippet: str, branch: str, default_branch: str) -> str:
    owner, name = repo.split("/", 1)
    async with httpx.AsyncClient(timeout=TIMEOUT) as c:
        repo_r = await c.get(f"{API}/repos/{owner}/{name}", headers=_headers(token))
        repo_r.raise_for_status()
        base = repo_r.json().get("default_branch") or default_branch or "main"
        ref_r = await c.get(f"{API}/repos/{owner}/{name}/git/ref/heads/{base}", headers=_headers(token))
        ref_r.raise_for_status()
        sha = ref_r.json()["object"]["sha"]
        await c.post(
            f"{API}/repos/{owner}/{name}/git/refs",
            headers=_headers(token),
            json={"ref": f"refs/heads/{branch}", "sha": sha},
        )
        target = None
        for path in ("index.html", "src/index.html", "public/index.html", "app/layout.tsx", "src/app/layout.tsx"):
            fr = await c.get(f"{API}/repos/{owner}/{name}/contents/{path}", headers=_headers(token), params={"ref": base})
            if fr.status_code == 200:
                target = (path, fr.json())
                break
        import base64

        if target:
            path, meta = target
            raw = base64.b64decode(meta.get("content") or "").decode("utf-8", errors="replace")
            if "astra.js" not in raw:
                if "</head>" in raw:
                    raw = raw.replace("</head>", f"    {snippet}\n  </head>", 1)
                elif "</body>" in raw:
                    raw = raw.replace("</body>", f"    {snippet}\n  </body>", 1)
                else:
                    raw = snippet + "\n" + raw
            put = await c.put(
                f"{API}/repos/{owner}/{name}/contents/{path}",
                headers=_headers(token),
                json={
                    "message": "Install GPT6 Astra conversion pixel",
                    "content": base64.b64encode(raw.encode()).decode(),
                    "sha": meta.get("sha"),
                    "branch": branch,
                },
            )
            put.raise_for_status()
        else:
            body = f"<!-- GPT6 Astra conversion pixel -->\n{snippet}\n"
            put = await c.put(
                f"{API}/repos/{owner}/{name}/contents/public/astra-pixel.html",
                headers=_headers(token),
                json={
                    "message": "Add GPT6 Astra conversion pixel snippet",
                    "content": base64.b64encode(body.encode()).decode(),
                    "branch": branch,
                },
            )
            put.raise_for_status()
        pr = await c.post(
            f"{API}/repos/{owner}/{name}/pulls",
            headers=_headers(token),
            json={
                "title": "Install GPT6 Astra conversion pixel",
                "head": branch,
                "base": base,
                "body": (
                    "GPT6 Astra adds the conversion pixel so ChatGPT Ads can attribute signups and purchases.\n\n"
                    f"```html\n{snippet}\n```\n"
                ),
            },
        )
        pr.raise_for_status()
        return pr.json().get("html_url") or ""
