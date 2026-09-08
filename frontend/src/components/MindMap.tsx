import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ANSWER_TOPICS, CHANNELS, ENGINES, LANES, PROMPTS, SECTIONS, PUBLIC_RESEARCH_SNAPSHOT, type Comp, type Prompt } from '../lib/market'
import { getCompetitorChannels, getSelfChannels, getMapCompetitors, getResearchRun, getCompetitorSubject, getSelfSubject, safeExternalUrl, type MapChannel } from '../lib/mindmap-data'
import type { Ad, MapNode, PublicChannelItem, Run } from '../lib/types'
import { getBuyerResearch, hasReceptionistResearch, type BuyerQuestion } from '../lib/buyer-research'
import { questionNodeHeight } from '../lib/question-layout'
import { Research, SubjectProfile, SubjectSources } from '../pages/Research'
import { BrandLogo, hasBrandLogo } from './BrandLogo'
import { AiAnswerCard } from './AiAnswerCard'
import './MindMap.css'
import './MindMap.dark.css'
import { useVisualViewportBottom } from './ActionBar'

const COLORS: Record<string, string> = { competitors: '#7882f7', buyers: '#2ebda3', you: '#e7b74b', answers: '#a16af2' }
const BASE = { width: 1160, height: 930 }
type GraphNode = {
  id: string; kind: 'root' | 'section' | 'lane' | 'company' | 'leaf' | 'channel' | 'ad' | 'topic' | 'question' | 'engine'
  label: string; description?: string; section?: string; icon?: string; domain?: string
  x: number; y: number; width: number; height: number
  comp?: Comp; channel?: MapChannel; ad?: Ad; lane?: string; gap?: boolean
  topic?: string; buyerQuestion?: BuyerQuestion; prompt?: Prompt; engine?: string
}
type Graph = { nodes: GraphNode[]; edges: { from: string; to: string }[] }
type Camera = { x: number; y: number; k: number }

function Icon({ name, size = 22 }: { name: string; size?: number }) {
  if (hasBrandLogo(name)) return <BrandLogo brand={name} size={size} />
  const paths: Record<string, ReactNode> = {
    users: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2" /></>,
    sparkle: <path d="m12 2 3.1 6.9L22 12l-6.9 3.1L12 22l-3.1-6.9L2 12l6.9-3.1Z" />,
    headphones: <><path d="M4 14V10a8 8 0 0 1 16 0v4M6 13H3v7h3zm12 0h3v7h-3z" /></>,
    voice: <><path d="M12 3v18M8 6v12M4 10v4M16 6v12M20 10v4" /></>,
    phone: <path d="M5 3 2 6c0 8 8 16 16 16l3-3-5-5-3 2a15 15 0 0 1-5-5l2-3Z" />,
    flag: <><path d="M4 21V3m0 1 15 4-15 5" /></>,
    bubble: <path d="M21 11a8 8 0 0 1-8 8H8l-5 3 1-6a8 8 0 0 1 8-13h1a8 8 0 0 1 8 8Z" />,
    pen: <><path d="M5 3h10l4 4v14H5zm9 0v5h5M8 12h8m-8 4h6" /></>,
    news: <><path d="M5 4h16v16H5a3 3 0 0 1-3-3V8h3zm0 4v12M9 8h8m-8 4h8m-8 4h5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" /></>,
    calendar: <><path d="M4 5h16v16H4zM8 2v6m8-6v6M4 10h16m-12 4h3m3 0h2" /></>,
    search: <><circle cx="10" cy="10" r="7" /><path d="m15 15 6 6" /></>,
    fit: <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4 10-10" />,
    lightbulb: <><path d="M8 17c0-3-4-4-4-9a8 8 0 0 1 16 0c0 5-4 6-4 9M8 17h8m-7 4h6" /></>,
    external: <path d="M14 3h7v7m0-7L10 14m-1-9H3v16h16v-6" />,
    play: <path d="m8 4 12 8-12 8Z" />,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.bubble}</svg>
}

function CompanyLogo({ domain, name, root = false, logo }: { domain?: string; name: string; root?: boolean; logo?: string | null }) {
  const [failed, setFailed] = useState<string[]>([])
  const local = /^(getsuperagent\.(com|me)|superagent\.ai)$/i.test(domain || '') ? '/superagent-mark.png' : undefined
  const favicon = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : undefined
  const src = [root ? safeExternalUrl(logo) : undefined, local, favicon].find((url): url is string => Boolean(url && !failed.includes(url)))
  return <span className={`company-logo ${root ? 'root-logo' : ''}`}>{src ? <img src={src} alt="" onError={() => setFailed(previous => [...previous, src])} /> : <span>{name.slice(0, 1).toUpperCase()}</span>}</span>
}

function createGraph(run: Run, competitors: Comp[], expanded: Set<string>, channels: Map<string, MapChannel[]>, selfChannels: MapChannel[], openChannel: string | null): Graph {
  const graph: Graph = { nodes: [], edges: [] }
  const buyers = getBuyerResearch(run)
  const answers = getAnswerResearch(run)
  const add = (n: GraphNode, parent?: string) => { graph.nodes.push(n); if (parent) graph.edges.push({ from: parent, to: n.id }) }
  add({ id: 'root', kind: 'root', label: run.brand.name || run.domain, description: 'Business overview', x: 533, y: 415, width: 148, height: 140, domain: run.domain })
  const sections = [
    { id: 'competitors', x: 425, y: 290, label: 'Competitors', description: 'Who else is in this space', icon: 'users' },
    { id: 'buyers', x: 690, y: 265, label: 'Buyers asking', description: `${buyers.questions.length} buyer questions`, icon: 'users' },
    { id: 'you', x: selfChannels.length > 4 ? 260 : 425, y: selfChannels.length > 4 ? 700 : 670, label: 'Your channels', description: 'Content, coverage & ads', icon: 'flag' },
    { id: 'answers', x: 690, y: 670, label: 'AI answers', description: answers.prompts.some(prompt => prompt.results.length) ? `${answers.prompts.reduce((total, prompt) => total + prompt.results.length, 0)} answers · ${answers.prompts.length} questions` : 'Topics → questions → engines', icon: 'sparkle' },
  ]
  sections.forEach(s => add({ ...s, id: `section:${s.id}`, section: s.id, kind: 'section', width: 162, height: 116 }, 'root'))
  let cursor = 36
  for (const lane of LANES) {
    const members = competitors.filter(c => c.lane === lane.id)
    if (!members.length) continue
    const start = cursor
    for (const comp of members) {
      const visibleChannels = expanded.has(comp.id) ? channels.get(comp.id) || [] : []
      const spans = visibleChannels.map(channel => {
        const id = `channel:${comp.id}:${channel.id}`
        return { channel, id, height: openChannel === id ? Math.max(60, channel.ads.length * 112) : 60 }
      })
      const height = Math.max(46, spans.reduce((sum, span) => sum + span.height, 0))
      const company: GraphNode = { id: `company:${comp.id}`, kind: 'company', label: comp.name, section: 'competitors', x: 22, y: cursor + height / 2 - 20, width: 168, height: 40, comp, domain: comp.domain, lane: comp.lane }
      add(company, `lane:${lane.id}`)
      let channelY = cursor
      for (const span of spans) {
        add({ id: span.id, kind: 'channel', section: 'competitors', label: span.channel.label, description: span.channel.ads.length ? `${span.channel.ads.length} saved ads` : span.channel.status === 'empty' ? 'No ads found' : 'No saved ads', icon: span.channel.icon, comp, channel: span.channel, x: -230, y: channelY + span.height / 2 - 27, width: 190, height: 54 }, company.id)
        if (openChannel === span.id) span.channel.ads.forEach((ad, index) => add({ id: `ad:${comp.id}:${span.channel.id}:${ad.id}`, kind: 'ad', section: 'competitors', label: ad.headline || 'Untitled ad', description: ad.body || ad.format || 'View ad details', comp, channel: span.channel, ad, x: -545, y: channelY + index * 112 + 6, width: 250, height: 100 }, span.id))
        channelY += span.height
      }
      cursor += height
    }
    add({ id: `lane:${lane.id}`, kind: 'lane', section: 'competitors', lane: lane.id, label: lane.label, icon: lane.id === 'desk' ? 'headphones' : lane.id === 'voice' ? 'voice' : 'phone', x: 237, y: (start + cursor) / 2 - 27, width: 160, height: 54 }, 'section:competitors')
    cursor += 28
  }
  let buyerY = 52
  for (const topic of buyers.topics) {
    const id = `buyer-topic:${topic.id}`
    const questions = buyers.questions.filter(question => question.topic === topic.id)
    const heights = questions.map(question => questionNodeHeight(question.title))
    const span = expanded.has(id) ? heights.reduce((sum, height) => sum + height + 18, 0) : 86
    add({ id, kind: 'topic', section: 'buyers', topic: topic.id, label: topic.label, description: `${questions.length} questions`, icon: topic.icon, x: 907, y: buyerY + span / 2 - 36, width: 236, height: 72 }, 'section:buyers')
    if (expanded.has(id)) {
      let questionY = buyerY
      questions.forEach((question, index) => {
        add({ id: `buyer-question:${question.id}`, kind: 'question', section: 'buyers', topic: topic.id, label: question.title, description: question.evidence === 'sample' ? 'Sample question' : question.sourceLabel, icon: 'bubble', buyerQuestion: question, x: 1205, y: questionY, width: 336, height: heights[index] }, id)
        questionY += heights[index] + 18
      })
    }
    buyerY += span + 12
  }
  selfChannels.forEach((channel, i) => {
    const split = Math.ceil(selfChannels.length / 2)
    const twoColumns = selfChannels.length > 4
    const right = twoColumns && i >= split
    const row = right ? i - split : i
    const count = right ? selfChannels.length - split : split
    const gap = Math.min(72, 270 / Math.max(1, count - 1))
    const y = twoColumns ? 758 - ((count - 1) * gap + 55) / 2 + row * gap : 645 + i * 72
    add({ id: `you:${channel.id}`, kind: 'leaf', section: 'you', label: channel.label, icon: channel.icon, channel, description: channelSummary(channel), x: twoColumns ? right ? 465 : 22 : 151, y, width: 201, height: 55 }, 'section:you')
  })
  let answerY = Math.max(586, buyerY + 76)
  const answerStart = answerY
  for (const topic of answers.topics) {
    const id = `answer-topic:${topic.id}`
    const prompts = answers.prompts.filter(prompt => prompt.topic === topic.id)
    const spans = prompts.map(prompt => expanded.has(`prompt:${prompt.id}`) ? Math.max(questionNodeHeight(prompt.text), Object.keys(ENGINES).length * 108) : questionNodeHeight(prompt.text))
    const span = expanded.has(id) ? spans.reduce((sum, height) => sum + height + 18, 0) : 92
    const captured = prompts.reduce((total, prompt) => total + prompt.results.length, 0)
    add({ id, kind: 'topic', section: 'answers', topic: topic.id, label: topic.label, description: `${prompts.length} ${prompts.length === 1 ? 'question' : 'questions'}${captured ? ` · ${captured} answers` : ' to test'}`, icon: topic.icon, x: 907, y: answerY + span / 2 - 38, width: 236, height: 76 }, 'section:answers')
    if (expanded.has(id)) {
      let questionY = answerY
      prompts.forEach((prompt, index) => {
        const promptId = `prompt:${prompt.id}`, height = questionNodeHeight(prompt.text)
        add({ id: promptId, kind: 'question', section: 'answers', topic: topic.id, label: prompt.text, description: prompt.results.length ? `${prompt.results.length}/${Object.keys(ENGINES).length} responses collected` : `${Object.keys(ENGINES).length} engines · Not checked`, icon: 'sparkle', prompt, x: 1205, y: questionY + (spans[index] - height) / 2, width: 336, height }, id)
        if (expanded.has(promptId)) Object.entries(ENGINES).forEach(([engine, details], engineIndex) => {
          const result = prompt.results.find(result => result.engine === engine)
          add({ id: `engine:${prompt.id}:${engine}`, kind: 'engine', section: 'answers', topic: topic.id, label: details.label, description: result ? result.excerpt : 'No response collected', icon: engine, prompt, engine, x: 1603, y: questionY + engineIndex * 108, width: 260, height: 92 }, promptId)
        })
        questionY += spans[index] + 18
      })
    }
    answerY += span + 14
  }
  const answerSection = graph.nodes.find(node => node.id === 'section:answers')!
  answerSection.y = answerStart + (answerY - answerStart) / 2 - answerSection.height / 2
  return graph
}

function getAnswerResearch(run: Run) {
  if (hasReceptionistResearch(run)) return { topics: ANSWER_TOPICS, prompts: PROMPTS }
  const name = run.brand.name || run.domain
  return { topics: [{ id: 'evaluate', label: 'Evaluating your product', icon: 'search' }], prompts: [
    { id: 'product-fit', topic: 'evaluate', text: `Who is ${name} best suited for?`, intent: 'Proposed evaluation question', results: [] },
    { id: 'product-compare', topic: 'evaluate', text: `How does ${name} compare with alternatives?`, intent: 'Proposed comparison question', results: [] },
  ] as Prompt[] }
}

function descendants(graph: Graph, id: string): Set<string> {
  const result = new Set([id])
  const pending = [id]
  while (pending.length) {
    const parent = pending.pop()!
    for (const edge of graph.edges) if (edge.from === parent && !result.has(edge.to)) {
      result.add(edge.to); pending.push(edge.to)
    }
  }
  return result
}

function edgePath(from: GraphNode, to: GraphNode) {
  const left = to.x + to.width / 2 < from.x + from.width / 2
  const x1 = left ? from.x : from.x + from.width
  const x2 = left ? to.x + to.width : to.x
  const y1 = from.y + from.height / 2
  const y2 = to.y + to.height / 2
  const bend = Math.max(40, Math.abs(x2 - x1) * .58)
  return `M ${x1} ${y1} C ${x1 + (left ? -bend : bend)} ${y1}, ${x2 + (left ? bend : -bend)} ${y2}, ${x2} ${y2}`
}

export function MindMap({ run, nodes, onChange, onConfirm, confirming }: {
  run: Run; nodes: MapNode[]; onChange: (nodes: MapNode[]) => void; onConfirm: (competitorIds: string[]) => void; confirming?: boolean
}) {
  const competitors = useMemo(() => getMapCompetitors(nodes, run.domain), [nodes, run.domain])
  const channels = useMemo(() => new Map(competitors.map(comp => [comp.id, getCompetitorChannels(run, comp)])), [competitors, run.ads, run.source])
  const selfChannels = useMemo(() => getSelfChannels(run), [run.ads, run.source, run.domain, run.public_channels])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [openChannel, setOpenChannel] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, k: .7 })
  const [size, setSize] = useState({ width: 900, height: 760 })
  const viewport = useRef<HTMLDivElement>(null)
  const inspectorScroll = useRef<HTMLDivElement>(null)
  const actionBarBottom = useVisualViewportBottom()
  const researchDialog = useRef<HTMLDialogElement>(null)
  const preparing = confirming || ['researching', 'writing', 'rendering'].includes(run.status)
  const researchRun = useMemo(() => getResearchRun(run), [run])
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean; pointer: number } | null>(null)
  const visibleExpanded = useMemo(() => {
    const next = new Set(expanded)
    const search = query.trim().toLowerCase()
    if (search) {
      getBuyerResearch(run).questions.forEach(question => {
        if (`${question.title} ${question.snippet} ${question.sourceLabel || ''}`.toLowerCase().includes(search)) next.add(`buyer-topic:${question.topic}`)
      })
      getAnswerResearch(run).prompts.forEach(prompt => {
        if (prompt.text.toLowerCase().includes(search)) next.add(`answer-topic:${prompt.topic}`)
      })
    }
    return next
  }, [expanded, query, run])
  const graph = useMemo(() => createGraph(run, competitors, visibleExpanded, channels, selfChannels, openChannel), [run, competitors, visibleExpanded, channels, selfChannels, openChannel])
  const byId = useMemo(() => new Map(graph.nodes.map(node => [node.id, node])), [graph])
  const selected = selectedId ? byId.get(selectedId) : undefined
  const focusedNodes = useMemo(() => focusId ? descendants(graph, focusId) : null, [graph, focusId])
  const isSnapshot = run.ads.source === 'public_snapshot' || (
    run.source === 'fixture' && run.ads.status === 'idle' && !run.ads.subjects.length && PUBLIC_RESEARCH_SNAPSHOT.source === 'public_snapshot'
  )
  const snapshotLabel = isSnapshot ? `Public research snapshot · ${formatDate(run.ads.researched_at || PUBLIC_RESEARCH_SNAPSHOT.observedAt)}` : undefined

  useEffect(() => {
    inspectorScroll.current?.scrollTo({ top: 0 })
  }, [selectedId])

  useEffect(() => {
    const element = viewport.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    const wheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = element.getBoundingClientRect(), px = event.clientX - rect.left, py = event.clientY - rect.top
      setCamera(previous => {
        const k = Math.max(.28, Math.min(1.8, previous.k * Math.exp(-event.deltaY * .0015)))
        return { k, x: px - (px - previous.x) * k / previous.k, y: py - (py - previous.y) * k / previous.k }
      })
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel) }
  }, [])

  const matches = (node: GraphNode) => {
    const inFocus = !focusedNodes || focusedNodes.has(node.id)
    const inFilter = !filter || (filter.startsWith('lane:') ? node.lane === filter.slice(5) || node.comp?.lane === filter.slice(5) || node.id === 'section:competitors' : node.section === filter)
    const inQuery = !query.trim() || `${node.label} ${node.description || ''} ${node.domain || ''} ${node.comp?.name || ''} ${node.channel?.content?.map(item => `${item.title} ${item.summary}`).join(' ') || ''}`.toLowerCase().includes(query.trim().toLowerCase())
    return inFocus && (node.kind === 'root' || inFilter && inQuery)
  }

  function fit(list: GraphNode[], overview = false) {
    if (!list.length) return
    const x0 = Math.min(...list.map(n => n.x), ...(overview ? [0] : [])) - 34
    const y0 = Math.min(...list.map(n => n.y), ...(overview ? [0] : [])) - 50
    const x1 = Math.max(...list.map(n => n.x + n.width), ...(overview ? [BASE.width] : [])) + 34
    const y1 = Math.max(...list.map(n => n.y + n.height), ...(overview ? [BASE.height] : [])) + 50
    const k = Math.min(overview ? 1 : 1.12, (size.width - 28) / (x1 - x0), (size.height - 38) / (y1 - y0))
    setCamera({ x: (size.width - (x1 - x0) * k) / 2 - x0 * k, y: (size.height - (y1 - y0) * k) / 2 - y0 * k, k })
  }

  useEffect(() => {
    if (focusId && focusedNodes?.size) {
      fit(graph.nodes.filter(node => focusedNodes.has(node.id)))
      return
    }
    if (filter || query.trim()) fit(graph.nodes.filter(n => n.kind !== 'root' && matches(n)))
    else fit(graph.nodes, expanded.size === 0)
  }, [graph, size.width, size.height, focusId, filter, query])

  function overview() {
    setExpanded(new Set()); setOpenChannel(null); setSelectedId(null); setFocusId(null); setFilter(''); setQuery('')
    fit(graph.nodes, true)
  }

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return
      if (event.key === 'Escape' || event.key === '0') overview()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [graph])

  function select(node: GraphNode) {
    if (drag.current?.moved) return
    if (node.kind === 'root') {
      overview()
      return
    }
    setSelectedId(node.id)
    if (node.kind === 'company' && node.comp) {
      const next = new Set(expanded)
      if (next.has(node.comp.id)) { next.delete(node.comp.id); setOpenChannel(null); setFocusId(null) }
      else { next.add(node.comp.id); setFocusId(node.id); setQuery(''); setFilter('') }
      setExpanded(next)
    } else if (node.kind === 'channel') {
      setQuery(''); setFilter('')
      setOpenChannel(openChannel === node.id ? null : node.id)
      setFocusId(openChannel === node.id ? `company:${node.comp!.id}` : node.id)
    } else if (node.kind === 'topic' || node.prompt && node.kind === 'question') {
      const next = new Set(expanded)
      if (next.has(node.id)) {
        descendants(graph, node.id).forEach(id => next.delete(id))
        setFocusId(node.prompt ? `answer-topic:${node.topic}` : null)
      } else { next.add(node.id); setFocusId(node.id) }
      setExpanded(next); setQuery(''); setFilter('')
    } else if (node.kind === 'lane') {
      setFocusId(null); setFilter(filter === node.id ? '' : node.id); setQuery('')
    }
  }

  function openCompany(comp: Comp) {
    setExpanded(previous => new Set(previous).add(comp.id)); setSelectedId(`company:${comp.id}`); setFocusId(`company:${comp.id}`); setFilter(''); setQuery('')
  }
  function openAds(comp: Comp, channel: MapChannel) {
    setExpanded(previous => new Set(previous).add(comp.id)); const id = `channel:${comp.id}:${channel.id}`
    setOpenChannel(id); setSelectedId(id); setFocusId(id); setFilter(''); setQuery('')
  }
  function zoom(multiplier: number) {
    setCamera(previous => {
      const k = Math.max(.28, Math.min(1.8, previous.k * multiplier))
      return { k, x: size.width / 2 - (size.width / 2 - previous.x) * k / previous.k, y: size.height / 2 - (size.height / 2 - previous.y) * k / previous.k }
    })
  }
  const activeComp = selected?.comp
  const matchCount = graph.nodes.filter(n => n.kind !== 'root' && matches(n)).length

  return <div className="glass-map">
    <aside className="map-sidebar glass-panel">
      <p className="map-eyebrow">Market map</p>
      <h1 className="map-title">The whole market,<br />one map</h1>
      <p className="map-description">Explore sourced company profiles, public content, ad creatives, and the questions that still need research.</p>
      <label className="map-search"><Icon name="search" size={19} /><input aria-label="Search the market map" value={query} onChange={e => { setQuery(e.target.value); setFocusId(null) }} placeholder="Find a competitor, venue, question…" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" size={14} /></button>}</label>
      <div className="map-filters" aria-label="Map sections">
        <Chip active={!filter} onClick={() => { setFilter(''); setFocusId(null) }}>All</Chip>
        {SECTIONS.map(s => <Chip key={s.id} color={COLORS[s.id]} active={filter === s.id} onClick={() => { setFilter(filter === s.id ? '' : s.id); setFocusId(null); if (s.id === 'you') setSelectedId(filter === s.id ? null : 'section:you') }}>{s.id === 'you' ? 'Your channels' : s.short}</Chip>)}
      </div>
      <div className="map-lanes"><p className="map-eyebrow">Competitor lanes</p><div className="map-filters">{LANES.map(lane => <Chip key={lane.id} color={lane.id === 'desk' ? '#638cff' : lane.id === 'voice' ? '#a16af2' : '#19958b'} active={filter === `lane:${lane.id}`} onClick={() => { setFilter(filter === `lane:${lane.id}` ? '' : `lane:${lane.id}`); setFocusId(null) }}>{lane.label}</Chip>)}</div></div>
      <div className="map-sidebar-bottom">
        <div className="map-mini-guide"><span className="map-tip"><Icon name="chevron" size={15} /> Competitor → channels → ads</span><p>Click a company to unfold its channels. Follow a channel to explore its ads.</p></div>
        <div className="map-controls"><button type="button" className="map-icon-button" aria-label="Zoom out" onClick={() => zoom(1 / 1.2)}>−</button><span className="map-zoom-label">{Math.round(camera.k * 100)}%</span><button type="button" className="map-icon-button" aria-label="Zoom in" onClick={() => zoom(1.2)}>+</button><button type="button" className="map-secondary-button" onClick={overview}><Icon name="fit" size={15} /> Fit</button></div>
        <p className="map-instructions">Drag to pan · scroll to zoom · 0 to fit</p>
      </div>
    </aside>

    <main className="map-workspace" aria-label="Interactive business mindmap">
      <div className="map-canvas-toolbar"><div className="map-breadcrumb"><button type="button" onClick={overview}>All map</button>{activeComp && <><Icon name="chevron" size={12} /><button type="button" onClick={() => openCompany(activeComp)}>{activeComp.name}</button></>}{selected?.channel && <><Icon name="chevron" size={12} /><span>{selected.channel.label}</span></>}</div>{expanded.size > 0 && <button type="button" className="map-text-button" onClick={overview}>Collapse all</button>}</div>
      <div ref={viewport} className="map-viewport" onPointerDown={event => {
        if ((event.target as HTMLElement).closest('button, a')) return
        drag.current = { x: event.clientX, y: event.clientY, cx: camera.x, cy: camera.y, moved: false, pointer: event.pointerId }
        event.currentTarget.setPointerCapture(event.pointerId)
      }} onPointerMove={event => {
        const state = drag.current
        if (!state || state.pointer !== event.pointerId) return
        const dx = event.clientX - state.x, dy = event.clientY - state.y
        if (Math.abs(dx) + Math.abs(dy) > 3) state.moved = true
        if (state.moved) setCamera(previous => ({ ...previous, x: state.cx + dx, y: state.cy + dy }))
      }} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) overview() }}>
        <div className="map-world" style={{ width: BASE.width, height: BASE.height, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.k})` }}>
          <div className="map-quadrant quadrant-competitors" style={{ left: 5, top: 12, width: 585, height: 452 }} />
          <div className="map-quadrant quadrant-buyers" style={{ left: 598, top: 12, width: 554, height: 452 }} />
          <div className="map-quadrant quadrant-you" style={{ left: 5, top: 474, width: 585, height: 442 }} />
          <div className="map-quadrant quadrant-answers" style={{ left: 598, top: 474, width: 554, height: 442 }} />
          <svg className="map-connections" width={BASE.width} height={BASE.height} style={{ overflow: 'visible' }} aria-hidden="true">{graph.edges.map(edge => {
            const from = byId.get(edge.from), to = byId.get(edge.to)
            if (!from || !to) return null
            const color = COLORS[to.section || 'competitors']
            const left = to.x + to.width / 2 < from.x + from.width / 2
            return <g key={`${edge.from}-${edge.to}`} opacity={matches(to) ? .7 : .1}><path d={edgePath(from, to)} fill="none" stroke={color} strokeWidth={from.kind === 'root' ? 3.2 : 1.8} strokeDasharray={to.gap ? '5 5' : undefined} /><circle cx={left ? to.x + to.width : to.x} cy={to.y + to.height / 2} r={3} fill={color} /></g>
          })}</svg>
          {graph.nodes.map(node => {
            const hasChildren = node.kind === 'company' || node.kind === 'channel' || node.kind === 'topic' || node.kind === 'question' && !!node.prompt
            const isExpanded = node.kind === 'company' ? expanded.has(node.comp!.id) : node.kind === 'channel' ? openChannel === node.id : visibleExpanded.has(node.id)
            return <button key={node.id} type="button" className={`map-node map-node--${node.kind} ${selectedId === node.id ? 'is-selected' : ''} ${!matches(node) ? 'is-dimmed' : ''} ${node.gap ? 'is-gap' : ''}`} data-section={node.section} data-node-id={node.id} title={node.label} tabIndex={matches(node) ? 0 : -1} onFocus={() => { const left = node.x * camera.k + camera.x, top = node.y * camera.k + camera.y; if (left < 0 || top < 45 || left + node.width * camera.k > size.width || top + node.height * camera.k > size.height - 35) setCamera(previous => ({ ...previous, x: size.width / 2 - (node.x + node.width / 2) * previous.k, y: size.height / 2 - (node.y + node.height / 2) * previous.k })) }} aria-label={node.kind === 'company' ? `${node.label}, ${isExpanded ? 'collapse' : 'expand'} channels` : node.kind === 'channel' ? `${node.comp!.name} ${node.label}, ${isExpanded ? 'collapse' : 'show'} ads` : node.kind === 'ad' ? `View ad: ${node.label}` : node.label} aria-expanded={hasChildren ? isExpanded : undefined} aria-pressed={hasChildren ? undefined : selectedId === node.id} onClick={() => select(node)} style={{ left: node.x, top: node.y, width: node.width, height: node.height, '--node-color': COLORS[node.section || 'competitors'] } as CSSProperties}>
              {node.kind === 'root' || node.kind === 'company' ? <CompanyLogo domain={node.domain} name={node.label} root={node.kind === 'root'} logo={run.brand.logo_url} /> : node.kind === 'ad' ? <span className="node-ad-platform">{node.channel?.label}</span> : <span className={`node-icon${hasBrandLogo(node.icon || '') ? ' node-icon--brand' : ''}`}><Icon name={node.icon || 'bubble'} size={node.kind === 'section' ? 29 : 23} /></span>}
              <span className="node-copy"><span className="node-label">{node.label}</span>{node.description && <span className="node-description">{node.description}</span>}</span>
              {hasChildren && <span className={`node-chevron ${isExpanded ? 'is-expanded' : ''}`}><Icon name="chevron" size={14} /></span>}
              {node.kind === 'ad' && <span className="node-ad-action">View creative <Icon name="arrow" size={13} /></span>}
            </button>
          })}
        </div>
      </div>
      <div className="map-canvas-hint" role="status">{query && !matchCount ? `No matches for “${query}”` : selected?.channel && isContentChannel(selected.channel) ? `${channelSummary(selected.channel)} · open a source in the details panel` : selected?.kind === 'channel' ? `${selected.channel!.ads.length} saved ads · click an ad for the full creative` : expanded.size ? 'Follow the branches to explore. Click a company again to collapse.' : 'A little clarity. A world of possibilities.'}</div>
    </main>

    <aside className="map-inspector glass-panel" aria-label="Map details" aria-live="polite">
      <div className="inspector-heading"><p className="map-eyebrow">{selected ? 'Explore this node' : 'Insights from this map'}</p>{selected && <button type="button" className="inspector-close map-icon-button" aria-label="Close details" onClick={() => setSelectedId(null)}><Icon name="close" size={17} /></button>}</div>
      <div ref={inspectorScroll} className="inspector-scroll" role="region" aria-label="Insights and details" tabIndex={0}>
      <Inspector run={run} selected={selected} competitors={competitors} channels={channels} selfChannels={selfChannels} snapshotLabel={snapshotLabel} onCompany={openCompany} onChannel={openAds} onRemove={comp => { onChange(nodes.filter(n => n.id !== comp.id)); setSelectedId(null); setFocusId(null); setExpanded(previous => { const next = new Set(previous); next.delete(comp.id); return next }) }} onResearch={() => researchDialog.current?.showModal()} onSelect={id => { const node = byId.get(id); if (node && (node.kind === 'topic' || node.kind === 'question' && node.prompt)) { select(node); return }; setSelectedId(id); if (id.startsWith('section:')) { setFilter(id.slice(8)); setFocusId(null) } }} />
      {!selected && <div className="map-quick-tips"><h3>Quick tips</h3>{['Click a competitor to unfold its channels', 'Explore your content in Your channels', 'Zoom and pan to see more'].map(tip => <p key={tip} className="map-tip"><span><Icon name="check" size={13} /></span>{tip}</p>)}</div>}
      </div>
      <div className="inspector-launch" style={{ '--action-bar-lift': `${actionBarBottom}px` } as CSSProperties}><h3>Ready for your next ad?</h3><p>Ads stay untouched until you confirm.</p><button type="button" className="map-primary-button" disabled={preparing} onClick={() => onConfirm(competitors.map(c => c.id))}>{preparing ? run.status === 'writing' ? 'Preparing directions…' : 'Researching your product…' : run.brief && run.concepts.length && !run.stale.research ? 'Create Ads' : 'Research & prepare ads'}<Icon name="arrow" size={19} /></button></div>
    </aside>
    <dialog ref={researchDialog} className="product-research-dialog" aria-label="Product research and insights">
      <div className="product-research-header"><span>Your product / Research & insights</span><button type="button" className="map-secondary-button" onClick={() => researchDialog.current?.close()}>Back to map <Icon name="close" size={16} /></button></div>
      <Research run={researchRun} embedded />
    </dialog>
  </div>
}

function Chip({ active, color, children, onClick }: { active: boolean; color?: string; children: ReactNode; onClick: () => void }) {
  return <button type="button" className="map-chip" aria-pressed={active} onClick={onClick}>{color && <i style={{ background: color }} />}{children}</button>
}

function Inspector({ run, selected, competitors, channels, selfChannels, snapshotLabel, onCompany, onChannel, onRemove, onSelect, onResearch }: {
  run: Run; selected?: GraphNode; competitors: Comp[]; channels: Map<string, MapChannel[]>; selfChannels: MapChannel[]; snapshotLabel?: string
  onCompany: (comp: Comp) => void; onChannel: (comp: Comp, channel: MapChannel) => void; onRemove: (comp: Comp) => void; onSelect: (id: string) => void; onResearch: () => void
}) {
  if (!selected) return <>
    <button type="button" className="inspector-card opportunity-card" onClick={() => onSelect('section:you')}><span className="opportunity-icon"><Icon name="sparkle" size={28} /></span><span><b>Test a ChatGPT campaign</b><span>Use observed creative to shape a measured test.</span></span><Icon name="chevron" size={17} /></button>
    <p className="inspector-description">Your market, connected. Explore the companies, channels, and messages behind your next campaign.</p>
    {selfChannels.some(channel => channel.content?.length) && <div className="map-owned-preview">
      <div className="map-content-heading"><p className="map-eyebrow">Your public content</p><span>{selfChannels.reduce((count, channel) => count + (channel.content?.length || 0), 0)} resources</span></div>
      <div className="map-channel-list">{selfChannels.filter(channel => channel.content?.length).slice(0, 2).map(channel => <SelfChannelButton key={channel.id} channel={channel} onSelect={onSelect} />)}</div>
      <button type="button" className="map-text-button" onClick={() => onSelect('section:you')}>Explore all your channels <Icon name="arrow" size={13} /></button>
    </div>}
    {snapshotLabel && <span className="status-badge">{snapshotLabel}</span>}
    {['researching', 'writing'].includes(run.status) && <p className="inspector-description" role="status">{run.status === 'writing' ? 'Preparing campaign directions from your research…' : 'Updating company profiles and ad research…'}</p>}
    {run.stale.research && <p className="inspector-description">The map changed. Research again to refresh your campaign brief.</p>}
    {run.insights.slice(0, 3).map((insight, index) => <button type="button" className="inspector-card map-insight-preview" key={index} onClick={onResearch}><b>{insight.title}</b><p>{insight.recommendation || insight.observation}</p><span className="ad-source-link">View evidence <Icon name="arrow" size={14} /></span></button>)}
    <button type="button" className="map-text-button" onClick={onResearch}>All research, sources & insights <Icon name="arrow" size={14} /></button>
  </>
  if (selected.kind === 'ad' && selected.ad) return <><p className="inspector-kicker">{selected.comp?.name} / {selected.channel?.label}</p><h2 className="inspector-title">Ad creative</h2><button type="button" className="map-text-button" onClick={() => onChannel(selected.comp!, selected.channel!)}>← All {selected.channel?.label}</button><CreativeCard key={selected.ad.id} ad={selected.ad} /></>
  if (selected.channel) {
    const channel = selected.channel
    if (isContentChannel(channel)) return <ContentChannelDetails channel={channel} businessName={run.brand.name || run.domain} onBack={() => onSelect('section:you')} />
    return <><p className="inspector-kicker">{selected.comp?.name || run.brand.name}</p><h2 className="inspector-title">{channel.label}</h2><p className="inspector-description">{channel.description}</p>{(channel.checkedAt || channel.checkNote) && <details className="inspector-description"><summary>Source check{channel.checkedAt ? ` · ${formatDate(channel.checkedAt)}` : ''}</summary>{channel.checkNote && <p>{channel.checkNote}</p>}</details>}<div className="map-ad-list">{channel.ads.length ? channel.ads.map(ad => <CreativeCard key={ad.id} ad={ad} />) : <div className="map-empty-state"><Icon name="search" size={30} /><h3>{channel.status === 'empty' ? 'No matching ads found' : channel.status === 'unavailable' ? 'Ad activity unverified' : 'No saved ads yet'}</h3><p>{channel.status === 'empty' ? 'The last library result was empty. It does not prove this business never advertises here.' : 'Explore the source directly, or run ad research to collect available ads.'}</p></div>}</div>{channel.sourceUrl && <a className="ad-source-link" href={channel.sourceUrl} target="_blank" rel="noreferrer">Open channel source <Icon name="external" size={14} /></a>}</>
  }
  if (selected.comp) {
    const comp = selected.comp, available = channels.get(comp.id) || [], subject = getCompetitorSubject(run, comp), profile = comp.profile
    return <><p className="inspector-kicker">{LANES.find(lane => lane.id === comp.lane)?.label}</p><div className="inspector-company"><CompanyLogo domain={comp.domain} name={comp.name} /><h2 className="inspector-title">{comp.name}</h2></div><p className="inspector-description">{comp.tag}</p>
      {subject && <div className="map-subject-research"><SubjectProfile subject={subject} /><SubjectSources subject={subject} /></div>}
      {!subject && profile && <div className="map-brief-list">
        {profile.audience && <div className="inspector-card"><p className="map-eyebrow">Audience</p><p>{profile.audience}</p></div>}
        {(profile.pricing || comp.price) && <div className="inspector-card"><p className="map-eyebrow">Published pricing</p><p>{profile.pricing || comp.price}</p></div>}
        {profile.offer && <div className="inspector-card"><p className="map-eyebrow">Offer</p><p>{profile.offer}</p></div>}
        {profile.differentiators?.length ? <div className="inspector-card"><p className="map-eyebrow">Product capabilities</p><p>{profile.differentiators.join(' · ')}</p></div> : null}
      </div>}
      <p className="map-eyebrow">Channels & ad libraries</p><div className="map-channel-list">{available.map(channel => <button key={channel.id} type="button" className="map-channel-button" onClick={() => onChannel(comp, channel)}><span className="node-icon"><Icon name={channel.icon} /></span><span className="channel-summary"><b>{channel.label}</b><span>{channel.ads.length ? `${channel.ads.length} saved ads` : channel.status === 'empty' ? 'No matching ads' : channel.status === 'unavailable' ? 'Source unavailable' : 'Not researched'}</span>{comp.channelEvidence?.[channel.id]?.thirdPartyRecords ? <small>Advertiser relationship unverified</small> : null}</span><Icon name="chevron" size={16} /></button>)}</div>{safeExternalUrl(`https://${comp.domain}`) && <a className="ad-source-link" href={safeExternalUrl(`https://${comp.domain}`)} target="_blank" rel="noreferrer">Visit {comp.domain}<Icon name="external" size={14} /></a>}<button type="button" className="map-text-button remove-competitor" onClick={() => onRemove(comp)}>Remove from map</button></>
  }
  if (selected.kind === 'root') return <><p className="inspector-kicker">Your business / {run.domain}</p><h2 className="inspector-title">{run.brand.name}</h2><p className="inspector-description">{run.brand.one_liner}</p>{getSelfSubject(run) && <div className="map-subject-research"><SubjectProfile subject={getSelfSubject(run)!} /><SubjectSources subject={getSelfSubject(run)!} /></div>}<div className="map-brief-list">{nodesForBrief(run.map.nodes).map(node => <div className="inspector-card" key={node.id}><p className="map-eyebrow">{node.branch}</p><p>{node.text}</p></div>)}</div></>
  if (selected.kind === 'lane' || selected.id === 'section:competitors') return <><h2 className="inspector-title">{selected.label}</h2><p className="inspector-description">Click a company to reveal its channels, then follow a channel to its ads.</p><div className="map-channel-list">{competitors.filter(comp => !selected.lane || comp.lane === selected.lane).map(comp => <button key={comp.id} type="button" className="map-channel-button" onClick={() => onCompany(comp)}><CompanyLogo domain={comp.domain} name={comp.name} /><span className="channel-summary"><b>{comp.name}</b><span>{comp.domain}</span></span><Icon name="chevron" size={16} /></button>)}</div></>
  const buyers = getBuyerResearch(run)
  const answers = getAnswerResearch(run)
  if (selected.buyerQuestion) return <BuyerQuestionCard question={selected.buyerQuestion} />
  if (selected.id.startsWith('buyer-topic:')) return <><h2 className="inspector-title">{selected.label}</h2><p className="inspector-description">{buyers.note}</p>{buyers.questions.filter(question => question.topic === selected.topic).map(question => <BuyerQuestionCard key={question.id} question={question} compact />)}</>
  if (selected.prompt) {
    const prompt = selected.prompt
    const engines = selected.engine ? Object.entries(ENGINES).filter(([id]) => id === selected.engine) : Object.entries(ENGINES)
    return <><p className="inspector-kicker">AI answer research · {prompt.results.length ? 'captured responses' : 'proposed question'}</p><h2 className="inspector-title">{prompt.text}</h2>{engines.map(([engine, details]) => {
      const result = prompt.results.find(result => result.engine === engine)
      return result ? <AiAnswerCard key={engine} result={result} label={details.label} expanded={!!selected.engine} /> : <article className="inspector-card answer-result" key={engine}><h3 className="answer-brand-heading"><BrandLogo brand={engine} size={24} />{details.label}</h3><span className="status-badge">Not checked</span><p className="inspector-description">No response collected for this question yet.</p></article>
    })}</>
  }
  if (selected.id.startsWith('answer-topic:')) return <><h2 className="inspector-title">{selected.label}</h2><p className="inspector-description">Expand a question to read the captured answers, compare named brands, and follow the sources returned by each engine.</p><div className="map-channel-list">{answers.prompts.filter(prompt => prompt.topic === selected.topic).map(prompt => <button type="button" className="map-channel-button" key={prompt.id} onClick={() => onSelect(`prompt:${prompt.id}`)}><Icon name="sparkle" /><span>{prompt.text}</span><Icon name="chevron" size={15} /></button>)}</div></>
  if (selected.section === 'you') return <>
    <h2 className="inspector-title">Your channels</h2>
    <p className="inspector-description">Explore your published content, social activity, press coverage, and verified ad records. Every resource links to its source.</p>
    <div className="map-channel-list">{selfChannels.map(channel => <SelfChannelButton key={channel.id} channel={channel} onSelect={onSelect} />)}</div>
  </>
  const section = SECTIONS.find(item => item.id === selected.section)
  return <><h2 className="inspector-title">{selected.label}</h2><p className="inspector-description">{selected.section === 'you' ? 'Saved ads and source checks for your business. Open a channel to review its creatives and evidence.' : selected.section === 'buyers' ? buyers.note : section?.note}</p><div className="map-channel-list">{selected.section === 'buyers' ? buyers.topics.map(topic => <button className="map-channel-button" type="button" key={topic.id} onClick={() => onSelect(`buyer-topic:${topic.id}`)}><Icon name={topic.icon} /><span className="channel-summary"><b>{topic.label}</b><span>{buyers.questions.filter(question => question.topic === topic.id).length} questions</span></span><Icon name="chevron" size={15} /></button>) : selected.section === 'answers' ? answers.topics.map(topic => <button className="map-channel-button" type="button" key={topic.id} onClick={() => onSelect(`answer-topic:${topic.id}`)}><Icon name={topic.icon} /><b>{topic.label}</b><Icon name="chevron" size={15} /></button>) : selfChannels.map(channel => <button className="map-channel-button" type="button" key={channel.id} onClick={() => onSelect(`you:${channel.id}`)}><Icon name={channel.icon} /><span className="channel-summary"><b>{channel.label}</b><span>{channelSummary(channel)}</span></span><Icon name="chevron" size={15} /></button>)}</div></>
}

function BuyerQuestionCard({ question, compact = false }: { question: BuyerQuestion; compact?: boolean }) {
  const source = safeExternalUrl(question.sourceUrl)
  return <article className={`inspector-card buyer-question-card${compact ? ' is-compact' : ''}`}>
    <span className="status-badge">{question.evidence === 'sample' ? 'Sample question' : 'Public discussion'}</span>
    <h3>{question.title}</h3><p className="inspector-description">{question.snippet}</p>
    <p className="buyer-intent">{question.intent}</p>
    {question.sourceLabel && <p className="buyer-source">{question.sourceLabel}{question.publishedAt ? ` · ${formatDate(question.publishedAt)}` : ''}</p>}
    {source && <a className="ad-source-link" href={source} target="_blank" rel="noreferrer">Read original discussion <Icon name="external" size={14} /></a>}
    <p className="buyer-evidence-note">{question.evidence === 'sample' ? 'Illustrative prompt; no public conversation collected.' : 'Paraphrased from a public post. Experience and identity are self-reported.'}</p>
  </article>

}

function channelSummary(channel: MapChannel) {
  if (isContentChannel(channel)) {
    const content = channel.content || []
    if (!content.length) return channel.status === 'unavailable' ? 'Content unverified' : 'No saved resources'
    const firstKind = content[0].kind
    const homogeneous = content.every(item => item.kind === firstKind)
    return `${content.length} ${homogeneous ? contentCountLabel(firstKind, content.length) : 'resources'}`
  }
  return channel.ads.length ? `${channel.ads.length} saved ${channel.ads.length === 1 ? 'ad' : 'ads'}` : channel.status === 'unavailable' ? 'Activity unverified' : channel.status === 'empty' ? 'No saved matches' : 'Not researched'
}

function isContentChannel(channel: MapChannel) { return Boolean(channel.kind || channel.content) }

function channelKindLabel(channel: MapChannel) {
  return channel.kind === 'owned' ? 'Owned content' : channel.kind === 'social' ? 'Social content' : channel.kind === 'earned' ? 'Earned coverage' : isContentChannel(channel) ? 'Public content' : 'Paid advertising'
}

function contentCountLabel(kind: PublicChannelItem['kind'], count: number) {
  const labels: Record<PublicChannelItem['kind'], [string, string]> = {
    article: ['article', 'articles'], post: ['post', 'posts'], video: ['video', 'videos'], page: ['resource', 'resources'],
    press: ['press release', 'press releases'], profile: ['profile', 'profiles'], event: ['event', 'events'],
  }
  return labels[kind][count === 1 ? 0 : 1]
}

function SelfChannelButton({ channel, onSelect }: { channel: MapChannel; onSelect: (id: string) => void }) {
  return <button className="map-channel-button map-self-channel" type="button" onClick={() => onSelect(`you:${channel.id}`)}>
    <span className="node-icon"><Icon name={channel.icon} /></span>
    <span className="channel-summary"><b>{channel.label}</b><span>{channelSummary(channel)}</span><small>{channelKindLabel(channel)}</small></span>
    <Icon name="chevron" size={15} />
  </button>
}

function ContentChannelDetails({ channel, businessName, onBack }: { channel: MapChannel; businessName: string; onBack: () => void }) {
  const source = safeExternalUrl(channel.sourceUrl)
  const content = channel.content || []
  return <>
    <p className="inspector-kicker">{businessName} / {channelKindLabel(channel)}</p>
    <h2 className="inspector-title">{channel.label}</h2>
    <button type="button" className="map-text-button" onClick={onBack}>← Your channels</button>
    <p className="inspector-description">{channel.description}</p>
    <div className="map-content-heading"><span className="map-content-type">{channelKindLabel(channel)}</span><span>{channelSummary(channel)}</span></div>
    <div className="map-content-list">
      {content.length ? content.map(item => <PublicContentCard key={item.id} item={item} />) : <div className="map-empty-state"><Icon name="pen" size={28} /><h3>No saved resources yet</h3><p>Open the channel source to explore its published content.</p></div>}
    </div>
    {(channel.checkedAt || channel.checkNote) && <details className="map-content-evidence"><summary>Source check{channel.checkedAt ? ` · ${formatDate(channel.checkedAt)}` : ''}</summary>{channel.checkNote && <p>{channel.checkNote}</p>}</details>}
    {source && <a className="ad-source-link" href={source} target="_blank" rel="noopener noreferrer">Open channel source <Icon name="external" size={14} /></a>}
  </>
}

function PublicContentCard({ item }: { item: PublicChannelItem }) {
  const source = safeExternalUrl(item.url)
  const icons: Record<PublicChannelItem['kind'], string> = { article: 'pen', post: 'bubble', video: 'play', page: 'globe', press: 'news', profile: 'users', event: 'calendar' }
  const labels: Record<PublicChannelItem['kind'], string> = { article: 'Article', post: 'Post', video: 'Video', page: 'Resource', press: 'Press release', profile: 'Profile', event: 'Event' }
  return <article className="map-content-card">
    <div className="map-content-meta"><span className="map-content-icon"><Icon name={icons[item.kind]} size={19} /></span><span>{labels[item.kind]}</span>{item.published_at && <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>}</div>
    <h3>{source ? <a href={source} target="_blank" rel="noopener noreferrer">{item.title}</a> : item.title}</h3>
    <p>{item.summary}</p>
    <div className="map-content-footer">
      {source && <a className="ad-source-link" href={source} target="_blank" rel="noopener noreferrer">{item.kind === 'video' ? 'Watch video' : item.kind === 'article' ? 'Read article' : 'Open source'}<Icon name="external" size={13} /></a>}
      <span>{source ? new URL(source).hostname.replace(/^www\./, '') : 'Source unavailable'}</span>
    </div>
    {item.observed_at && <p className="map-content-observed">Observed {formatDate(item.observed_at)}</p>}
  </article>
}

function nodesForBrief(nodes: MapNode[]) { return nodes.filter(node => node.branch !== 'competitors').slice(0, 8) }

function formatDate(value?: string | null) {
  if (!value) return 'date unavailable'
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function CreativeCard({ ad }: { ad: Ad }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const source = safeExternalUrl(ad.source_url), landing = safeExternalUrl(ad.link_url), image = safeExternalUrl(ad.image_url), video = safeExternalUrl(ad.video_url)
  const unverifiedAdvertiser = ad.advertiser_relationship === 'unverified_third_party'
  const evidence = unverifiedAdvertiser ? 'Domain match · advertiser unverified'
    : ad.evidence_type === 'third_party_observed_ad' ? 'Independent ad capture'
    : ad.evidence_type === 'publisher_confirmed_campaign' ? 'Publisher-confirmed campaign'
    : ad.evidence_type === 'publisher_confirmed_paid_ad' ? 'Publisher-confirmed paid ad'
    : ad.evidence_type ? 'Public ad-library record' : 'Saved creative · verification unavailable'
  const activity = ad.is_active === true ? 'Active when observed' : ad.is_active === false ? 'Inactive when observed' : 'Activity unknown'
  return <article className="map-ad-card">
    <div className="ad-meta"><span>{ad.advertiser || 'Ad creative'}</span><span>{activity}</span></div>
    {video && !videoFailed
      ? <video className="ad-preview-image" src={video} poster={image} controls preload="none" onError={() => setVideoFailed(true)} />
      : image && !imageFailed
        ? <img className="ad-preview-image" src={image} alt={ad.headline || 'Ad creative'} onError={() => setImageFailed(true)} />
        : <div className="ad-placeholder"><Icon name={ad.platform === 'google' ? 'google' : ad.format === 'video' ? 'play' : 'pen'} size={26} /><span>{ad.format?.includes('search') || ad.platform === 'google' && ad.format === 'text' ? 'Text ad · see source for rendering' : 'Preview unavailable · open source'}</span></div>}
    <div className="ad-card-copy">
      <p className="ad-format">{CHANNELS[ad.platform]?.label || ad.platform} · {ad.format || 'Ad'}</p>
      <p className="ad-format">{evidence}{ad.observed_at ? ` · Observed ${formatDate(ad.observed_at)}` : ''}</p>
      {ad.last_shown_at && <p className="ad-format">Last shown {formatDate(ad.last_shown_at)}</p>}
      {(ad.started_at || ad.ended_at) && <p className="ad-format">{ad.started_at ? `Started ${formatDate(ad.started_at)}` : ''}{ad.started_at && ad.ended_at ? ' · ' : ''}{ad.ended_at ? `Ended ${formatDate(ad.ended_at)}` : ''}</p>}
      <h3 className="ad-headline">{ad.headline || 'Campaign creative'}</h3>
      {ad.body && <p className="ad-body">{ad.body}</p>}
      {ad.verification_note && <p className="inspector-description">{ad.verification_note}</p>}
      <div className="ad-footer">
        {ad.cta && <span className="ad-cta">{ad.cta}</span>}
        {source && <a className="ad-source-link" href={source} target="_blank" rel="noreferrer">Ad source <Icon name="external" size={13} /></a>}
        {video && <a className="ad-source-link" href={video} target="_blank" rel="noreferrer">Open video <Icon name="play" size={13} /></a>}
        {landing && <a className="ad-source-link" href={landing} target="_blank" rel="noreferrer">Landing page <Icon name="external" size={13} /></a>}
      </div>
    </div>
  </article>
}
