import asyncio
import json
from datetime import date

import insights


TODAY = date(2026, 9, 8)
BRIEF = {
    "name": "Example",
    "nodes": [
        {"branch": "customers", "text": "agency owners"},
        {"branch": "offers", "text": "Answer incoming calls"},
        {"branch": "differentiators", "text": "Connect to the existing CRM"},
    ],
}


def subject(ads=None, *, kind="competitor", name="Competitor", status="ok"):
    return {
        "kind": kind, "name": name, "domain": f"{name.lower()}.example",
        "meta": {"status": status, "ads": ads or [], "source_url": f"https://ads.example/{name.lower()}"},
        "google": {"status": "unknown", "ads": []},
    }


def ad(id="1", headline="Answer every call", **extra):
    return {"id": id, "headline": headline, "source_url": f"https://ads.example/creative/{id}", **extra}


def signal_insights(pack, signal):
    return [item for item in pack["insights"] if signal in item["signals"]]


def test_missing_and_error_libraries_do_not_establish_absence():
    pack = insights.heuristic_pack(BRIEF, [subject(status="error")], today=TODAY)
    assert "0 distinct competitor ad records" in pack["insights"][0]["observation"]
    assert "do not establish" in pack["insights"][0]["limitation"]
    assert pack["insights"][0]["evidence"][0]["url"] == "https://ads.example/competitor"
    assert all(not item["signals"] for item in pack["insights"])
    assert all("gap" not in item["title"].lower() for item in pack["insights"])
    why = " ".join(item["why"] for item in pack["concepts"])
    assert "Competitor ads do not" not in why
    assert "softer slogans" not in why


def test_single_headline_is_not_repetition():
    pack = insights.heuristic_pack(BRIEF, [subject([ad()])], today=TODAY)
    assert not signal_insights(pack, "repetition")
    assert "1 distinct competitor ad records" in pack["insights"][0]["observation"]


def test_duplicate_record_does_not_count_as_two_ads():
    pack = insights.heuristic_pack(BRIEF, [subject([ad(), ad()])], today=TODAY)
    assert not signal_insights(pack, "repetition")
    assert "1 distinct competitor ad records" in pack["insights"][0]["observation"]


def test_exact_repetition_requires_distinct_records_and_includes_sources():
    pack = insights.heuristic_pack(BRIEF, [subject([ad("1"), ad("2", "  ANSWER   EVERY CALL ")])], today=TODAY)
    repeated = signal_insights(pack, "repetition")
    assert len(repeated) == 1
    assert "2 distinct ad records" in repeated[0]["observation"]
    assert {item["url"] for item in repeated[0]["evidence"]} == {"https://ads.example/creative/1", "https://ads.example/creative/2"}


def test_old_inactive_unknown_future_and_recent_records_are_not_longevity():
    ads = [
        ad("inactive", started_at="2020-01-01", is_active=False),
        ad("unknown", started_at="2020-01-01", is_active=None, last_shown_at="2026-09-07"),
        ad("recent", started_at="2026-09-01", is_active=True),
        ad("future", started_at="2027-01-01", is_active=True),
        ad("invalid", started_at="not-a-date", is_active=True),
        ad("ended", started_at="2020-01-01", ended_at="2026-08-01", is_active=True),
    ]
    pack = insights.heuristic_pack(BRIEF, [subject(ads)], today=TODAY)
    assert not signal_insights(pack, "longevity")
    assert "1 records have unknown current activity; 1 have no valid first-seen date" in pack["insights"][0]["observation"]


def test_thirty_day_active_boundary_supports_longevity():
    pack = insights.heuristic_pack(BRIEF, [subject([ad(started_at="2026-08-09", is_active=True)])], today=TODAY)
    longevity = signal_insights(pack, "longevity")
    assert len(longevity) == 1
    assert "1 competitor records" in longevity[0]["observation"]
    assert longevity[0]["evidence"][0]["url"].endswith("/1")


def test_self_and_website_records_cannot_support_competitor_patterns():
    own = subject([ad("own-1", is_active=True, started_at="2020-01-01"), ad("own-2")], kind="self", name="Example")
    competitor = subject([ad("site", evidence_type="website", is_active=True, started_at="2020-01-01"), ad("paid")])
    pack = insights.heuristic_pack(BRIEF, [own, competitor], today=TODAY)
    assert "1 distinct competitor ad records across 1 of 1" in pack["insights"][0]["observation"]
    assert not signal_insights(pack, "repetition")
    assert not signal_insights(pack, "longevity")
    assert all("own-" not in json.dumps(item["evidence"]) for item in pack["insights"])


def test_llm_input_preserves_sources_activity_and_website_provenance():
    competitor = subject([ad(is_active=None, started_at="2020-01-01", last_shown_at="2026-09-07")])
    competitor["profile"] = {"positioning": "AI receptionist", "source_ids": ["website"]}
    competitor["sources"] = [{"id": "website", "kind": "website", "url": "https://competitor.example", "summary": "The company describes an AI receptionist."}]
    competitor["ad_checks"] = [{"platform": "Google", "status": "blocked", "note": "Login required"}]
    payload = json.loads(insights._ad_lines([competitor]))
    assert payload["subjects"][0]["profile_website_claims"]["positioning"] == "AI receptionist"
    assert payload["subjects"][0]["sources"][0]["kind"] == "website"
    assert payload["subjects"][0]["ads"][0]["is_active"] is None
    assert payload["subjects"][0]["ad_checks"][0]["status"] == "blocked"
    assert not payload["computed_competitor_signals"]["active_at_least_30_days_ad_ids"]


def test_unverified_third_party_ads_are_context_not_brand_patterns():
    competitor = subject([
        ad("third-party-1", advertiser_relationship="unverified_third_party", is_active=True, started_at="2020-01-01"),
        ad("third-party-2", advertiser_relationship="unverified_third_party", is_active=True, started_at="2020-01-01"),
        ad("brand", advertiser_relationship="brand_matched"),
    ])
    pack = insights.heuristic_pack(BRIEF, [competitor], today=TODAY)
    assert "1 distinct competitor ad records" in pack["insights"][0]["observation"]
    assert not signal_insights(pack, "repetition")
    assert not signal_insights(pack, "longevity")
    assert all("third-party" not in json.dumps(item["evidence"]) for item in pack["insights"])
    payload = json.loads(insights._ad_lines([competitor]))
    assert payload["computed_competitor_signals"]["ad_count"] == 1
    assert len(payload["subjects"][0]["ads"]) == 3
    assert payload["subjects"][0]["ads"][0]["advertiser_relationship"] == "unverified_third_party"


def test_llm_cannot_add_an_unsupported_signal_or_source(monkeypatch):
    fallback = insights.heuristic_pack(BRIEF, [subject([ad()])])

    async def fake_chat(_prompt):
        return {"concepts": fallback["concepts"], "insights": [
            {"title": "Repeating", "observation": "A repeating hook", "signals": ["repetition"], "evidence": [{"url": "https://ads.example/creative/1", "title": "Real source"}]},
            {"title": "Invented", "observation": "Invented evidence", "signals": [], "evidence": [{"url": "https://invented.example", "title": "Invented"}]},
        ]}

    monkeypatch.setattr(insights, "OPENAI_API_KEY", "test")
    monkeypatch.setattr(insights, "_chat_json", fake_chat)
    result = asyncio.run(insights.build_insights(BRIEF, [subject([ad()])]))
    assert result["insights"] == fallback["insights"]
