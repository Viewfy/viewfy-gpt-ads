import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const output = mkdtempSync(join(tmpdir(), 'viewfy-campaign-test-'))
after(() => rmSync(output, { recursive: true, force: true }))
const helperPath = join(output, 'campaign-state.cjs')
writeFileSync(helperPath, ts.transpileModule(
  readFileSync(new URL('../src/lib/campaign-state.ts', import.meta.url), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } },
).outputText)
const { campaignOutcome, hasCampaignIds, hasSubmittedCampaign, isCampaignConnected, isCampaignLaunched } = createRequire(import.meta.url)(helperPath)

const campaign = (extra = {}) => ({
  mode: 'live',
  connected: true,
  status: 'draft',
  budget_usd: 25,
  geo: ['US'],
  account: { id: 'adacct_saved', name: 'Saved account' },
  external_ids: { campaign_id: 'cmp_saved', ad_group_id: 'grp_saved', ad_id: 'ad_saved' },
  ...extra,
})

test('only a validated live account is considered connected', () => {
  assert.equal(isCampaignConnected(campaign()), true)
  for (const extra of [
    { mode: 'demo' }, { mode: null }, { connected: false }, { connected: undefined },
    { account: { name: 'A stale name' } }, { account: { id: '  ' } }, { account: { id: 'adacct_demo' } },
  ]) assert.equal(isCampaignConnected(campaign(extra)), false)
})

test('every submitted entity needs a nonempty external ID', () => {
  assert.equal(hasCampaignIds(campaign()), true)
  for (const key of ['campaign_id', 'ad_group_id', 'ad_id']) {
    for (const value of ['', ' ', undefined, `${key}_demo`]) {
      const valueWithMissingId = campaign({ status: 'active' })
      valueWithMissingId.external_ids[key] = value
      assert.equal(hasCampaignIds(valueWithMissingId), false)
      assert.equal(hasSubmittedCampaign(valueWithMissingId), false)
    }
  }
})

test('saved live entity IDs alone do not indicate submission', () => {
  for (const status of ['draft', 'failed', 'error', 'launching', 'unknown']) {
    assert.equal(hasSubmittedCampaign(campaign({ status })), false)
  }
  for (const status of ['active', 'submitted', 'under_review']) {
    assert.equal(hasSubmittedCampaign(campaign({ status })), true)
  }
})

test('legacy demo and disconnected data never produce a successful launch screen', () => {
  for (const mode of ['demo', 'mock', 'unconnected', null, undefined]) {
    for (const status of ['active', 'submitted', 'under_review']) {
      const value = campaign({ mode, status })
      assert.equal(hasSubmittedCampaign(value), false)
      assert.equal(campaignOutcome(value).title, 'Campaign not launched')
    }
  }
})

test('the live heading requires active status and actual entity IDs', () => {
  assert.equal(campaignOutcome(campaign({ status: 'active' })).title, 'Campaign was created! 🚀')
  assert.equal(campaignOutcome(campaign({ status: 'submitted' })).title, 'Campaign was created! 🚀')
  assert.equal(campaignOutcome(campaign({ status: 'under_review' })).title, 'Campaign was created! 🚀')
  assert.equal(campaignOutcome(campaign({ status: 'active', external_ids: {} })).title, 'Campaign not launched')
  assert.equal(campaignOutcome(campaign({ preview: true, status: 'draft', external_ids: {} })).title, 'Campaign was created! 🚀')
})

test('failed and rejected campaigns remain actionable and never successful', () => {
  for (const extra of [{ status: 'failed' }, { status: 'active', review_status: 'rejected' }]) {
    const value = campaign(extra)
    assert.equal(hasSubmittedCampaign(value), false)
    assert.equal(campaignOutcome(value).title, 'Campaign needs attention')
  }
})

test('the full demo celebrates a created campaign after skip-launch', () => {
  for (const status of ['draft', 'failed']) {
    const value = campaign({ submission_deferred: true, preview: true, status, external_ids: {}, error: 'Previous attempt failed' })
    assert.equal(isCampaignLaunched(value), true)
    assert.equal(hasSubmittedCampaign(value), false)
    assert.equal(campaignOutcome(value).title, 'Campaign was created! 🚀')
    assert.match(campaignOutcome(value).description, /Astra just launched/)
  }
})

test('a skipped setup does not erase actual submission evidence', () => {
  const value = campaign({ submission_deferred: true, status: 'active' })
  assert.equal(hasSubmittedCampaign(value), true)
  assert.equal(isCampaignLaunched(value), true)
  assert.equal(campaignOutcome(value).title, 'Campaign was created! 🚀')
})
