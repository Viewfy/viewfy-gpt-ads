"""Build the reviewed Superagent public-channel snapshot without network calls."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
OBSERVED = "2026-09-08"


def checked_url(value: str) -> None:
    url = urlparse(value)
    assert url.scheme == "https" and url.hostname and not url.username and not url.password, value


def main() -> None:
    channels = []
    channel_ids = set()
    item_ids = set()
    for name in ("superagent-blog-channels.json", "superagent-other-channels.json"):
        source = json.loads((ROOT / "docs" / "research" / name).read_text())
        assert source["domain"] == "getsuperagent.com"
        for channel in source["channels"]:
            assert channel["id"] not in channel_ids, channel["id"]
            channel_ids.add(channel["id"])
            assert channel["kind"] in {"owned", "social", "earned"}
            checked_url(channel["url"])
            assert channel["description"].strip() and channel["items"]
            for item in channel["items"]:
                assert item["id"] not in item_ids, item["id"]
                item_ids.add(item["id"])
                assert item["kind"] in {"article", "post", "video", "page", "press", "profile", "event"}
                assert item["title"].strip() and item["summary"].strip()
                checked_url(item["url"])
                observed = date.fromisoformat(item["observed_at"])
                assert observed <= date.fromisoformat(OBSERVED)
                if item.get("published_at"):
                    assert date.fromisoformat(item["published_at"]) <= observed
                assert not any(k in item for k in ("spend", "impressions", "ctr", "conversions"))
            channels.append(channel)
    output = {
        "domain": "getsuperagent.com", "source": "public_snapshot",
        "version": "2026-09-08.1", "observed_at": OBSERVED,
        "channels": channels,
    }
    (ROOT / "fixtures" / "superagent" / "channels.json").write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print(f"Saved {len(channels)} public channels with {len(item_ids)} source records.")


if __name__ == "__main__":
    main()
