import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const output = mkdtempSync(join(tmpdir(), 'viewfy-variants-test-'))
after(() => rmSync(output, { recursive: true, force: true }))
const libOutput = join(output, 'frontend/src/lib')
mkdirSync(libOutput, { recursive: true })
mkdirSync(join(output, 'fixtures/superagent'), { recursive: true })
const snapshotText = readFileSync(new URL('../../fixtures/superagent/creative-variants.json', import.meta.url), 'utf8')
writeFileSync(join(output, 'fixtures/superagent/creative-variants.json'), snapshotText)
const source = readFileSync(new URL('../src/lib/creative-variants.ts', import.meta.url), 'utf8')
writeFileSync(join(libOutput, 'creative-variants.js'), ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText)
const { getCreativeVariantGroups, creativeVariantPatch } = createRequire(import.meta.url)(join(libOutput, 'creative-variants.js'))
const snapshot = { ...JSON.parse(snapshotText), ready: true }
const creatives = snapshot.groups.map((group) => ({
  id: group.creative_id,
  concept_id: group.concept_id,
  title: `Custom title for ${group.creative_id}`,
  body: 'Copy that the customer has edited.',
  cta: 'See the product',
  target_url: 'https://getsuperagent.com/inbound-ai-agent',
  format: 'image',
  image_url: '/demo-ads/original.png',
}))
const run = { domain: 'getsuperagent.com', creatives }

test('the chooser stays hidden until the entire image catalog is ready', () => {
  assert.deepEqual(getCreativeVariantGroups(run, { ...snapshot, ready: false }), [])
  assert.deepEqual(getCreativeVariantGroups(run, snapshot), snapshot.groups)
  assert.deepEqual(getCreativeVariantGroups(run, { ready: true, groups: [] }), [])
})

test('variant choices belong only to the exact Superagent domain', () => {
  for (const domain of ['getsuperagent.com', 'https://WWW.GETSUPERAGENT.COM/product', 'www.getsuperagent.com']) {
    assert.equal(getCreativeVariantGroups({ ...run, domain }, snapshot).length, 2)
  }
  for (const domain of ['example.com', 'getsuperagent.com.example.com', 'https://getsuperagent.com@example.com', 'superagent.ai', 'news.getsuperagent.com', 'javascript://getsuperagent.com', '']) {
    assert.deepEqual(getCreativeVariantGroups({ ...run, domain }, snapshot), [])
  }
})

test('the chooser requires both matching creative and concept identities', () => {
  assert.deepEqual(getCreativeVariantGroups({ ...run, creatives: [creatives[0]] }, snapshot), [])
  assert.deepEqual(getCreativeVariantGroups({ ...run, creatives: [{ ...creatives[0], concept_id: 'custom' }, creatives[1]] }, snapshot), [])
  assert.deepEqual(getCreativeVariantGroups({ ...run, creatives: [{ ...creatives[0], id: 'custom' }, creatives[1]] }, snapshot), [])
  assert.deepEqual(getCreativeVariantGroups({ ...run, creative: creatives[0], creatives: [] }, snapshot), [])
})

test('choosing artwork patches only the matching ad image and preserves customer edits', () => {
  const original = structuredClone(creatives)
  for (const [index, group] of snapshot.groups.entries()) {
    for (const variant of group.variants) {
      assert.deepEqual(creativeVariantPatch(creatives[index], group, variant), { id: group.creative_id, image_url: variant.image_url })
      assert.equal(creativeVariantPatch(creatives[index === 0 ? 1 : 0], group, variant), null)
      assert.equal(creativeVariantPatch(creatives[index], group, { ...variant, image_url: '/unlisted.png' }), null)
    }
  }
  assert.deepEqual(creatives, original)
})
