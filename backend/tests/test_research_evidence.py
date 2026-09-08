from copy import deepcopy
from datetime import datetime

from fixtures import apply_ads, apply_insights, hydrate_ads, load_library, load_pack
from google_ads import _parse
from meta_library import keep_ad, parse_kept


def demo_run(nodes=None):
    pack = load_pack()
    nodes = deepcopy(pack['nodes'] if nodes is None else nodes)
    return {'domain': 'getsuperagent.com', 'source': 'fixture', 'map': {'nodes': nodes},
            'brief': {'nodes': deepcopy(nodes)}, 'brief_version': 'old', 'status': 'ready',
            'step': 'launch', 'ads': {'source': 'fixture', 'subjects': [{'name': 'Old mock'}]},
            'creative': {'id': 'custom', 'title': 'User edit'}, 'creatives': [{'id': 'custom', 'title': 'User edit'}]}


def test_snapshot_has_complete_brand_coverage_and_resolvable_evidence():
    lib = load_library()
    assert len(lib['subjects']) == 12
    assert {s['domain'] for s in lib['subjects'] if s['kind']=='competitor'} == {n['domain'] for n in load_pack()['nodes'] if n['branch']=='competitors'}
    ids = set()
    source_ids = {x['id'] for s in lib['subjects'] for x in s['sources']}
    for s in lib['subjects']:
        ads = s['meta']['ads'] + s['google']['ads'] + s.get('other_ads', [])
        assert ads, s['domain']
        assert s['profile']['source_ids']
        for a in ads:
            assert (a['platform'], a['id']) not in ids
            ids.add((a['platform'], a['id']))
            assert a['source_id'] in source_ids
            assert a.get('evidence_type') and a['source_url'].startswith('https://')
            assert not (a.get('is_active') is True and a.get('ended_at'))
            assert '{{product.' not in (a.get('headline') or '') + (a.get('body') or '')
            for key in ['spend', 'ctr', 'conversions', 'impressions']:
                assert a.get(key) is None
            for key in ['started_at', 'ended_at', 'last_shown_at']:
                if a.get(key):
                    assert datetime.fromisoformat(a[key].replace('Z', '+00:00')).date() <= datetime.fromisoformat(lib['researched_at']).date()
    assert len(ids) == lib['analysis_stats']['ad_records']
    for insight in load_pack()['insights']:
        assert insight['evidence']
        assert all(e['source_id'] in source_ids for e in insight['evidence'])


def test_cached_research_honors_selection_and_ruby_redirect():
    run = demo_run([{'id':'ruby','branch':'competitors','domain':'callruby.com','text':'Ruby'}])
    apply_ads(run)
    assert {s['domain'] for s in run['ads']['subjects']} == {'getsuperagent.com', 'ruby.com'}
    assert run['ads']['analysis_stats']['by_platform'] == {'google': 6}
    assert run['ads']['analysis_stats']['brand_matched_meta_records'] == 0
    assert run['ads']['analysis_stats']['meta_unique_copy_fingerprints'] == 0
    apply_insights(run)
    assert all(e['subject'] in {'SUPERAGENT','Ruby'} for i in run['insights'] for e in i['evidence'])


def test_hydration_migrates_default_demo_without_overwriting_creatives_or_step():
    nodes = [n for n in load_pack()['nodes'] if n.get('domain') != 'sonant.ai']
    run = demo_run(nodes)
    hydrate_ads(run)
    assert run['ads']['research_version'] == load_library()['research_version']
    assert any(s['domain']=='sonant.ai' for s in run['ads']['subjects'])
    assert run['creative'] == {'id':'custom','title':'User edit'}
    assert run['step']=='launch'
    assert run['insights']


def test_hydration_keeps_live_research_and_custom_competitor_selection():
    run = demo_run([{'id':'sonant','branch':'competitors','domain':'sonant.ai','text':'Sonant'}])
    hydrate_ads(run)
    assert {s['domain'] for s in run['ads']['subjects']} == {'getsuperagent.com','sonant.ai'}
    run['source']='live'
    run['ads']={'source':'live','subjects':[{'domain':'example.com'}]}
    hydrate_ads(run)
    assert run['ads']=={'source':'live','subjects':[{'domain':'example.com'}]}


def test_dynamic_meta_card_copy_media_and_active_dates():
    raw = {'adArchiveID':'123','isActive':True,'startDate':1788220800,'endDateFormatted':'2026-09-08',
           'snapshot':{'title':'{{product.name}}','body':{'text':'{{product.brand}}'},
                       'cards':[{'title':'A real heading','body':'A real body','linkUrl':'https://sonant.ai/',
                                 'originalImageUrl':'https://example.com/image.jpg','videoHdUrl':'https://example.com/creative.mp4'}]}}
    a = parse_kept(raw)
    assert a.headline=='A real heading' and a.body=='A real body'
    assert a.image_url.endswith('image.jpg') and a.video_url.endswith('creative.mp4')
    assert a.started_at.startswith('2026-09-01')
    assert a.ended_at is None and a.last_shown_at=='2026-09-08'
    assert keep_ad(raw, 'sonant.ai')


def test_brand_mention_in_an_unrelated_ad_is_not_a_match():
    raw={'snapshot':{'body':{'text':'I resell synthflow.ai agents'},'linkUrl':'https://instagram.com/someagency'}}
    assert not keep_ad(raw,'synthflow.ai')
    a=parse_kept({'adArchiveID':'123','snapshot':{'title':'Unknown status'}})
    assert a.is_active is None


def test_google_last_shown_is_not_end_or_active_status():
    a=_parse({'creativeId':'123','headline':'A real ad','lastShown':'2026-09-08'}, 'https://example.com')
    assert a['last_shown_at']=='2026-09-08'
    assert a['is_active'] is None and a['ended_at'] is None and a['status']=='unknown'
