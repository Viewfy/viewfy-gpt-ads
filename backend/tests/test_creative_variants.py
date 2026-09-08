"""Artwork choices preserve the two ad drafts and never submit a campaign."""
import asyncio
from copy import deepcopy

import pytest

import app
import store
from fixtures import apply_crawl, hydrate_ads


@pytest.mark.parametrize(('creative_id', 'variant'), [
    ('sa-1', 'a1'), ('sa-1', 'a2'), ('sa-1', 'a3'),
    ('sa-2', 'b1'), ('sa-2', 'b2'), ('sa-2', 'b3'),
])
def test_choosing_artwork_preserves_copy_other_ad_and_campaign(monkeypatch, tmp_path, creative_id, variant):
    monkeypatch.setattr(store, 'DATA_DIR', tmp_path)
    run = store.new_run('getsuperagent.com')
    apply_crawl(run)
    hydrate_ads(run)
    run.update({'step': 'creatives', 'status': 'ready'})
    run['creatives'][0]['title'] = 'My edited lead headline'
    run['creatives'][1]['body'] = 'My edited handoff copy.'
    run['campaign'].update({'budget_usd': 73, 'geo': ['CA']})
    store.save(run)
    before = deepcopy(run)

    chosen_image = f'/demo-ads/variants/{variant}.png'
    result = asyncio.run(app.patch_creative(run['id'], app.CreativeIn(id=creative_id, image_url=chosen_image)))

    assert len(result['creatives']) == 2
    for original, updated in zip(before['creatives'], result['creatives']):
        expected = {**original, 'image_url': chosen_image} if original['id'] == creative_id else original
        assert updated == expected
    selected = next(item for item in result['creatives'] if item['id'] == creative_id)
    assert result['creative'] == selected
    assert result['selected_concept_id'] == selected['concept_id']
    assert result['campaign'] == before['campaign']
    assert (result['step'], result['status']) == ('creatives', 'ready')
    assert store.get(run['id']) == result
