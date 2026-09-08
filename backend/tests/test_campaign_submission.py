"""Credential and launch regressions; every HTTP request uses MockTransport."""
from __future__ import annotations

import copy
import json
import os
import runpy
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import BackgroundTasks, HTTPException

import ads_key
import app as api
import codex
import config
import openai_ads
import store
import tracking


class CampaignSubmissionTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        data = Path(self.temp.name)
        self.enterContext(patch.object(store, "DATA_DIR", data))
        self.enterContext(patch.object(ads_key, "DATA_DIR", data))
        self.enterContext(patch.object(ads_key, "OPENAI_ADS_API_KEY", ""))
        self.enterContext(patch.object(api, "MOCK", True))
        # Existing API-contract tests exercise the explicit live-submission mode.
        self.enterContext(patch.object(api, "LIVE_CAMPAIGN_SUBMISSION_ENABLED", True))
        self.enterContext(patch.object(api, "hydrate_ads", lambda run: run))
        self.enterContext(patch.object(api.github_oauth, "DATA_DIR", data))
        self.requests = []
        self.handler = self.reject_unexpected_request
        real_client = httpx.AsyncClient
        transport = httpx.MockTransport(self.dispatch)
        self.enterContext(patch.object(httpx, "AsyncClient", lambda **kwargs: real_client(transport=transport, **kwargs)))
        self.run = store.new_run("example.com")
        self.run.update({
            "step": "ads", "status": "ready",
            "brand": {"name": "Example", "category": "Software"},
            "creative": {"title": "Meet Example", "body": "A useful product", "image_url": "https://assets.example/creative.png", "target_url": "https://example.com"},
        })
        store.save(self.run)

    def dispatch(self, request):
        self.requests.append(request)
        return self.handler(request)

    def reject_unexpected_request(self, request):
        raise AssertionError(f"Unexpected network request: {request.method} {request.url.path}")

    def authorize(self):
        ads_key.save_key(self.run["id"], "test-ads-key")

    def account(self):
        return {"id": "account_1", "name": "Example account", "status": "active", "currency_code": "USD"}

    def successful_http(self, request):
        self.assertEqual(request.headers["Authorization"], "Bearer test-ads-key")
        path = request.url.path.removeprefix("/v1")
        if request.method == "GET" and path == "/ad_account":
            return httpx.Response(200, json=self.account())
        if request.method == "POST" and path == "/upload":
            return httpx.Response(200, json={"file_id": "file_1"})
        if request.method == "GET" and path == "/geo_lookup/search":
            return httpx.Response(200, json={"results": [{"id": "country_us", "country_code": "US", "type": "country"}]})
        if request.method == "POST" and path == "/campaigns":
            payload = json.loads(request.content)
            self.assertEqual(payload["status"], "paused")
            self.assertEqual(payload["budget"], {"lifetime_spend_limit_micros": 25_000_000})
            self.assertEqual(request.headers["Idempotency-Key"], f"run-{self.run['id']}-campaign")
            return httpx.Response(200, json={"id": "campaign_1"})
        if request.method == "POST" and path == "/ad_groups":
            self.assertEqual(json.loads(request.content)["campaign_id"], "campaign_1")
            return httpx.Response(200, json={"id": "group_1"})
        if request.method == "POST" and path == "/ads":
            payload = json.loads(request.content)
            self.assertEqual(payload["ad_group_id"], "group_1")
            self.assertEqual(payload["creative"]["type"], "chat_card")
            return httpx.Response(200, json={"id": "ad_1", "review_status": "approved"})
        if request.method == "POST" and path == "/campaigns/campaign_1/activate":
            return httpx.Response(200, json={"status": "active"})
        if request.method == "GET" and path == "/ads/ad_1":
            return httpx.Response(200, json={"id": "ad_1", "status": "active", "review_status": "approved"})
        if request.method == "GET" and path == "/campaigns/campaign_1":
            return httpx.Response(200, json={"id": "campaign_1", "status": "active"})
        if request.method == "GET" and path == "/ads/ad_1/insights":
            return httpx.Response(200, json={"data": [{"impressions": 4, "clicks": 1, "spend": 0.25}]})
        return self.reject_unexpected_request(request)

    async def test_missing_key_health_and_connect_are_unconnected_even_with_mock_research(self):
        health = await api.health()
        self.assertTrue(health["mock"])
        self.assertFalse(health["ads"]["ok"])
        self.assertEqual(health["ads"]["mode"], "unconnected")
        run = await api.connect_ads(self.run["id"], api.ConnectAdsIn())
        self.assertEqual((run["step"], run["campaign"]["status"]), ("ads", "draft"))
        self.assertFalse(run["campaign"]["connected"])
        self.assertIsNone(run["campaign"]["account"])
        self.assertTrue(run["campaign"]["error"])
        self.assertEqual(self.requests, [])

    async def test_invalid_key_does_not_connect_or_store_credentials(self):
        self.handler = lambda request: httpx.Response(401, json={"error": "Invalid credential"})
        run = await api.connect_ads(self.run["id"], api.ConnectAdsIn(key="invalid-key"))
        self.assertEqual(run["campaign"]["mode"], "unconnected")
        self.assertFalse(run["campaign"]["connected"])
        self.assertEqual((run["step"], run["campaign"]["status"]), ("ads", "draft"))
        self.assertIn("401", run["campaign"]["error"])
        self.assertEqual(ads_key.load_key(self.run["id"]), "")
        self.assertEqual([r.method for r in self.requests], ["GET"])

    async def test_demo_run_accepts_any_key_without_calling_ads(self):
        self.run["source"] = "fixture"
        self.run["domain"] = "getsuperagent.com"
        store.save(self.run)
        run = await api.connect_ads(self.run["id"], api.ConnectAdsIn(key="not-a-real-key"))
        self.assertTrue(run["campaign"]["connected"])
        self.assertTrue(run["campaign"]["preview"])
        self.assertEqual(run["campaign"]["account"]["id"], "acct_preview")
        self.assertEqual(ads_key.load_key(self.run["id"]), "")
        self.assertEqual(self.requests, [])

    async def test_demo_run_launch_skips_ads_api(self):
        self.run["source"] = "fixture"
        self.run["domain"] = "getsuperagent.com"
        self.run["campaign"].update({
            "mode": "live", "connected": True, "preview": True,
            "account": {"id": "acct_preview", "name": "Preview"},
        })
        store.save(self.run)
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "autopilot")
        self.assertTrue(run["campaign"]["preview"])
        self.assertEqual(run["campaign"]["external_ids"], {})
        self.assertEqual(self.requests, [])

    async def test_empty_connect_key_validates_existing_run_key(self):
        self.authorize()
        self.handler = self.successful_http
        run = await api.connect_ads(self.run["id"], api.ConnectAdsIn())
        self.assertTrue(run["campaign"]["connected"])
        self.assertEqual(run["campaign"]["mode"], "live")
        self.assertEqual(run["campaign"]["account"]["id"], "account_1")
        self.assertEqual([r.url.path for r in self.requests], ["/v1/ad_account"])

    async def test_empty_connect_key_validates_server_key_without_copying_it_to_run(self):
        self.handler = self.successful_http
        with patch.object(ads_key, "OPENAI_ADS_API_KEY", "test-ads-key"):
            run = await api.connect_ads(self.run["id"], api.ConnectAdsIn())
            health = await api.health()
        self.assertTrue(run["campaign"]["connected"])
        self.assertEqual(ads_key.load_key(self.run["id"]), "")
        self.assertTrue(health["ads"]["ok"])
        self.assertEqual(health["ads"]["mode"], "live")

    async def test_malformed_account_response_is_not_connected(self):
        self.handler = lambda request: httpx.Response(200, json={"name": "Missing account ID"})
        run = await api.connect_ads(self.run["id"], api.ConnectAdsIn(key="invalid-key"))
        self.assertEqual(run["campaign"]["mode"], "unconnected")
        self.assertIn("account ID", run["campaign"]["error"])

    async def test_unavailable_account_is_explicitly_unconnected(self):
        def unavailable(request):
            raise httpx.ConnectError("Account service unavailable", request=request)
        self.handler = unavailable
        result = await openai_ads.ad_account("invalid-key")
        self.assertFalse(result["ok"])
        self.assertEqual(result["mode"], "unconnected")
        self.assertIn("unavailable", result["error"])

    async def test_missing_key_never_launches_or_advances_even_with_mock_research(self):
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "ads")
        self.assertEqual(run["status"], "ready")
        self.assertEqual(run["campaign"]["status"], "draft")
        self.assertEqual(run["campaign"]["mode"], "unconnected")
        self.assertTrue(run["campaign"]["error"])
        self.assertEqual(run["campaign"]["external_ids"], {})
        self.assertEqual(self.requests, [])

    def test_live_submission_config_defaults_off_and_requires_opt_in(self):
        for value, expected in ((None, False), ("0", False), ("false", False), ("unexpected", False), ("1", True), ("true", True)):
            with self.subTest(value=value), patch.dict(os.environ, {"DATA_DIR": self.temp.name}), patch("dotenv.load_dotenv"):
                os.environ.pop("LIVE_CAMPAIGN_SUBMISSION_ENABLED", None)
                if value is not None:
                    os.environ["LIVE_CAMPAIGN_SUBMISSION_ENABLED"] = value
                loaded = runpy.run_path(config.__file__)
                self.assertIs(loaded["LIVE_CAMPAIGN_SUBMISSION_ENABLED"], expected)

    async def test_disabled_launch_accepts_disconnected_run_without_creative_or_external_calls(self):
        self.run["domain"] = "getsuperagent.com"
        self.run["creative"] = None
        self.run["campaign"].update({"budget_usd": 73, "geo": ["CA"], "error": "No account connected"})
        store.save(self.run)
        before = copy.deepcopy(self.run)
        with patch.object(api, "LIVE_CAMPAIGN_SUBMISSION_ENABLED", False), \
                patch.object(api, "_need", side_effect=AssertionError("Disabled launch must not hydrate or validate")), \
                patch.object(api, "ad_account", AsyncMock()) as account, \
                patch.object(api, "connect_ads", AsyncMock()) as connect, \
                patch.object(api, "launch_campaign", AsyncMock()) as launch, \
                patch.object(api, "refresh_campaign", AsyncMock()) as refresh:
            result = await api.launch(self.run["id"], api.LaunchIn(budget_usd=999, geo=["US"]))
        for external in (account, connect, launch, refresh):
            external.assert_not_called()
        expected = copy.deepcopy(before)
        expected["campaign"]["submission_deferred"] = True
        expected.update({"step": "autopilot", "status": "ready", "updated_at": result["updated_at"]})
        self.assertEqual(result, expected)
        self.assertEqual(store.get(self.run["id"]), expected)
        self.assertEqual(self.requests, [])

    async def test_disabled_launch_with_saved_credentials_preserves_real_campaign_evidence(self):
        self.authorize()
        self.run["campaign"].update({
            "mode": "live", "connected": True, "status": "under_review", "review_status": "pending",
            "budget_usd": 73, "geo": ["CA"], "account": self.account(),
            "external_ids": {"campaign_id": "campaign_1", "ad_group_id": "group_1", "ad_id": "ad_1"},
        })
        store.save(self.run)
        before = copy.deepcopy(self.run)
        with patch.object(api, "LIVE_CAMPAIGN_SUBMISSION_ENABLED", False), \
                patch.object(api, "launch_campaign", AsyncMock()) as launch:
            result = await api.launch(self.run["id"], api.LaunchIn())
        launch.assert_not_called()
        self.assertEqual(result["campaign"], {**before["campaign"], "submission_deferred": True})
        self.assertEqual(result["creative"], before["creative"])
        self.assertEqual(ads_key.load_key(self.run["id"]), "test-ads-key")
        self.assertEqual((result["step"], result["status"]), ("autopilot", "ready"))
        self.assertEqual(self.requests, [])

    async def test_disabled_launch_cannot_interrupt_an_in_progress_submission(self):
        self.run["status"] = "launching"
        store.save(self.run)
        before = copy.deepcopy(self.run)
        with patch.object(api, "LIVE_CAMPAIGN_SUBMISSION_ENABLED", False), self.assertRaises(HTTPException) as raised:
            await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(store.get(self.run["id"]), before)
        self.assertEqual(self.requests, [])

    async def test_skip_launch_preserves_failed_draft_without_external_calls(self):
        self.authorize()
        self.run["campaign"].update({
            "mode": "live", "connected": True, "status": "failed",
            "budget_usd": 73, "geo": ["US", "CA"],
            "account": self.account(),
            "external_ids": {"campaign_id": "campaign_1", "file_id": "file_1"},
            "error": "Previous submission failed", "note": "Retain this context",
        })
        store.save(self.run)
        before = copy.deepcopy(self.run)
        with patch.object(api, "ad_account", AsyncMock()) as account, \
                patch.object(api, "connect_ads", AsyncMock()) as connect, \
                patch.object(api, "launch_campaign", AsyncMock()) as launch, \
                patch.object(api, "refresh_campaign", AsyncMock()) as refresh, \
                patch.object(api, "hydrate_ads", side_effect=AssertionError("Skip must not hydrate a draft")):
            result = await api.skip_launch(self.run["id"])
        for external in (account, connect, launch, refresh):
            external.assert_not_called()
        expected = copy.deepcopy(before)
        expected["campaign"]["submission_deferred"] = True
        expected.update({"step": "autopilot", "status": "ready", "updated_at": result["updated_at"]})
        self.assertEqual(result, expected)
        self.assertEqual(store.get(self.run["id"]), expected)
        self.assertEqual(ads_key.load_key(self.run["id"]), "test-ads-key")
        self.assertEqual(self.requests, [])

    async def test_skip_launch_preserves_prior_real_submission_evidence(self):
        self.run["campaign"].update({
            "mode": "live", "connected": True, "status": "active", "review_status": "approved",
            "account": self.account(),
            "external_ids": {"campaign_id": "campaign_1", "ad_group_id": "group_1", "ad_id": "ad_1"},
            "insights": {"impressions": 4, "clicks": 1},
        })
        store.save(self.run)
        campaign_before = copy.deepcopy(self.run["campaign"])
        result = await api.skip_launch(self.run["id"])
        self.assertEqual(result["campaign"], {**campaign_before, "submission_deferred": True})
        self.assertTrue(api._submitted_campaign(result["campaign"]))
        self.assertEqual((result["step"], result["status"]), ("autopilot", "ready"))
        self.assertEqual(self.requests, [])

    async def test_skip_launch_rejects_busy_run_without_changing_saved_state(self):
        self.run["status"] = "launching"
        store.save(self.run)
        before = copy.deepcopy(self.run)
        with self.assertRaises(HTTPException) as raised:
            await api.skip_launch(self.run["id"])
        self.assertEqual(raised.exception.status_code, 409)
        self.assertEqual(store.get(self.run["id"]), before)
        self.assertEqual(self.requests, [])

    async def test_rejected_launch_credentials_make_no_external_writes(self):
        self.authorize()
        self.handler = lambda request: httpx.Response(403, json={"error": "Account access denied"})
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "ads")
        self.assertEqual(run["campaign"]["mode"], "unconnected")
        self.assertIn("403", run["campaign"]["error"])
        self.assertEqual([r.method for r in self.requests], ["GET"])

    async def test_verified_launch_uses_real_api_contract_even_with_mock_research(self):
        self.authorize()
        self.handler = self.successful_http
        run = await api.launch(self.run["id"], api.LaunchIn())
        campaign = run["campaign"]
        self.assertEqual(run["step"], "autopilot")
        self.assertEqual(campaign["status"], "active")
        self.assertEqual(campaign["mode"], "live")
        self.assertTrue(campaign["connected"])
        self.assertEqual(campaign["account"]["id"], "account_1")
        self.assertEqual(campaign["external_ids"], {"campaign_id": "campaign_1", "ad_group_id": "group_1", "ad_id": "ad_1", "file_id": "file_1"})
        self.assertEqual(campaign["insights"]["impressions"], 4)
        self.assertTrue(any(r.url.path.endswith("/activate") for r in self.requests))

    async def test_missing_ad_id_preserves_partial_records_and_does_not_activate(self):
        self.authorize()
        self.handler = lambda request: httpx.Response(200, json={"review_status": "approved"}) if request.url.path == "/v1/ads" else self.successful_http(request)
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "ads")
        self.assertEqual(run["campaign"]["status"], "failed")
        self.assertEqual(run["campaign"]["external_ids"]["campaign_id"], "campaign_1")
        self.assertEqual(run["campaign"]["external_ids"]["ad_group_id"], "group_1")
        self.assertNotIn("ad_id", run["campaign"]["external_ids"])
        self.assertFalse(any(r.url.path.endswith("/activate") for r in self.requests))

    async def test_activation_failure_preserves_submitted_ids_without_claiming_active(self):
        self.authorize()
        self.handler = lambda request: httpx.Response(400, json={"error": "Payment method required"}) if request.url.path.endswith("/activate") else self.successful_http(request)
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["campaign"]["status"], "submitted")
        self.assertEqual(run["campaign"]["external_ids"]["ad_id"], "ad_1")
        self.assertIn("remains paused", run["campaign"]["note"])

    async def test_activation_failure_with_pending_review_stays_submitted_and_paused(self):
        self.authorize()
        def handler(request):
            if request.url.path == "/v1/ads":
                return httpx.Response(200, json={"id": "ad_1", "review_status": "pending"})
            if request.url.path.endswith("/activate"):
                return httpx.Response(400, json={"error": "Payment method required"})
            return self.successful_http(request)
        self.handler = handler
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["campaign"]["status"], "submitted")
        self.assertIn("remains paused", run["campaign"]["note"])

    async def test_optional_insights_failure_does_not_undo_verified_submission(self):
        self.authorize()
        def handler(request):
            if request.url.path.endswith("/insights"):
                raise httpx.ReadTimeout("Insights not ready", request=request)
            return self.successful_http(request)
        self.handler = handler
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "autopilot")
        self.assertEqual(run["campaign"]["status"], "active")
        self.assertIsNone(run["campaign"]["insights"])

    async def test_endpoint_rejects_success_status_without_external_ids(self):
        response = {"status": "active", "mode": "live", "connected": True, "external_ids": {}}
        with patch.object(api, "launch_campaign", AsyncMock(return_value=response)):
            run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "ads")

    def test_submission_guard_rejects_empty_fake_ids_and_rejected_creatives(self):
        campaign = {"mode": "live", "status": "submitted", "external_ids": {"campaign_id": "campaign_1", "ad_group_id": "group_1", "ad_id": "ad_1"}}
        for invalid in (None, "", "  ", 1, "ad_demo", "mock-ad", "fixture_ad"):
            with self.subTest(ad_id=invalid):
                bad = copy.deepcopy(campaign)
                bad["external_ids"]["ad_id"] = invalid
                self.assertFalse(api._submitted_campaign(bad))
        campaign["review_status"] = "rejected"
        self.assertFalse(api._submitted_campaign(campaign))

    async def test_unexpected_launch_exception_keeps_ads_step(self):
        with patch.object(api, "launch_campaign", AsyncMock(side_effect=RuntimeError("Submission unavailable"))):
            run = await api.launch(self.run["id"], api.LaunchIn())
        self.assertEqual(run["step"], "ads")
        self.assertEqual(run["campaign"]["status"], "failed")
        self.assertIn("Submission unavailable", run["campaign"]["error"])

    async def test_refresh_missing_credentials_returns_error_even_with_mock_research(self):
        self.run["step"] = "autopilot"
        self.run["campaign"].update({"mode": "live", "connected": True, "status": "active", "external_ids": {"campaign_id": "campaign_1", "ad_group_id": "group_1", "ad_id": "ad_1"}})
        store.save(self.run)
        run = await api.refresh_ads(self.run["id"])
        self.assertEqual(run["step"], "ads")
        self.assertEqual(run["campaign"]["mode"], "unconnected")
        self.assertFalse(run["campaign"]["connected"])
        self.assertTrue(run["campaign"]["error"])
        self.assertEqual(run["campaign"]["external_ids"]["ad_id"], "ad_1")

    async def test_refresh_uses_real_records_even_with_mock_research(self):
        self.authorize()
        self.handler = self.successful_http
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.requests.clear()
        run = await api.refresh_ads(run["id"])
        self.assertEqual(run["campaign"]["status"], "active")
        self.assertTrue(run["campaign"]["connected"])
        self.assertIn("/v1/ads/ad_1", [r.url.path for r in self.requests])
        self.assertTrue(all(r.method == "GET" for r in self.requests))

    async def test_refresh_cannot_infer_campaign_active_from_active_ad_when_campaign_lookup_fails(self):
        self.authorize()
        self.handler = self.successful_http
        run = await api.launch(self.run["id"], api.LaunchIn())
        self.handler = lambda request: httpx.Response(503, json={"error": "Unavailable"}) if request.url.path == "/v1/campaigns/campaign_1" else self.successful_http(request)
        run = await api.refresh_ads(run["id"])
        self.assertEqual(run["step"], "ads")
        self.assertEqual(run["campaign"]["status"], "failed")
        self.assertTrue(run["campaign"]["error"])

    def test_legacy_unsent_campaign_is_normalized_without_changing_creative_or_budget(self):
        for old_step in ("autopilot", "done"):
            with self.subTest(step=old_step):
                legacy = copy.deepcopy(self.run)
                legacy["step"] = old_step
                legacy["campaign"].update({"mode": "demo", "connected": True, "status": "active", "budget_usd": 41, "account": {"id": "adacct_demo"}, "external_ids": {"ad_id": "fake"}, "insights": {"clicks": 99}, "note": "Mock", "review_status": "approved"})
                store.save(legacy)
                run = store.get(legacy["id"])
                self.assertEqual((run["step"], run["campaign"]["status"], run["campaign"]["mode"]), ("ads", "draft", "unconnected"))
                self.assertFalse(run["campaign"]["connected"])
                self.assertEqual(run["campaign"]["external_ids"], {})
                for field in ("account", "insights", "note", "review_status"):
                    self.assertIsNone(run["campaign"][field])
                self.assertEqual(run["campaign"]["budget_usd"], 41)
                self.assertEqual(run["creative"], self.run["creative"])
                self.assertEqual(json.loads(store._path(run["id"]).read_text())["campaign"]["mode"], "unconnected")

    def test_live_campaign_is_not_normalized(self):
        self.run["campaign"].update({"mode": "live", "status": "active", "external_ids": {"ad_id": "real"}, "insights": {"clicks": 42}})
        self.run["step"] = "autopilot"
        store.save(self.run)
        result = store.get(self.run["id"])
        self.assertEqual(result["campaign"], self.run["campaign"])
        self.assertEqual(result["step"], "autopilot")

    async def test_export_reports_actual_mode_and_status(self):
        self.run["campaign"].update({"mode": "live", "status": "under_review"})
        store.save(self.run)
        exported = await api.export_run(self.run["id"])
        self.assertEqual(exported["mode"], "live")
        self.assertEqual(exported["label"], "Campaign export · under review")

    async def test_missing_github_oauth_records_error_and_never_connects(self):
        with patch.object(api.github_oauth, "configured", return_value=False):
            response = await api.github_login(self.run["id"])
        self.assertEqual(response.status_code, 307)
        self.assertIn(self.run["id"], response.headers["location"])
        tracking = store.get(self.run["id"])["tracking"]
        self.assertEqual(tracking["status"], "error")
        self.assertIsNone(tracking["login"])
        self.assertEqual(tracking["repos"], [])
        self.assertIsNone(tracking["pr_url"])
        self.assertIn("not configured", tracking["error"])
        self.assertEqual(self.requests, [])

    async def test_configured_github_uses_oauth_redirect_even_with_mock_research(self):
        with patch.object(api.github_oauth, "configured", return_value=True):
            response = await api.github_login(self.run["id"])
        self.assertTrue(response.headers["location"].startswith("https://github.com/login/oauth/authorize?"))
        self.assertEqual(store.get(self.run["id"])["tracking"]["status"], "idle")

    async def test_tracking_requires_saved_github_token_even_with_mock_research(self):
        self.run["tracking"].update({"status": "connected", "login": "some-user"})
        store.save(self.run)
        tasks = BackgroundTasks()
        with self.assertRaises(HTTPException) as raised:
            await api.start_tracking(self.run["id"], api.TrackingIn(repo="example/site"), tasks)
        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(tasks.tasks, [])
        await api._instrument(self.run["id"], "example/site", "main")
        tracking = store.get(self.run["id"])["tracking"]
        self.assertEqual(tracking["status"], "error")
        self.assertIsNone(tracking["pr_url"])
        self.assertEqual(self.requests, [])

    def test_legacy_tracking_is_reset_independently_of_live_campaign(self):
        for tracking in (
            {"login": "astra-demo", "status": "connected", "repos": [{"full_name": "example/site"}]},
            {"login": "old-user", "status": "pr_ready", "pr_url": "https://github.com/example/site/pull/12", "note": "Mock. GPT6 Astra opened a demo pull request."},
        ):
            with self.subTest(tracking=tracking):
                self.run["campaign"]["mode"] = "live"
                self.run["tracking"] = tracking
                store.save(self.run)
                result = store.get(self.run["id"])
                self.assertEqual(result["campaign"]["mode"], "live")
                self.assertEqual(result["tracking"]["status"], "error")
                self.assertEqual(result["tracking"]["repos"], [])
                self.assertIsNone(result["tracking"]["repo"])
                self.assertIsNone(result["tracking"]["pr_url"])
                self.assertIsNone(result["tracking"]["login"])

    def test_tracking_never_fabricates_a_pull_request_url(self):
        for url in (None, "", "https://github.com/example/site", "https://example.com/example/site/pull/12"):
            with self.subTest(url=url), self.assertRaises(RuntimeError):
                tracking.apply_tracking(self.run, repo="example/site", pr_url=url)
        self.assertEqual(self.run["tracking"]["status"], "idle")
        self.assertIsNone(self.run["tracking"]["pr_url"])
        tracking.apply_tracking(self.run, repo="example/site", pr_url="https://github.com/example/site/pull/42")
        self.assertEqual(self.run["tracking"]["status"], "pr_ready")
        self.assertEqual(self.run["tracking"]["pr_url"], "https://github.com/example/site/pull/42")

    async def test_instrument_missing_pull_request_url_is_a_failure(self):
        with patch.object(codex, "cursor_ready", return_value=False), patch.object(codex, "token_for", return_value="test-github-token"), patch.object(codex, "open_pixel_pr", AsyncMock(return_value="")):
            with self.assertRaises(RuntimeError):
                await codex.instrument(self.run, "example/site", "main")
        self.assertNotEqual(self.run["tracking"]["status"], "pr_ready")
        self.assertIsNone(self.run["tracking"]["pr_url"])
        self.assertEqual(self.requests, [])

    def test_active_requires_explicit_approval(self):
        self.assertEqual(openai_ads.map_status("active", "approved"), "active")
        for review in (None, "", "unknown", "unexpected"):
            with self.subTest(review=review):
                self.assertEqual(openai_ads.map_status("active", review), "submitted")
        for review in ("pending", "in_review", "under_review", "pending_review"):
            with self.subTest(review=review):
                self.assertEqual(openai_ads.map_status("active", review), "under_review")
        self.assertEqual(openai_ads.map_status("paused", "approved"), "submitted")
        self.assertEqual(openai_ads.map_status("active", "rejected"), "failed")


if __name__ == "__main__":
    unittest.main()
