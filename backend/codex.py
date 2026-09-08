from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from config import CURSOR_API_KEY
from github_oauth import open_pixel_pr, token_for
from tracking import apply_tracking, snippet_for, tracking_of

log = logging.getLogger(__name__)
CURSOR = "https://api.cursor.com/v1/agents"


def cursor_ready() -> bool:
    return bool(CURSOR_API_KEY)


def _auth() -> tuple[str, str]:
    return (CURSOR_API_KEY, "")


def pixel_prompt(run: dict[str, Any], repo: str) -> str:
    snippet = snippet_for(run["id"])
    domain = run.get("domain") or ""
    return f"""You are GPT6 Astra. Instrument {domain} in {repo} with conversion tracking for ChatGPT Ads.

Add this exact pixel to the site's root layout or HTML head (index.html, app/layout.tsx, or the framework equivalent). Do not refactor. Do not change dependencies.

{snippet}

Also fire astra('track', 'Signup') on the primary signup / trial / waitlist success path if that handler is obvious. If it is not obvious, only install the snippet.

Open a pull request titled "Install GPT6 Astra conversion pixel" that explains the pixel attributes ChatGPT Ads clicks (UTM + click ids) and PageView.
"""


async def launch_cursor(repo: str, branch: str, prompt: str) -> tuple[str, str | None]:
    url = f"https://github.com/{repo}"
    async with httpx.AsyncClient(timeout=40.0) as c:
        r = await c.post(
            CURSOR,
            auth=_auth(),
            headers={"Content-Type": "application/json"},
            json={
                "prompt": {"text": prompt},
                "model": {"id": "composer-2.5"},
                "repos": [{"url": url, "startingRef": branch}],
                "autoCreatePR": True,
                "skipReviewerRequest": True,
            },
        )
        if r.status_code >= 400:
            raise RuntimeError(f"Codex launch failed: {r.status_code} {r.text[:240]}")
        data = r.json()
    agent = data.get("agent") or data
    run = data.get("run") or {}
    agent_id = agent.get("id") or ""
    run_id = run.get("id") or agent.get("latestRunId")
    if not agent_id:
        raise RuntimeError("Codex did not return an agent id")
    return agent_id, run_id


async def poll_cursor(agent_id: str, run_id: str | None) -> str | None:
    async with httpx.AsyncClient(timeout=20.0) as c:
        if not run_id:
            info = await c.get(f"{CURSOR}/{agent_id}", auth=_auth())
            info.raise_for_status()
            run_id = (info.json() or {}).get("latestRunId")
        if not run_id:
            return None
        r = await c.get(f"{CURSOR}/{agent_id}/runs/{run_id}", auth=_auth())
        r.raise_for_status()
        data = r.json() or {}
    status = (data.get("status") or "").upper()
    git = data.get("git") or {}
    branches = git.get("branches") or []
    for b in branches:
        if b.get("prUrl"):
            return b["prUrl"]
    if status in {"FINISHED", "COMPLETED", "ERROR", "FAILED", "CANCELLED"}:
        return (branches[0].get("prUrl") if branches else None) or ""
    return None


async def instrument(run: dict[str, Any], repo: str, default_branch: str) -> dict[str, Any]:
    track = tracking_of(run)
    snippet = snippet_for(run["id"])
    token = token_for(run["id"])
    if cursor_ready():
        try:
            agent_id, run_id = await launch_cursor(repo, default_branch, pixel_prompt(run, repo))
            track["agent_id"] = agent_id
            track["note"] = "GPT6 Astra is reading the repo and adding the pixel…"
            run["tracking"] = track
            for _ in range(90):
                await asyncio.sleep(4)
                pr_url = await poll_cursor(agent_id, run_id)
                if pr_url:
                    return apply_tracking(run, repo=repo, pr_url=pr_url)
                if pr_url == "":
                    break
        except Exception:
            log.exception("codex agent failed, falling back to GitHub PR")
    if token:
        branch = "astra/gpt6-pixel"
        pr_url = await open_pixel_pr(token, repo, snippet, branch, default_branch)
        return apply_tracking(run, repo=repo, pr_url=pr_url)
    raise RuntimeError("Connect GitHub, or set CURSOR_API_KEY, to open the pixel PR")
