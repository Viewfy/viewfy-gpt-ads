from openai_ads import budget_micros, context_hints, map_status


def test_budget_floor():
    assert budget_micros(0) == 1_000_000
    assert budget_micros(25) == 25_000_000


def test_map_status():
    assert map_status("active", "in_review") == "under_review"
    assert map_status("active", "approved") == "active"
    assert map_status("paused", None) == "submitted"
    assert map_status("active", "rejected") == "failed"


def test_context_hints_from_brand():
    hints = context_hints({"brand": {"name": "SUPERAGENT", "category": "AI SDR", "one_liner": "Answer missed calls"}})
    assert "AI SDR" in hints
    assert hints[0]
