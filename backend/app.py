from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from brief import BRANCHES, build_map, snapshot_brief
from config import DATA_DIR, FRONTEND_ORIGIN, LIVE_CAMPAIGN_SUBMISSION_ENABLED, MOCK, ROOT
from crawl import crawl_domain
from creatives import make_creative
from fixtures import apply_ads, apply_crawl, apply_creative, apply_insights, hydrate_ads, is_superagent
from insights import build_insights
from ads_key import key_for, save_key
from openai_ads import ad_account, launch_campaign, refresh_campaign, valid_external_id
from research import research_ads
from store import empty_tracking, get, new_run, save, update
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


@app.get("/healthz", include_in_schema=False)
async def readiness() -> dict[str, bool]:
    """A deployment healthcheck that never depends on external integrations."""
    return {"ok": True}


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
    acct = await ad_account()
    return {"ok": True, "mock": MOCK, "ads": acct}


@app.post("/api/runs")
async def create_run(body: DomainIn, tasks: BackgroundTasks) -> dict[str, Any]:
    host = host_of(body.domain)
    if not host:
        raise HTTPException(400, "Enter a domain like getsuperagent.com")
    run = new_run(host)
    if body.fixture or MOCK or is_superagent(host):
        apply_crawl(run)
        hydrate_ads(run)
        return save(run)
    tasks.add_task(_understand, run["id"], body.fixture or MOCK)
    return run


@app.get("/api/runs/{run_id}")
async def read_run(run_id: str) -> dict[str, Any]:
    run = get(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    if is_superagent(run["domain"]) and run.get("step") == "understanding" and run.get("status") == "crawling":
        if _needs_initial_map(run):
            draft = {key: run[key] for key in ("campaign", "creative") if key in run}
            apply_crawl(run)
            hydrate_ads(run)
            run.update(draft)
            return save(run)
        # A custom map or confirmed run must not be replaced by recovery.
        return run
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
    run["ads"] = {**run.get("ads", {}), "status": "running", "error": None}
    run["concepts"] = []
    run["selected_concept_id"] = None
    run["error"] = None
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


def _demo_flow(run: dict[str, Any]) -> bool:
    return run.get("source") == "fixture" or is_superagent(str(run.get("domain") or ""))


@app.post("/api/runs/{run_id}/ads/connect")
async def connect_ads(run_id: str, body: ConnectAdsIn) -> dict[str, Any]:
    run = _need(run_id)
    campaign = dict(run.get("campaign") or {})
    supplied_key = (body.key or "").strip()
    if _demo_flow(run) and supplied_key:
        campaign.update({
            "status": "draft", "mode": "live", "connected": True, "preview": True,
            "account": {"id": "acct_preview", "name": "Preview"},
            "error": None, "note": None,
        })
        run["campaign"] = campaign
        run["step"] = "ads"
        run["status"] = "ready"
        return save(run)
    key = supplied_key or key_for(run_id)
    health = await ad_account(key)
    run["step"] = "ads"
    run["status"] = "ready"
    if not health.get("ok") or not valid_external_id(health.get("id")):
        campaign.update({
            "status": "draft", "mode": "unconnected", "connected": False,
            "account": None, "note": None,
            "error": health.get("error") or "Could not verify the Ads Manager key",
        })
        run["campaign"] = campaign
        return save(run)
    if supplied_key:
        save_key(run_id, supplied_key)
    campaign["account"] = {k: health.get(k) for k in ("id", "name", "status", "currency", "review") if health.get(k)}
    campaign["mode"] = "live"
    campaign["connected"] = True
    campaign["error"] = None
    campaign["note"] = None
    run["campaign"] = campaign
    run["step"] = "ads"
    return save(run)


@app.post("/api/runs/{run_id}/launch")
async def launch(run_id: str, body: LaunchIn) -> dict[str, Any]:
    if not LIVE_CAMPAIGN_SUBMISSION_ENABLED:
        return await skip_launch(run_id)
    run = _need(run_id)
    if not run.get("creative"):
        raise HTTPException(400, "Generate a creative first")
    campaign = dict(run.get("campaign") or {})
    campaign["budget_usd"] = body.budget_usd
    campaign["geo"] = body.geo or ["US"]
    run["campaign"] = campaign
    run["status"] = "launching"
    save(run)
    try:
        run["campaign"] = await launch_campaign(run)
    except Exception as exc:
        log.exception("campaign launch failed")
        campaign.update({"status": "failed", "error": str(exc)[:300] or "Campaign launch failed."})
        run["campaign"] = campaign
    submitted = _submitted_campaign(run["campaign"]) or bool((run.get("campaign") or {}).get("preview"))
    run["step"] = "autopilot" if submitted else "ads"
    run["status"] = "ready"
    return save(run)


@app.post("/api/runs/{run_id}/ads/refresh")
async def refresh_ads(run_id: str) -> dict[str, Any]:
    run = _need(run_id)
    run["campaign"] = await refresh_campaign(run)
    if not _submitted_campaign(run["campaign"]):
        run["step"] = "ads"
    run["status"] = "ready"
    return save(run)


@app.post("/api/runs/{run_id}/skip-launch")
async def skip_launch(run_id: str) -> dict[str, Any]:
    # Read the saved draft directly: skipping must not hydrate or submit it.
    run = get(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    if run.get("status") == "launching":
        raise HTTPException(409, "Campaign submission is in progress. Wait for it to finish before skipping.")
    campaign = dict(run.get("campaign") or {})
    campaign["submission_deferred"] = True
    run["campaign"] = campaign
    run["step"] = "autopilot"
    run["status"] = "ready"
    return save(run)


@app.get("/api/runs/{run_id}/export")
async def export_run(run_id: str) -> dict[str, Any]:
    run = _need(run_id)
    campaign = run.get("campaign") or {}
    status = campaign.get("status") or "draft"
    return {
        "mode": campaign.get("mode") or "unconnected",
        "label": f"Campaign export · {status.replace('_', ' ')}",
        "brief": run.get("brief"),
        "public_channels": run.get("public_channels"),
        "insights": run.get("insights"),
        "concept": next((c for c in run.get("concepts") or [] if c.get("id") == run.get("selected_concept_id")), None),
        "creative": run.get("creative"),
        "campaign": run.get("campaign"),
    }


def _submitted_campaign(campaign: dict[str, Any]) -> bool:
    ids = campaign.get("external_ids") or {}
    return bool(
        campaign.get("mode") == "live"
        and campaign.get("status") in {"submitted", "under_review", "active"}
        and campaign.get("review_status") != "rejected"
        and all(valid_external_id(ids.get(key)) for key in ("campaign_id", "ad_group_id", "ad_id"))
    )


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
    if not github_oauth.configured():
        run["tracking"] = {**empty_tracking(), "status": "error", "error": "GitHub OAuth is not configured. Configure it before connecting a repository."}
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
    path = (Path(DATA_DIR) / name).resolve()
    if path.parent != Path(DATA_DIR).resolve() or not path.is_file() or path.suffix.lower() not in {".png", ".jpg", ".webp"}:
        raise HTTPException(404, "File not found")
    return FileResponse(path)


def _need(run_id: str) -> dict[str, Any]:
    run = get(run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return hydrate_ads(run)


def _needs_initial_map(run: dict[str, Any]) -> bool:
    return bool(
        run.get("step") == "understanding"
        and run.get("status") == "crawling"
        and not run.get("confirmed_at")
        and not (run.get("map") or {}).get("nodes")
    )


async def _understand(run_id: str, force_fixture: bool) -> None:
    run = get(run_id)
    if not run or not _needs_initial_map(run):
        return
    domain = run["domain"]
    try:
        if MOCK or force_fixture or is_superagent(domain):
            apply_crawl(run)
            hydrate_ads(run)
            save(run)
            return
        crawl = await crawl_domain(domain)
        built = await build_map(crawl)
        run = get(run_id)
        if not run or not _needs_initial_map(run):
            return
        run["brand"] = crawl["brand"]
        run["pages"] = crawl["pages"]
        run["brand"]["category"] = built.get("category") or run["brand"].get("category")
        run["map"] = {"nodes": built.get("nodes") or [], "missing": built.get("missing") or []}
        run["status"] = "ready"
        run["step"] = "confirmation"
        run["source"] = "live"
        save(run)
    except Exception as e:
        log.exception("understand failed")
        current = get(run_id)
        if current and _needs_initial_map(current):
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
            apply_insights(run)
            run["ads"]["fallback_reason"] = "Live libraries returned no verified creatives; showing the dated public research snapshot."
            save(run)
            return
        else:
            ads["brief_version"] = run.get("brief_version")
            run["ads"] = ads
            run["status"] = "writing"
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
            apply_insights(run)
            run["ads"]["fallback_reason"] = "Live library research was unavailable; showing the dated public research snapshot."
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
        if not github_oauth.token_for(run_id):
            raise RuntimeError("Connect GitHub before installing conversion tracking.")
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


class FrontendFiles(StaticFiles):
    """Serve the built SPA while preserving API and missing-asset 404s."""

    async def get_response(self, path: str, scope: dict[str, Any]):
        if path == "api" or path.startswith("api/"):
            raise HTTPException(404, "Not found")
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code != 404 or Path(path).suffix:
                raise
            return await super().get_response("index.html", scope)


frontend_dist = ROOT / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/", FrontendFiles(directory=frontend_dist, html=True), name="frontend")
