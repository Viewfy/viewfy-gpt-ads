import type { ReactNode } from 'react'
import type { Prompt } from '../lib/market'
import { safeExternalUrl } from '../lib/external-url'
import { BrandLogo } from './BrandLogo'

type Answer = Prompt['results'][number]

function inline(text: string, sources: Answer['citations']): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|\[\d+\])/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{inline(part.slice(2, -2), sources)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{inline(part.slice(1, -1), sources)}</em>
    if (/^\[\d+\]$/.test(part)) {
      const source = sources.find(source => source.id === Number(part.slice(1, -1)))
      const url = safeExternalUrl(source?.url)
      if (url) return <a key={index} href={url} target="_blank" rel="noreferrer" className="answer-citation" title={source?.title}>{part}</a>
    }
    return part
  })
}

function tableRow(line: string, separator: '\t' | '|') {
  const cells = line.split(separator)
  if (separator === '|') {
    if (!cells[0].trim()) cells.shift()
    if (!cells[cells.length - 1]?.trim()) cells.pop()
  }
  return cells.map(cell => cell.trim())
}

function tableSeparator(lines: string[], index: number): '\t' | '|' | undefined {
  if (lines[index].includes('\t') && lines[index + 1]?.includes('\t') && tableRow(lines[index], '\t').length === tableRow(lines[index + 1], '\t').length) return '\t'
  if (lines[index].includes('|') && lines[index + 1]?.includes('|')) {
    const header = tableRow(lines[index], '|')
    const rule = tableRow(lines[index + 1], '|')
    if (header.length > 1 && rule.length === header.length && rule.every(cell => /^:?-{3,}:?$/.test(cell))) return '|'
  }
}

const listItem = /^\s*(?:([-*])|(\d+)[.)])\s+(.+)$/

function AnswerBody({ result }: { result: Answer }) {
  const lines = result.response.split(/\r?\n/)
  const blocks: ReactNode[] = []
  let index = 0
  while (index < lines.length) {
    const key = index
    const line = lines[index]
    if (!line.trim()) { index++; continue }
    const separator = tableSeparator(lines, index)
    if (separator) {
      const header = tableRow(line, separator)
      index += separator === '|' ? 2 : 1
      const rows: string[][] = []
      while (index < lines.length && lines[index].includes(separator) && tableRow(lines[index], separator).length === header.length) {
        rows.push(tableRow(lines[index++], separator))
      }
      blocks.push(<div className="answer-table-scroll" role="region" aria-label="Comparison from the captured response" tabIndex={0} key={key}>
        <table><thead><tr>{header.map((cell, cellIndex) => <th key={cellIndex} scope="col">{inline(cell, result.citations)}</th>)}</tr></thead>
          <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{inline(cell, result.citations)}</td>)}</tr>)}</tbody></table>
      </div>)
      continue
    }
    if (/^#{1,6}\s/.test(line)) {
      blocks.push(<h4 key={key}>{inline(line.replace(/^#{1,6}\s+/, ''), result.citations)}</h4>)
      index++
      continue
    }
    const firstItem = line.match(listItem)
    if (firstItem) {
      const ordered = Boolean(firstItem[2])
      const items: ReactNode[] = []
      let item: RegExpMatchArray | null | undefined = firstItem
      while (item && Boolean(item[2]) === ordered) {
        items.push(<li key={index} value={ordered ? Number(item[2]) : undefined}>{inline(item[3], result.citations)}</li>)
        index++
        item = lines[index]?.match(listItem)
      }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>)
      continue
    }
    const paragraph = [line]
    index++
    while (index < lines.length && lines[index].trim() && !listItem.test(lines[index]) && !/^#{1,6}\s/.test(lines[index]) && !tableSeparator(lines, index)) {
      paragraph.push(lines[index++])
    }
    blocks.push(<p key={key}>{inline(paragraph.join('\n'), result.citations)}</p>)
  }
  return <div className="captured-answer-text">{blocks}</div>
}

export function AiAnswerCard({ result, label, expanded = false }: { result: Answer; label: string; expanded?: boolean }) {
  const date = new Date(result.collectedAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric', timeZone:'UTC'})
  return <article className="inspector-card answer-result">
    <h3 className="answer-brand-heading"><BrandLogo brand={result.engine} size={24} />{label}</h3>
    <p className="answer-capture-meta">{result.sourceLabel} · <time dateTime={result.collectedAt}>{date}</time></p>
    <p className="answer-model">{result.model}</p>
    <span className="status-badge">Captured response</span>
    {expanded ? <AnswerBody result={result} /> : <>
      <p className="inspector-description">{result.excerpt}</p>
      <details className="answer-full"><summary>Read full response</summary><AnswerBody result={result} /></details>
    </>}
    {!!result.brands.length && <p className="answer-brands"><b>Brands mentioned</b><br />{result.brands.join(' · ')}</p>}
    {result.citations.length ? <details className="answer-sources"><summary>Sources returned ({result.citations.length})</summary><ol>{result.citations.map((source, index) => {
      const url = safeExternalUrl(source.url)
      return url ? <li key={`${url}-${index}`}><a href={url} target="_blank" rel="noreferrer">{source.id ? `[${source.id}] ` : ''}{source.title || new URL(url).hostname}</a></li> : null
    })}</ol></details> : <p className="answer-capture-meta">This response did not include source links.</p>}
  </article>
}
