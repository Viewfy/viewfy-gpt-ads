import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

// Exercise the TypeScript helper without adding a test framework to the app.
const output = mkdtempSync(join(tmpdir(), 'viewfy-mindmap-test-'))
after(() => rmSync(output, { recursive: true, force: true }))
const libOutput = join(output, 'frontend/src/lib')
mkdirSync(libOutput, { recursive: true })
mkdirSync(join(output, 'fixtures/superagent'), { recursive: true })
writeFileSync(join(output, 'fixtures/superagent/library.json'), readFileSync(new URL('../../fixtures/superagent/library.json', import.meta.url)))
writeFileSync(join(output, 'fixtures/superagent/channels.json'), readFileSync(new URL('../../fixtures/superagent/channels.json', import.meta.url)))
writeFileSync(join(output, 'fixtures/superagent/ai-answers.json'), readFileSync(new URL('../../fixtures/superagent/ai-answers.json', import.meta.url)))
for (const name of ['market', 'mindmap-data']) {
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
  writeFileSync(join(libOutput, `${name}.js`), ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText)
}
const { getMapCompetitors, getCompetitorChannels, getSelfChannels, safeExternalUrl } = createRequire(import.meta.url)(join(libOutput, 'mindmap-data.js'))
const { COMPETITORS, PROMPTS } = createRequire(import.meta.url)(join(libOutput, 'market.js'))
const smith = COMPETITORS.find((competitor) => competitor.id === 'smith')
const ad = { id: 'real-ad', platform: 'meta', headline: 'Saved creative' }
const side = (status = 'ok', ads = []) => ({ platform: 'meta', status, ads })
const subject = (extra = {}) => ({ kind: 'competitor', name: 'Smith.ai', domain: 'smith.ai', meta: side('ok', [ad]), google: side('empty'), ...extra })
const run = (subjects = [], extra = {}) => ({ source: 'live', ads: { status: 'ready', subjects }, ...extra })
const node = (id, text, domain) => ({ id, text, domain, branch: 'competitors', source_url: '', provenance: 'confirmed' })
const publicItem = (extra = {}) => ({ id: 'company-update', kind: 'article', title: 'Company update', summary: 'An update published by the company.', url: 'https://your-company.example/news/update', observed_at: '2026-09-08', ...extra })
const publicChannel = (items = [publicItem()], extra = {}) => ({ id: 'news', label: 'Company news', icon: 'pen', kind: 'owned', url: 'https://your-company.example/news', description: 'Company news and articles.', items, ...extra })
const publicSnapshot = (channels = [publicChannel()], domain = 'your-company.example') => ({ domain, source: 'public_snapshot', observed_at: '2026-09-08', channels })

test('AI answer prompts load the captured snapshot used by the map', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../../fixtures/superagent/ai-answers.json', import.meta.url), 'utf8'))
  assert.deepEqual(PROMPTS, snapshot.prompts)
  assert.equal(PROMPTS.flatMap(prompt => prompt.results).length, 9)
})

test('mixed known and custom competitors retain their exact map IDs', () => {
  const competitors = getMapCompetitors([
    node('approved-smith', 'Smith.ai', 'https://WWW.SMITH.AI/'),
    node('custom-1', 'New business', 'new-business.example'),
  ], 'getsuperagent.com')
  assert.deepEqual(competitors.map(({ id }) => id), ['approved-smith', 'custom-1'])
  assert.equal(competitors[0].domain, 'smith.ai')
  assert.ok(competitors[0].channels.includes('meta'))
  assert.equal(competitors[1].name, 'New business')
  assert.deepEqual(competitors[1].channels, [])
})

test('an explicit different domain overrides a familiar competitor name and ID', () => {
  const [competitor] = getMapCompetitors([node('smith', 'Smith.ai', 'different.example')], 'example.com')
  assert.equal(competitor.domain, 'different.example')
  assert.deepEqual(competitor.channels, [])
  assert.equal(getCompetitorChannels(run([subject()]), competitor)[0].status, 'unresearched')
})

test('an empty map does not silently repopulate competitors', () => {
  assert.deepEqual(getMapCompetitors([], 'other-business.example'), [])
  assert.equal(getMapCompetitors([], 'https://www.getsuperagent.com/').length, 0)
})

test('domain matching handles case, www and URL paths and preserves real ad records', () => {
  const channels = getCompetitorChannels(run([subject({ name: 'Different display name', domain: 'https://WWW.SMITH.AI/path' })]), smith)
  assert.equal(channels[0].status, 'ready')
  assert.equal(channels[0].ads[0], ad)
  assert.equal(channels[0].evidence, 'research')
  assert.equal(channels[1].status, 'empty')
})

test('name fallback is allowed only without conflicting domains or ambiguity', () => {
  const nameOnly = { ...smith, domain: '' }
  assert.equal(getCompetitorChannels(run([subject({ name: '  SMITH.AI  ' })]), nameOnly)[0].status, 'ready')
  assert.equal(getCompetitorChannels(run([subject(), subject({ domain: 'other.example' })]), nameOnly)[0].status, 'unresearched')
  assert.equal(getCompetitorChannels(run([subject({ kind: 'self' })]), smith)[0].status, 'unresearched')
})

test('empty, unavailable and missing research remain distinct and never receive invented ads', () => {
  assert.equal(getCompetitorChannels(run([subject({ meta: side('ok') })]), smith)[0].status, 'empty')
  assert.equal(getCompetitorChannels(run([subject({ meta: side('error') })]), smith)[0].status, 'unavailable')
  const missing = getCompetitorChannels(run(), smith)[0]
  assert.equal(missing.status, 'unresearched')
  assert.deepEqual(missing.ads, [])
  const failed = getCompetitorChannels(run([], { ads: { status: 'error', subjects: [] } }), smith)[0]
  assert.equal(failed.status, 'unavailable')
})

test('saved creatives survive a failed source refresh with a clear explanation', () => {
  const channel = getCompetitorChannels(run([subject({ meta: side('error', [ad]) })]), smith)[0]
  assert.equal(channel.status, 'ready')
  assert.deepEqual(channel.ads, [ad])
  assert.match(channel.description, /latest source check was unavailable/)
})

test('listed social presence does not become evidence of paid ads', () => {
  const linkedin = getCompetitorChannels(run([subject()]), { ...smith, channels: ['linkedin'] }).find(({ id }) => id === 'linkedin')
  assert.equal(linkedin.evidence, 'listed')
  assert.equal(linkedin.status, 'unresearched')
  assert.deepEqual(linkedin.ads, [])
  assert.match(linkedin.description, /no ads have been collected/i)
})

test('legacy fixture sources never surface unverified ad cards as real records', () => {
  for (const value of [run([subject()], { source: 'fixture' }), run([], { ads: { status: 'ready', source: 'fixture', subjects: [subject()] } })]) {
    const channel = getCompetitorChannels(value, smith)[0]
    assert.equal(channel.evidence, 'unverified')
    assert.equal(channel.status, 'unresearched')
    assert.deepEqual(channel.ads, [])
    assert.match(channel.description, /No verified ad records/)
  }
})

test('the public snapshot retains unknown Meta coverage and real collected competitors', () => {
  const ads = JSON.parse(readFileSync(new URL('../../fixtures/superagent/library.json', import.meta.url), 'utf8'))
  const fixtureRun = run([], { ads })
  const retell = getCompetitorChannels(fixtureRun, COMPETITORS.find(({ id }) => id === 'retell'))
  assert.equal(retell[0].status, 'unavailable')
  assert.ok(retell[1].ads.length >= 2)
  assert.ok(retell[1].ads.every(ad => ad.source_url.includes('/creative/CR')))
  const bland = getCompetitorChannels(fixtureRun, COMPETITORS.find(({ id }) => id === 'bland'))
  assert.equal(bland[0].status, 'ready')
  assert.ok(bland.some(channel => channel.id === 'newsletter' && channel.ads.length))
})

test('confirmation can explore the public snapshot before research begins', () => {
  const channels = getCompetitorChannels(run([], { source: 'fixture', ads: { status: 'idle', subjects: [] } }), smith)
  assert.equal(channels[0].status, 'ready')
  assert.equal(channels[0].evidence, 'research')
  assert.ok(channels[0].ads.length > 0)
  assert.match(channels[0].description, /saved ads/)
})

test('Ruby aliases and Sonant retain sourced profiles', () => {
  const [ruby, sonant] = getMapCompetitors([node('ruby', 'Ruby', 'callruby.com'), node('sonant', 'Sonant', 'sonant.ai')], 'getsuperagent.com')
  assert.equal(ruby.domain, 'ruby.com')
  assert.ok(ruby.profile.pricing)
  assert.equal(sonant.lane, 'insurance')
  assert.ok(sonant.profile.source_ids.length)
})

test('snapshot fallback never replaces real, pending, failed, completed or partially populated research', () => {
  for (const status of ['ready', 'running', 'error']) {
    const channels = getCompetitorChannels(run([], { source: 'fixture', ads: { status, subjects: [] } }), smith)
    assert.equal(channels[0].ads.length, 0)
  }
  const live = getCompetitorChannels(run([], { ads: { status: 'idle', subjects: [] } }), smith)
  assert.equal(live[0].ads.length, 0)
  const savedEmpty = getCompetitorChannels(run([], { source: 'fixture', ads: { status: 'idle', subjects: [subject({ meta: side('empty') })] } }), smith)
  assert.equal(savedEmpty[0].status, 'unresearched')
  assert.equal(savedEmpty[0].ads.length, 0)
  const partial = getCompetitorChannels(run([], { source: 'fixture', ads: { status: 'idle', subjects: [subject({ name: 'Other', domain: 'other.example' })] } }), smith)
  assert.equal(partial[0].ads.length, 0)
})

test('external links permit only HTTP(S), without embedded credentials', () => {
  assert.equal(safeExternalUrl('https://example.com/ads?q=smith'), 'https://example.com/ads?q=smith')
  for (const value of ['javascript:alert(1)', 'data:text/html,hello', 'file:///tmp/ad', '//example.com', 'https://user:password@example.com', 'not a url']) {
    assert.equal(safeExternalUrl(value), undefined)
  }
})

test('an explicit research source takes priority over the enclosing run source', () => {
  const real = getCompetitorChannels(run([], { source: 'fixture', ads: { status: 'ready', source: 'public_snapshot', subjects: [subject()] } }), smith)[0]
  assert.equal(real.evidence, 'research')
  const unverified = getCompetitorChannels(run([], { source: 'live', ads: { status: 'ready', source: 'fixture', subjects: [subject()] } }), smith)[0]
  assert.equal(unverified.evidence, 'unverified')
  assert.deepEqual(unverified.ads, [])
})

test('additional platform Side objects preserve results even when absent from the competitor listing', () => {
  const creative = { ...ad, platform: 'youtube' }
  const channels = getCompetitorChannels(run([subject({
    youtube: { platform: 'youtube', status: 'ok', ads: [creative] },
    linkedin: { platform: 'linkedin', status: 'empty', ads: [] },
    reddit: { platform: 'reddit', status: 'error', ads: [] },
  })]), { ...smith, channels: [] })
  assert.deepEqual(channels.find(({ id }) => id === 'youtube').ads, [creative])
  assert.equal(channels.find(({ id }) => id === 'linkedin').status, 'empty')
  assert.equal(channels.find(({ id }) => id === 'reddit').status, 'unavailable')
})

test('other_ads merge by platform without duplicate ads or mutation of side records', () => {
  const creative = { ...ad, platform: 'newsletter' }
  const extra = { ...ad, id: 'another-ad', platform: 'Newsletter' }
  const record = subject({ newsletter: { platform: 'newsletter', status: 'ok', ads: [creative] }, other_ads: [creative, extra, { ...ad, id: 'chat-ad', platform: 'chatgpt' }] })
  const channels = getCompetitorChannels(run([record]), { ...smith, channels: [] })
  assert.deepEqual(channels.find(({ id }) => id === 'newsletter').ads, [creative, extra])
  assert.equal(record.newsletter.ads.length, 1)
  assert.match(channels.find(({ id }) => id === 'chatgpt').label, /ChatGPT/)
})

test('your channels display the current run self ads, with empty and unavailable platforms still visible', () => {
  const ownAd = { ...ad, id: 'own-meta-ad' }
  const record = subject({ kind: 'self', name: 'Your company', domain: 'your-company.example', meta: side('ok', [ownAd]), google: { platform: 'google', status: 'unavailable', ads: [] } })
  const channels = getSelfChannels(run([subject(), record], { domain: 'https://www.your-company.example/' }))
  assert.deepEqual(channels.map(channel => channel.id), ['meta', 'google'])
  assert.deepEqual(channels.find(channel => channel.id === 'meta').ads, [ownAd])
  assert.equal(channels.find(channel => channel.id === 'google').status, 'unavailable')
  assert.match(channels.find(channel => channel.id === 'google').description, /could not be verified/)
  assert.equal(getSelfChannels(run([subject({ ...record, meta: side('empty') })], { domain: record.domain })).find(channel => channel.id === 'meta').status, 'empty')
})

test('your channels do not borrow ads from competitors or a different business', () => {
  for (const records of [[subject()], [subject({ kind: 'self', domain: 'different.example' })]]) {
    const channels = getSelfChannels(run(records, { domain: 'your-company.example' }))
    assert.deepEqual(channels.map(channel => channel.ads), [[], []])
    assert.equal(channels.find(channel => channel.id === 'meta').status, 'unresearched')
  }
})

test('your channels use the saved snapshot before confirmation and retain check provenance', () => {
  const channels = getSelfChannels(run([], { domain: 'getsuperagent.com', source: 'fixture', ads: { status: 'idle', subjects: [] } }))
  assert.equal(channels.find(channel => channel.id === 'google').ads.length >= 4, true)
  assert.ok(channels.some(channel => channel.id === 'meta'))
  const record = subject({ kind: 'self', meta: side('unavailable'), ad_checks: [{ platform: 'meta', status: 'unavailable', url: 'https://www.facebook.com/ads/library/', checked_at: '2026-09-08', note: 'The source check was blocked.' }] })
  const checked = getSelfChannels(run([record], { domain: 'smith.ai' })).find(channel => channel.id === 'meta')
  assert.equal(checked.sourceUrl, 'https://www.facebook.com/ads/library/')
  assert.equal(checked.checkedAt, '2026-09-08')
  assert.equal(checked.checkNote, 'The source check was blocked.')
})

test('legacy sources suppress additional platforms, self creatives, and unverified check claims', () => {
  const record = subject({
    kind: 'self',
    other_ads: [{ ...ad, id: 'old-newsletter-ad', platform: 'newsletter' }],
    ad_checks: [{ platform: 'meta', status: 'ok', url: 'https://example.com/ads', checked_at: '2026-09-08', note: 'Unverified historical claim' }],
  })
  const channels = getSelfChannels(run([record], { domain: 'smith.ai', source: 'fixture' }))
  assert.equal(channels.find(channel => channel.id === 'newsletter').status, 'unresearched')
  assert.ok(channels.every(channel => channel.ads.length === 0 && channel.evidence === 'unverified'))
  assert.equal(channels.find(channel => channel.id === 'meta').checkedAt, undefined)
  assert.equal(channels.find(channel => channel.id === 'meta').checkNote, undefined)
})

test('the public snapshot preserves all 79 source records across self and competitor channels', () => {
  const library = JSON.parse(readFileSync(new URL('../../fixtures/superagent/library.json', import.meta.url), 'utf8'))
  const snapshotRun = run([], { source: 'fixture', domain: 'getsuperagent.com', ads: library })
  const collected = library.subjects.flatMap(record => {
    const channels = record.kind === 'self'
      ? getSelfChannels(snapshotRun)
      : getCompetitorChannels(snapshotRun, getMapCompetitors([node(record.domain, record.name, record.domain)], snapshotRun.domain)[0])
    assert.ok(channels.every(channel => channel.evidence !== 'unverified'))
    return channels.flatMap(channel => channel.ads)
  })
  const expected = library.subjects.flatMap(record => [...record.meta.ads, ...record.google.ads, ...(record.other_ads || [])])
  assert.equal(collected.length, 79)
  assert.deepEqual(collected.map(record => record.id).sort(), expected.map(record => record.id).sort())
})

test('Superagent gets the official blog snapshot while paid ad research is still idle', () => {
  const channels = getSelfChannels(run([], { domain: 'https://www.getsuperagent.com/', source: 'live', ads: { status: 'idle', subjects: [] } }))
  const blog = channels.find(channel => channel.id === 'public:blog')
  assert.ok(blog, 'The bundled official blog should be available before paid ad research')
  assert.equal(blog.kind, 'owned')
  assert.equal(blog.status, 'ready')
  assert.equal(blog.evidence, 'research')
  assert.equal(blog.sourceUrl, 'https://news.getsuperagent.com/')
  assert.equal(blog.checkedAt, '2026-09-08')
  assert.ok(blog.content.length >= 8)
  for (const path of ['best-ai-tools-insurance-agencies-2026', 'cross-sell-personal-lines-insurance', 'superagent-3.0-is-here']) {
    assert.ok(blog.content.some(item => item.url === `https://news.getsuperagent.com/${path}`))
  }
  assert.deepEqual(blog.ads, [])
  for (const id of ['meta', 'google']) {
    assert.equal(channels.find(channel => channel.id === id).status, 'unresearched')
    assert.deepEqual(channels.find(channel => channel.id === id).ads, [])
  }
})

test('another business never borrows the bundled Superagent public content', () => {
  for (const domain of ['other-business.example', 'getsuperagent.com.unrelated.example']) {
    const channels = getSelfChannels(run([], { domain }))
    assert.deepEqual(channels.map(channel => channel.id), ['meta', 'google'])
    assert.ok(channels.every(channel => !channel.content))
  }
})

test('a matching saved public snapshot overrides the bundled snapshot, including an explicit empty list', () => {
  const item = publicItem({ url: 'https://news.getsuperagent.com/saved-update' })
  const saved = publicSnapshot([publicChannel([item], { id: 'saved-news', url: 'https://news.getsuperagent.com/' })], 'https://www.getsuperagent.com/')
  const channels = getSelfChannels(run([], { domain: 'getsuperagent.com', public_channels: saved }))
  const contentChannels = channels.filter(channel => channel.id.startsWith('public:'))
  assert.deepEqual(contentChannels.map(channel => channel.id), ['public:saved-news'])
  assert.deepEqual(contentChannels[0].content, [item])
  assert.deepEqual(contentChannels[0].ads, [])
  const empty = getSelfChannels(run([], { domain: 'getsuperagent.com', public_channels: publicSnapshot([], 'getsuperagent.com') }))
  assert.deepEqual(empty.map(channel => channel.id), ['meta', 'google'])
})

test('a saved public snapshot from the wrong domain is ignored without losing the correct bundled blog', () => {
  const wrongSnapshot = publicSnapshot([publicChannel()], 'wrong-company.example')
  const unrelated = getSelfChannels(run([], { domain: 'another-company.example', public_channels: wrongSnapshot }))
  assert.deepEqual(unrelated.map(channel => channel.id), ['meta', 'google'])
  const own = getSelfChannels(run([], { domain: 'getsuperagent.com', public_channels: wrongSnapshot }))
  assert.ok(own.some(channel => channel.id === 'public:blog'))
  assert.ok(!own.some(channel => channel.id === 'public:news'))
})

test('public content omits unsafe channels, unsafe items, duplicates, and untitled entries', () => {
  const valid = publicItem()
  const items = [
    valid,
    publicItem({ id: 'duplicate', url: 'https://YOUR-COMPANY.EXAMPLE/news/update' }),
    ...['javascript:alert(1)', 'data:text/html,unsafe', '//your-company.example/news', 'https://user:pass@your-company.example/news'].map((url, index) => publicItem({ id: `unsafe-${index}`, url })),
    publicItem({ id: 'untitled', title: '   ', url: 'https://your-company.example/news/untitled' }),
  ]
  const saved = publicSnapshot([
    publicChannel(items),
    publicChannel([valid], { id: 'unsafe-source', url: 'javascript:alert(1)' }),
  ])
  const channels = getSelfChannels(run([], { domain: saved.domain, public_channels: saved }))
  assert.deepEqual(channels.filter(channel => channel.id.startsWith('public:')).map(channel => channel.id), ['public:news'])
  assert.deepEqual(channels.find(channel => channel.id === 'public:news').content, [valid])
  assert.equal(saved.channels[0].items.length, 7, 'Filtering must not mutate saved research')
})

test('paid LinkedIn ads remain distinct from public LinkedIn posts', () => {
  const post = publicItem({ id: 'linkedin-post', kind: 'post', url: 'https://www.linkedin.com/posts/your-company-update' })
  const saved = publicSnapshot([publicChannel([post], { id: 'linkedin', kind: 'social', label: 'LinkedIn', icon: 'linkedin', url: 'https://www.linkedin.com/company/your-company/' })])
  const creative = { ...ad, id: 'linkedin-paid-ad', platform: 'linkedin' }
  const company = subject({ kind: 'self', domain: saved.domain, linkedin: { platform: 'linkedin', status: 'ok', ads: [creative] } })
  const channels = getSelfChannels(run([company], { domain: saved.domain, public_channels: saved }))
  const publicLinkedIn = channels.find(channel => channel.id === 'public:linkedin')
  const paidLinkedIn = channels.find(channel => channel.id === 'linkedin')
  assert.deepEqual(publicLinkedIn.content, [post])
  assert.deepEqual(publicLinkedIn.ads, [])
  assert.deepEqual(paidLinkedIn.ads, [creative])
  assert.equal(paidLinkedIn.content, undefined)
  assert.equal(channels.filter(channel => channel.id === 'linkedin').length, 1)
  assert.equal(channels.filter(channel => channel.id === 'public:linkedin').length, 1)
})
