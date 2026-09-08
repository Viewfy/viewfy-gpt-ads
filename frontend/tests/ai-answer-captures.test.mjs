import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const snapshot = JSON.parse(readFileSync(new URL('../../fixtures/superagent/ai-answers.json', import.meta.url), 'utf8'))
const evidence = new URL('../../docs/research/ai-answers/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('manifest.json', evidence), 'utf8'))
const expectedQuestions = [
  'Best AI receptionist for a small insurance agency',
  'How do small insurance agencies handle missed calls after hours?',
  'How do insurance-specific AI receptionists compare with general answering services?',
]

test('each requested question has an independently attributed response from all three engines', () => {
  assert.deepEqual(snapshot.prompts.map(prompt => prompt.text), expectedQuestions)
  for (const prompt of snapshot.prompts) {
    assert.deepEqual(prompt.results.map(result => result.engine).sort(), ['chatgpt', 'claude', 'perplexity'])
    for (const result of prompt.results) {
      assert.ok(result.response.length > 1000)
      assert.ok(result.excerpt.length > 40 && result.excerpt.length <= 240)
      assert.ok(result.collectedAt.startsWith('2026-09-08'))
      assert.ok(result.model.length)
      assert.equal(result.method, result.engine === 'perplexity' ? 'api' : 'web_app')
      assert.match(result.sourceLabel, result.method === 'api' ? /Sonar API/ : /web app/)
    }
  }
})

test('the mock preserves the complete original transcript for every capture', () => {
  assert.equal(manifest.length, 9)
  for (const entry of manifest) {
    const prompt = snapshot.prompts.find(prompt => prompt.id === entry.questionId)
    const result = prompt.results.find(result => result.engine === entry.engine)
    const original = readFileSync(new URL(entry.file, evidence), 'utf8').replace(/\n$/, '')
    assert.equal(result.response, original)
    assert.equal(result.response.length, entry.characters)
    assert.equal(createHash('sha256').update(result.response).digest('hex'), entry.sha256)
  }
})

test('numbered references resolve to their returned sources and all saved links are safe', () => {
  for (const prompt of snapshot.prompts) {
    for (const result of prompt.results) {
      for (const citation of result.citations) {
        const url = new URL(citation.url)
        assert.equal(url.protocol, 'https:')
        assert.equal(url.username, '')
        assert.equal(url.password, '')
        assert.ok(citation.title.length)
      }
      if (result.engine === 'perplexity') {
        for (const match of result.response.matchAll(/\[(\d+)\]/g)) {
          assert.ok(result.citations.some(citation => citation.id === Number(match[1])), `Missing citation ${match[1]} for ${prompt.id}`)
        }
      }
    }
  }
})
