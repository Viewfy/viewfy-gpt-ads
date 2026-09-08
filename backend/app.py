from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel

from brief import BRANCHES, build_map, snapshot_brief
from config import DATA_DIR, FRONTEND_ORIGIN, MOCK, ROOT
from crawl import crawl_domain
from creatives import make_creative
from fixtures import apply_ads, apply_crawl, apply_creative, apply_github, apply_insights, apply_launch, apply_pixel_pr, hydrate_ads, hydrate_map, is_superagent
from insights import build_insights
from ads_key import save_key
from openai_ads import ad_account, launch_campaign, refresh_campaign
from research import research_ads
from store import get, new_run, save, update
from tracking import record_event, snippet_for, tracking_of
from util import brief_hash, host_of
import github_oauth

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)

app = FastAPI(title="Viewfy 💙 GPT Ads")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DomainIn(BaseModel):
    domain: str
    fixture: bool = False


class MapIn(BaseModel):
    nodes: list[dict[str, Any]]
    missing: list[str] | None = None


class ConfirmIn(BaseModel):
    competitor_ids: list[str] | None = None


class CreativeIn(BaseModel):
    id: str | None = None
    title: str | None = None
    body: str | None = None
    cta: str | None = None
    target_url: str | None = None
    image_url: str | None = None


class LaunchIn(BaseModel):
    budget_usd: float = 25
    geo: list[str] = ["US"]


class TrackingIn(BaseModel):
    repo: str


class CampaignIn(BaseModel):
    budget_usd: float | None = None
    geo: list[str] | None = None


class ConnectAdsIn(BaseModel):
    key: str = ""


@app.get("/api/health")
async def health() -> dict[str, Any]:
    if MOCK:
        return {"ok": True, "mock": True, "ads": {"ok": False, "mode": "demo", "error": "MOCK=1"}}
    acct = await ad_account()
    return {"ok": True, "mock": False, "ads": acct}


@app.post("/api/runs")
async def create_run(body: DomainIn, tasks: BackgroundTasks) -> dict[str, Any]:
    host = host_of(body.domain)
    if not host:
        raise HTTPException(400, "Enter a domain like getsuperagent.com")
    run = new_run(host)
    tasks.add_task(_understand, run["id"], body.fixture or MOCK)
    return run


@app.get("/api/runs/{run_id}")
async def read_run(run_id: str) -> dict[str, Any]:
    run = get(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return hydrate_ads(run)


@app.patch("/api/runs/{run_id}/map")
async def patch_map(run_id: str, body: MapIn) -> dict[str, Any]:
    run = _need(run_id)
    nodes = []
    for raw in body.nodes:
        branch = raw.get("branch")
        if branch not in BRANCHES:
            continue
        text = str(raw.get("text") or "").strip()
        if not text:
            continue
        nodes.append(
            {
                "id": raw.get("id") or text[:8],
                "branch": branch,
                "text": text[:220],
                "source_url": raw.get("source_url") or "",
                "provenance": raw.get("provenance") if raw.get("provenance") in ("website", "inference", "confirmed") else "confirmed",
                "domain": raw.get("domain") or "",
            }
        )
    run["map"] = {"nodes": nodes, "missing": body.missing if body.missing is not None else (run.get("map") or {}).get("missing") or []}
    if run.get("confirmed_at"):
        run["stale"] = {"research": True, "concepts": True, "creatives": True}
    return save(run)


@app.post("/api/runs/{run_id}/confirm")
async def confirm(run_id: str, body: ConfirmIn, tasks: BackgroundTasks) -> dict[str, Any]:
    run = _need(run_id)
    nodes = list((run.get("map") or {}).get("nodes") or [])
    if body.competitor_ids:
        keep = set(body.competitor_ids)
        nodes = [n for n in nodes if n.get("branch") != "competitors" or n.get("id") in keep]
    for n in nodes:
        if n.get("provenance") != "website":
            n["provenance"] = "confirmed"
        else:
            n["provenance"] = "confirmed"
    run["map"]["nodes"] = nodes
    brief = snapshot_brief(run)
    version = brief_hash(brief)
    run["brief"] = {**brief, "version": version}
    run["brief_version"] = version
    run["confirmed_at"] = run["updated_at"]
    run["step"] = "research"
    run["status"] = "researching"
    run["stale"] = {"research": False, "concepts": False, "creatives": False}
    run["ads"] = {"status": "running", "subjects": [], "error": None}
    save(run)
    tasks.add_task(_research, run_id)
    return run


@app.post("/api/runs/{run_id}/concepts")
async def concepts(run_id: str, tasks: BackgroundTasks) -> dict[str, Any]:
    run = _need(run_id)
    if not run.get("brief"):
        raise HTTPException(400, "Confirm the business map first")
    run["status"] = "writing"
    run["step"] = "concepts"
    save(run)
    tasks.add_task(_concepts, run_id)
    return run


@app.post("/api/runs/{run_id}/concepts/{concept_id}/select")
async def select_concept(run_id: str, concept_id: str, tasks: BackgroundTasks) -> dict[str, Any]:
    run = _need(run_id)
    if not any(c.get("id") == concept_id for c in run.get("concepts") or []):
        raise HTTPException(404, "Concept not found")
    run["selected_concept_id"] = concept_id
    run["step"] = "creatives"
    run["status"] = "rendering"
    save(run)
    tasks.add_task(_creative, run_id)
    return run


@app.patch("/api/runs/{run_id}/creative")
async def patch_creative(run_id: str, body: CreativeIn) -> dict[str, Any]:
    run = _need(run_id)
    run = hydrate_ads(run)
    if body.id:
        found = next((c for c in run.get("creatives") or [] if c.get("id") == body.id), None)
        if found:
            for key in ("title", "body", "cta", "target_url", "image_url"):
                val = getattr(body, key)
                if val is not None:
                    found[key] = val
            run["creative"] = dict(found)
            run["selected_concept_id"] = found.get("concept_id")
            return save(run)
    creative = dict(run.get("creative") or {})
    for key in ("title", "body", "cta", "target_url", "image_url"):
        val = getattr(body, key)
        if val is not None:
            creative[key] = val
    from lint import clip_card

    title, body_txt = clip_card(creative.get("title") or "", creative.get("body") or "")
    creative["title"] = title
    creative["body"] = body_txt
    run["creative"] = creative
    return save(run)


@app.patch("/api/runs/{run_id}/campaign")
async def patch_campaign(run_id: str, body: CampaignIn) -> dict[str, Any]:
    run = _need(run_id)
    campaign = dict(run.get("campaign") or {})
    if body.budget_usd is not None:
        campaign["budget_usd"] = body.budget_usd
    if body.geo is not None:
        campaign["geo"] = body.geo or ["US"]
    run["campaign"] = campaign
    return save(run)


@app.post("/api/runs/{run_id}/ads/connect")
async def connect_ads(run_id: str, body: ConnectAdsIn) -> dict[str, Any]:
    run = _need(run_id)
    campaign = dict(run.get("campaign") or {})
    key = (body.key or "").strip()
    if MOCK:
        if not key:
            campaign["error"] = "Paste a key"
            campaign["connected"] = False
            run["campaign"] = campaign
            return save(run)
        save_key(run_id, key)
        campaign["account"] = {"id": "adacct_mock", "name": "SUPERAGENT Ads", "status": "active", "review": "approved"}
        campaign["mode"] = "live"
        campaign["connected"] = True
        campaign["error"] = None
        run["campaign"] = campaign
        run["step"] = "ads"
        return save(run)
    if not key:
        campaign["error"] = "Paste a key"
        campaign["connected"] = False
        run["campaign"] = campaign
        return save(run)
    health = await ad_account(key)
    if not health.get("ok"):
        campaign["connected"] = False
        campaign["error"] = health.get("error") or "Could not verify that key"
        run["campaign"] = campaign
        return save(run)
    save_key(run_id, key)
    campaign["account"] = {k: health.get(k) for k in ("id", "name", "status", "currency", "review") if health.get(k)}
    campaign["mode"] = "live"
    campaign["connected"] = True
    campaign["error"] = None
    run["campaign"] = campaign
    run["step"] = "ads"
    return save(run)


@app.post("/api/runs/{run_id}/launch")
async def launch(run_id: str, body: LaunchIn) -> dict[str, Any]:
    run = _need(run_id)
    if not run.get("creative"):
        raise HTTPException(400, "Generate a creative first")
    campaign = dict(run.get("campaign") or {})
    campaign["budget_usd"] = body.budget_usd
    campaign["geo"] = body.geo or ["US"]
    run["campaign"] = campaign
    run["status"] = "launching"
    save(run)
    if MOCK:
        apply_launch(run, body.budget_usd, body.geo)
        return save(run)
    run["campaign"] = await launch_campaign(run)
    run["step"] = "autopilot"
    run["status"] = "ready"
    return save(run)


@app.post("/api/runs/{run_id}/ads/refresh")
async def refresh_ads(run_id: str) -> dict[str, Any]:
    run = _need(run_id)
    if MOCK:
        return run
    run["campaign"] = await refresh_campaign(run)
    return save(run)


@app.get("/api/runs/{run_id}/export")
async def export_run(run_id: str) -> dict[str, Any]:
    run = _need(run_id)
    return {
        "mode": "demo",
        "label": "Demo / export. Not submitted to ChatGPT Ads.",
        "brief": run.get("brief"),
        "insights": run.get("insights"),
        "concept": next((c for c in run.get("concepts") or [] if c.get("id") == run.get("selected_concept_id")), None),
        "creative": run.get("creative"),
        "campaign": run.get("campaign"),
    }


@app.get("/astra.js")
async def astra_js() -> FileResponse:
    path = ROOT / "backend" / "static" / "astra.js"
    return FileResponse(path, media_type="application/javascript")


@app.post("/api/t")
async def ingest_event(request: Request) -> dict[str, Any]:
    raw = (await request.body()).decode("utf-8", errors="replace")
    try:
        payload = __import__("json").loads(raw or "{}")
    except Exception:
        payload = {"raw": raw[:400]}
    if isinstance(payload, dict):
        record_event(payload)
    return {"ok": True}


@app.get("/api/github/login")
async def github_login(run_id: str) -> RedirectResponse:
    run = _need(run_id)
    if MOCK or not github_oauth.configured():
        apply_github(run)
        save(run)
        return RedirectResponse(github_oauth.frontend_return(run_id))
    return RedirectResponse(github_oauth.login_url(run_id))


@app.get("/api/github/callback")
async def github_callback(code: str = "", state: str = "", error: str = "") -> RedirectResponse:
    run_id = (state or "").split(".", 1)[0]
    if error or not code or not run_id:
        if run_id:
            update(run_id, tracking={**tracking_of(_need(run_id)), "status": "error", "error": error or "GitHub OAuth failed"})
        raise HTTPException(400, error or "GitHub OAuth failed")
    run = _need(run_id)
    try:
        token = await github_oauth.exchange_code(code)
        me = await github_oauth.github_me(token)
        login = me.get("login") or ""
        github_oauth.save_token(run_id, token, login)
        repos = await github_oauth.list_repos(token, run.get("domain") or "")
        track = tracking_of(run)
        track.update({"status": "connected", "login": login, "repos": repos, "repo": (repos[0]["full_name"] if repos else None), "error": None})
        run["tracking"] = track
        save(run)
    except Exception as e:
        log.exception("github callback failed")
        track = tracking_of(run)
        track.update({"status": "error", "error": str(e)[:240]})
        run["tracking"] = track
        save(run)
    return RedirectResponse(github_oauth.frontend_return(run_id))


@app.post("/api/runs/{run_id}/tracking")
async def start_tracking(run_id: str, body: TrackingIn, tasks: BackgroundTasks) -> dict[str, Any]:
    run = _need(run_id)
    repo = (body.repo or "").strip()
    if "/" not in repo:
        raise HTTPException(400, "Pick a GitHub repo")
    track = tracking_of(run)
    if track.get("status") not in {"connected", "pr_ready", "error", "running"} and not MOCK:
        if not github_oauth.token_for(run_id):
            raise HTTPException(400, "Connect GitHub first")
    default_branch = next((r.get("default_branch") or "main" for r in track.get("repos") or [] if r.get("full_name") == repo), "main")
    track.update({"status": "running", "repo": repo, "pr_url": None, "snippet": snippet_for(run_id), "error": None, "note": "GPT6 Astra is reading the repo and adding the pixel…"})
    run["tracking"] = track
    save(run)
    tasks.add_task(_instrument, run_id, repo, default_branch)
    return run


@app.get("/api/files/{name}")
async def files(name: str) -> FileResponse:
    path = Path(DATA_DIR) / name
    if not path.exists() or path.suffix.lower() not in {".png", ".jpg", ".webp"}:
        raise HTTPException(404, "File not found")
    return FileResponse(path)


def _need(run_id: str) -> dict[str, Any]:
    run = get(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return hydrate_ads(run)


async def _understand(run_id: str, force_fixture: bool) -> None:
    run = get(run_id)
    if not run:
        return
    domain = run["domain"]
    try:
        if MOCK or force_fixture:
            run["pages"] = [
                {"kind": kind, "url": "", "status": "crawling", "excerpt": "", "error": None}
                for kind in ("home", "about", "products", "pricing", "faq")
            ]
            save(run)
            await asyncio.sleep(1.1)
            run = get(run_id) or run
            apply_crawl(run)
            save(run)
            return
        if is_superagent(domain):
            try:
                crawl = await asyncio.wait_for(crawl_domain(domain), timeout=20)
            except Exception:
                apply_crawl(run)
                save(run)
                return
        else:
            crawl = await crawl_domain(domain)
        run["brand"] = crawl["brand"]
        run["pages"] = crawl["pages"]
        built = await build_map(crawl)
        run["brand"]["category"] = built.get("category") or run["brand"].get("category")
        run["map"] = {"nodes": built.get("nodes") or [], "missing": built.get("missing") or []}
        if not run["map"]["nodes"] and is_superagent(domain):
            apply_crawl(run)
        else:
            run["status"] = "ready"
            run["step"] = "confirmation"
            run["source"] = "live"
            if is_superagent(domain):
                hydrate_map(run)
        save(run)
    except Exception as e:
        log.exception("understand failed")
        if is_superagent(domain):
            apply_crawl(run)
            save(run)
            return
        update(run_id, status="error", error=str(e)[:300])


async def _research(run_id: str) -> None:
    run = get(run_id)
    if not run or not run.get("brief"):
        return
    try:
        if MOCK or run.get("source") == "fixture":
            await asyncio.sleep(1.0)
            run = get(run_id) or run
            apply_ads(run)
            apply_insights(run)
            save(run)
            return
        ads = await asyncio.wait_for(research_ads(run["brief"]), timeout=200)
        live_empty = not any(
            (s.get("meta") or {}).get("ads") or (s.get("google") or {}).get("ads") for s in ads.get("subjects") or []
        )
        live_error = all(
            (s.get("meta") or {}).get("status") == "error" and (s.get("google") or {}).get("status") == "error"
            for s in ads.get("subjects") or []
        ) if ads.get("subjects") else True
        if (live_empty or live_error) and is_superagent(run["domain"]):
            apply_ads(run)
            run["ads"]["source"] = "fixture"
            save(run)
        else:
            ads["brief_version"] = run.get("brief_version")
            run["ads"] = ads
            run["status"] = "ready"
            run["step"] = "research"
            save(run)
        pack = await build_insights(run["brief"], (run.get("ads") or {}).get("subjects") or [])
        run = get(run_id) or run
        run["insights"] = pack["insights"]
        run["concepts"] = pack["concepts"]
        run["status"] = "ready"
        save(run)
    except Exception as e:
        log.exception("research failed")
        if is_superagent(run["domain"]):
            apply_ads(run)
            pack = await build_insights(run["brief"], (run.get("ads") or {}).get("subjects") or [])
            run["insights"] = pack["insights"]
            run["concepts"] = pack["concepts"]
            run["ads"]["source"] = "fixture"
            save(run)
            return
        update(run_id, status="error", error=str(e)[:300], ads={"status": "error", "subjects": [], "error": str(e)[:300]})


async def _concepts(run_id: str) -> None:
    run = get(run_id)
    if not run:
        return
    if MOCK:
        apply_insights(run)
        save(run)
        return
    if run.get("concepts"):
        run["status"] = "ready"
        save(run)
        return
    pack = await build_insights(run.get("brief") or {}, (run.get("ads") or {}).get("subjects") or [])
    run["insights"] = pack["insights"]
    run["concepts"] = pack["concepts"]
    run["status"] = "ready"
    save(run)


async def _creative(run_id: str) -> None:
    run = get(run_id)
    if not run:
        return
    concept = next((c for c in run.get("concepts") or [] if c.get("id") == run.get("selected_concept_id")), None)
    if not concept:
        update(run_id, status="error", error="Pick a concept first")
        return
    try:
        if MOCK:
            await asyncio.sleep(0.8)
            run = get(run_id) or run
            apply_creative(run)
            save(run)
            return
        run["creative"] = await make_creative(run, concept)
        run["status"] = "ready"
        run["step"] = "creatives"
        save(run)
    except Exception as e:
        log.exception("creative failed")
        update(run_id, status="error", error=str(e)[:300])


async def _instrument(run_id: str, repo: str, default_branch: str) -> None:
    run = get(run_id)
    if not run:
        return
    try:
        if MOCK:
            await asyncio.sleep(1.4)
            run = get(run_id) or run
            apply_pixel_pr(run, repo)
            save(run)
            return
        from codex import instrument

        run = await instrument(run, repo, default_branch)
        save(run)
    except Exception as e:
        log.exception("tracking instrument failed")
        run = get(run_id) or run
        track = tracking_of(run)
        track.update({"status": "error", "error": str(e)[:300]})
        run["tracking"] = track
        save(run)
