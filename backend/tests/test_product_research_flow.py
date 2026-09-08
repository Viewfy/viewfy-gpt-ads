import asyncio
from copy import deepcopy
from unittest.mock import AsyncMock

import pytest
from fastapi import BackgroundTasks

import app
import store


@pytest.fixture
def saved_map_environment(monkeypatch, tmp_path):
    monkeypatch.setattr(store, 'DATA_DIR', tmp_path)
    monkeypatch.setattr(app, 'MOCK', False)
    forbidden = []
    for name in ('crawl_domain', 'build_map'):
        call = AsyncMock(side_effect=AssertionError(f'{name} must not run for saved data'))
        monkeypatch.setattr(app, name, call)
        forbidden.append(call)
    sleep = AsyncMock(side_effect=AssertionError('Saved data must not wait'))
    monkeypatch.setattr(app.asyncio, 'sleep', sleep)
    forbidden.append(sleep)
    yield
    for call in forbidden:
        call.assert_not_called()


@pytest.mark.parametrize(('domain', 'fixture', 'mock'), [
    ('getsuperagent.com', False, False),
    ('example.com', True, False),
    ('example.com', False, True),
])
def test_saved_map_creation_is_ready_without_background_work(saved_map_environment, monkeypatch, domain, fixture, mock):
    monkeypatch.setattr(app, 'MOCK', mock)
    tasks = BackgroundTasks()
    result = asyncio.run(app.create_run(app.DomainIn(domain=domain, fixture=fixture), tasks))
    assert result['domain'] == domain
    assert result['source'] == 'fixture'
    assert (result['step'], result['status']) == ('confirmation', 'ready')
    assert result['map']['nodes']
    assert all(page['status'] != 'crawling' for page in result['pages'])
    assert not tasks.tasks
    assert store.get(result['id']) == result
    if domain == 'getsuperagent.com':
        assert result['public_channels']['channels']


def test_unknown_live_site_still_queues_research(saved_map_environment):
    tasks = BackgroundTasks()
    result = asyncio.run(app.create_run(app.DomainIn(domain='example.com'), tasks))
    assert result['source'] == 'live'
    assert (result['step'], result['status']) == ('understanding', 'crawling')
    assert not result['map']['nodes']
    assert len(tasks.tasks) == 1
    assert tasks.tasks[0].func is app._understand
    assert tasks.tasks[0].args == (result['id'], False)


@pytest.mark.parametrize(('domain', 'fixture', 'mock'), [
    ('getsuperagent.com', False, False),
    ('example.com', True, False),
    ('example.com', False, True),
])
def test_queued_saved_map_initialization_has_no_crawl_or_delay(saved_map_environment, monkeypatch, domain, fixture, mock):
    monkeypatch.setattr(app, 'MOCK', mock)
    run = store.new_run(domain)
    saved = []
    monkeypatch.setattr(app, 'save', lambda data: saved.append(deepcopy(data)) or store.save(data))
    asyncio.run(app._understand(run['id'], fixture))
    assert len(saved) == 1
    assert (saved[0]['step'], saved[0]['status']) == ('confirmation', 'ready')
    assert saved[0]['map']['nodes']
    assert all(page['status'] != 'crawling' for page in saved[0]['pages'])


@pytest.mark.parametrize('creative', [None, {'id': 'edited', 'title': 'Keep my headline'}])
def test_read_recovers_empty_superagent_map_and_preserves_draft(saved_map_environment, creative):
    run = store.new_run('getsuperagent.com')
    run['creative'] = deepcopy(creative)
    run['campaign'].update({
        'budget_usd': 73, 'geo': ['CA'], 'status': 'failed',
        'account': {'id': 'account_1'}, 'external_ids': {'campaign_id': 'campaign_1'},
        'error': 'Preserve submission error',
    })
    store.save(run)
    campaign = deepcopy(run['campaign'])
    result = asyncio.run(app.read_run(run['id']))
    assert (result['step'], result['status']) == ('confirmation', 'ready')
    assert result['map']['nodes']
    assert result['public_channels']['channels']
    assert result['creative'] == creative
    assert result['campaign'] == campaign
    assert store.get(run['id']) == result


@pytest.mark.parametrize(('step', 'status', 'nodes', 'confirmed_at'), [
    ('understanding', 'crawling', [{'id': 'custom', 'branch': 'value', 'text': 'My own map'}], None),
    ('confirmation', 'ready', [{'id': 'custom', 'branch': 'value', 'text': 'My own map'}], None),
    ('autopilot', 'ready', [], '2026-09-08T10:00:00Z'),
    ('understanding', 'crawling', [], '2026-09-08T10:00:00Z'),
])
def test_read_does_not_reinitialize_custom_or_completed_runs(saved_map_environment, monkeypatch, step, status, nodes, confirmed_at):
    run = store.new_run('getsuperagent.com')
    run.update({'step': step, 'status': status, 'confirmed_at': confirmed_at})
    run['map'] = {'nodes': nodes, 'missing': ['Keep my question']}
    run['creative'] = {'id': 'edited', 'title': 'Keep my creative'}
    store.save(run)
    before = deepcopy(run)
    monkeypatch.setattr(app, 'apply_crawl', lambda _: pytest.fail('Existing work must not be reinitialized'))
    result = asyncio.run(app.read_run(run['id']))
    for key in ('step', 'status', 'brand', 'map', 'campaign', 'creative', 'confirmed_at'):
        assert result[key] == before[key]
    assert store.get(run['id']) == before


def test_stale_queued_work_cannot_overwrite_an_initialized_map(saved_map_environment, monkeypatch):
    result = asyncio.run(app.create_run(app.DomainIn(domain='getsuperagent.com'), BackgroundTasks()))
    result['map']['nodes'][0]['text'] = 'My edited map'
    store.save(result)
    before = deepcopy(result)
    monkeypatch.setattr(app, 'apply_crawl', lambda _: pytest.fail('A queued task must not replace initialized data'))
    asyncio.run(app._understand(result['id'], True))
    assert store.get(result['id']) == before


def test_reconfirm_keeps_evidence_visible_but_clears_old_campaign_directions(monkeypatch):
    run = {
        'id': 'run', 'domain': 'example.com', 'updated_at': '2026-09-08',
        'brand': {'name': 'Example'}, 'map': {'nodes': [], 'missing': []},
        'ads': {'status': 'ready', 'subjects': [{'name': 'Saved competitor'}]},
        'concepts': [{'id': 'old-direction'}], 'selected_concept_id': 'old-direction',
        'error': 'Previous research failed',
    }
    monkeypatch.setattr(app, '_need', lambda _: run)
    monkeypatch.setattr(app, 'save', lambda data: data)
    monkeypatch.setattr(app, 'snapshot_brief', lambda _: {'name': 'Example', 'nodes': []})
    tasks = BackgroundTasks()
    result = asyncio.run(app.confirm('run', app.ConfirmIn(competitor_ids=[]), tasks))
    assert result['ads']['subjects'] == [{'name': 'Saved competitor'}]
    assert result['ads']['status'] == 'running'
    assert result['concepts'] == []
    assert result['selected_concept_id'] is None
    assert result['error'] is None
    assert result['status'] == 'researching'
    assert len(tasks.tasks) == 1


def test_research_remains_pollable_until_concepts_are_ready(monkeypatch):
    run = {'id': 'run', 'domain': 'example.com', 'source': 'live', 'brief': {'nodes': []}, 'concepts': []}
    saved = []
    monkeypatch.setattr(app, 'MOCK', False)
    monkeypatch.setattr(app, 'get', lambda _: run)
    monkeypatch.setattr(app, 'save', lambda data: saved.append(deepcopy(data)) or data)
    monkeypatch.setattr(app, 'research_ads', AsyncMock(return_value={'status': 'ready', 'subjects': []}))

    async def insights(*_):
        assert run['status'] == 'writing'
        assert not run['concepts']
        return {'insights': [{'title': 'A finding'}], 'concepts': [{'id': 'new-direction'}]}

    monkeypatch.setattr(app, 'build_insights', insights)
    asyncio.run(app._research('run'))
    assert [data['status'] for data in saved] == ['writing', 'ready']
    assert saved[-1]['concepts'] == [{'id': 'new-direction'}]
