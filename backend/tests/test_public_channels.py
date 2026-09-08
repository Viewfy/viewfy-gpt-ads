from copy import deepcopy
from datetime import date
from urllib.parse import urlparse

from public_channels import hydrate_public_channels


def test_superagent_channels_have_source_links_and_publication_dates():
    run = hydrate_public_channels({"domain": "https://www.getsuperagent.com/"})
    snapshot = run["public_channels"]
    assert snapshot["domain"] == "getsuperagent.com"
    assert snapshot["source"] == "public_snapshot"
    blog = next(c for c in snapshot["channels"] if c["id"] == "blog")
    assert len(blog["items"]) >= 10
    assert blog["kind"] == "owned"
    ids = set()
    for channel in snapshot["channels"]:
        assert urlparse(channel["url"]).scheme == "https"
        assert "ads" not in channel
        for item in channel["items"]:
            assert item["id"] not in ids
            ids.add(item["id"])
            assert item["title"] and item["summary"]
            assert urlparse(item["url"]).scheme == "https"
            assert date.fromisoformat(item["observed_at"]) <= date.fromisoformat(snapshot["observed_at"])
            if item.get("published_at"):
                assert date.fromisoformat(item["published_at"]) <= date.fromisoformat(item["observed_at"])
            assert all(metric not in item for metric in ("spend", "impressions", "ctr", "conversions"))
    assert all(urlparse(item["url"]).hostname == "news.getsuperagent.com" for item in blog["items"])


def test_other_businesses_do_not_receive_superagent_channels():
    for domain in ("example.com", "superagent.com", "fake.getsuperagent.com", "getsuperagent.com.evil.example"):
        run = {"domain": domain}
        assert hydrate_public_channels(run) == {"domain": domain}


def test_enrichment_preserves_paid_research_campaign_and_edited_creative():
    run = {
        "domain": "getsuperagent.com", "step": "launch", "status": "ready",
        "ads": {"source": "live", "subjects": [{"meta": {"ads": [{"id": "saved-ad"}]}}]},
        "campaign": {"status": "draft", "budget_usd": 53},
        "creative": {"id": "edited", "title": "User's selected headline"},
        "public_channels": {"domain": "getsuperagent.com", "source": "public_snapshot", "version": "old", "channels": []},
    }
    original = deepcopy(run)
    hydrate_public_channels(run)
    assert run["public_channels"]["channels"]
    for key in ("ads", "campaign", "creative", "step", "status"):
        assert run[key] == original[key]


def test_user_supplied_channel_evidence_is_preserved():
    custom = {"domain": "getsuperagent.com", "source": "live", "channels": []}
    run = {"domain": "getsuperagent.com", "public_channels": deepcopy(custom)}
    hydrate_public_channels(run)
    assert run["public_channels"] == custom
