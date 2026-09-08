import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'

const output = mkdtempSync(join(tmpdir(), 'viewfy-buyers-'))
after(() => rmSync(output, { recursive: true, force: true }))
for (const name of ['buyer-research', 'question-layout', 'types']) {
  writeFileSync(join(output, `${name}.cjs`), ts.transpileModule(readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText)
}
const require = createRequire(import.meta.url)
const { getBuyerResearch } = require(join(output, 'buyer-research.cjs'))
const { questionNodeHeight } = require(join(output, 'question-layout.cjs'))
const { STEPS } = require(join(output, 'types.cjs'))

test('buyer questions have distinct public sources and complete topic membership', () => {
  const result = getBuyerResearch({ domain: 'getsuperagent.com', brand: {} })
  assert.equal(result.questions.length, 8)
  assert.equal(new Set(result.questions.map(question => question.sourceUrl)).size, 8)
  for (const question of result.questions) {
    assert.equal(question.evidence, 'public_discussion')
    assert.equal(new URL(question.sourceUrl).protocol, 'https:')
    assert.ok(result.topics.some(topic => topic.id === question.topic))
  }
})

test('unrelated businesses get labeled sample questions, never insurance evidence', () => {
  const result = getBuyerResearch({ domain: 'bakery.example', brand: { name: 'Sweet Bakery', category: 'Bakery' } })
  assert.match(result.note, /Sample/)
  assert.ok(result.questions.every(question => question.evidence === 'sample' && !question.sourceUrl))
  assert.ok(result.questions.every(question => question.title.includes('Sweet Bakery')))
})

test('long question cards reserve more height, including narrower layouts and long words', () => {
  const question = 'How do insurance-specific AI receptionists compare with general answering services?'
  assert.ok(questionNodeHeight(question) > questionNodeHeight('Which receptionist?'))
  assert.ok(questionNodeHeight(question, 260) > questionNodeHeight(question, 336))
  assert.ok(questionNodeHeight('a'.repeat(180)) > 180)
})

test('legacy research runs remain in Your product with four wizard steps', () => {
  assert.equal(STEPS.length, 4)
  assert.equal(STEPS.find(step => step.match.includes('research')).id, 'product')
  assert.ok(!STEPS.some(step => step.id === 'research'))
})
