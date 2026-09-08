import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CHANNELS,
  COMPETITORS,
  ENGINES,
  INSIGHTS,
  LANES,
  PROMPTS,
  SECTIONS,
  THREADS,
  VENUES,
  YOU,
  type Comp,
} from '../lib/market'
import type { MapNode, Run } from '../lib/types'

const TAU = Math.PI * 2
const BG = '#0c0b0a'
const INK = '#f4efe6'
const GOLD = '#e8c36a'
const MUT = '#a39c92'
const DIM = '#6b6560'
const FONT = '"Hanken Grotesk", system-ui, sans-serif'
const SHOWN_INSIGHTS = INSIGHTS.slice(0, 2)

const KIND: Record<string, [string, string]> = {
  act: ['Needs you', GOLD],
  gap: ['Gap', '#7eb8e8'],
  risk: ['Risk', '#f07167'],
  win: ['Working', '#6ee7b7'],
}

type GNode = {
  id: string
  kind: 'company' | 'section' | 'group' | 'leaf'
  section?: string
  parent?: string
  lane?: string
  label: string
  color: string
  r: number
  sub?: string
  icon?: string
  chan?: string
  domain?: string
  gap?: boolean
  engine?: string
  thread?: (typeof THREADS)[number]
  prompt?: (typeof PROMPTS)[number]
  comp?: Comp
  venue?: (typeof VENUES)[number]
  x: number
  y: number
  tx: number
  ty: number
  a: number
  alpha: number
  talpha: number
}

function favicon(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
}

function loadImg(cache: Map<string, HTMLImageElement>, src: string) {
  const hit = cache.get(src)
  if (hit) return hit
  const im = new Image()
  im.src = src
  cache.set(src, im)
  return im
}

function ready(im?: HTMLImageElement) {
  return Boolean(im && im.complete && im.naturalWidth > 2)
}

function drawIcon(ctx: CanvasRenderingContext2D, name: string, s: number, fg: string) {
  const k = s / 24
  ctx.fillStyle = fg
  ctx.strokeStyle = fg
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (name === 'meta') {
    ctx.lineWidth = 2.6 * k
    ctx.beginPath()
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * TAU
      const d = 1 + Math.sin(t) ** 2
      const x = (8 * k * Math.cos(t)) / d
      const y = (8 * k * Math.sin(t) * Math.cos(t)) / d
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
    return
  }
  if (name === 'google') {
    const r = 6.5 * k
    ctx.lineWidth = 3 * k
    const arc = (a0: number, a1: number, col: string) => {
      ctx.beginPath()
      ctx.strokeStyle = col
      ctx.arc(0, 0, r, a0, a1)
      ctx.stroke()
    }
    arc(-2.6, -1.2, '#ea4335')
    arc(-1.2, 0, '#fbbc05')
    arc(0, 0.9, '#34a853')
    arc(2.2, 2.6, '#4285f4')
    ctx.beginPath()
    ctx.strokeStyle = '#4285f4'
    ctx.moveTo(0, 0)
    ctx.lineTo(r + 1.4 * k, 0)
    ctx.stroke()
    return
  }
  if (name === 'x') {
    ctx.beginPath()
    ctx.moveTo(-6 * k, -6 * k)
    ctx.lineTo(6 * k, 6 * k)
    ctx.moveTo(6 * k, -6 * k)
    ctx.lineTo(-6 * k, 6 * k)
    ctx.lineWidth = 2.4 * k
    ctx.stroke()
    return
  }
  if (name === 'linkedin') {
    ctx.fillRect(-6 * k, -2 * k, 3.2 * k, 10 * k)
    ctx.beginPath()
    ctx.arc(-4.4 * k, -4.6 * k, 1.8 * k, 0, TAU)
    ctx.fill()
    ctx.fillRect(-1.6 * k, -2 * k, 3.2 * k, 10 * k)
    ctx.beginPath()
    ctx.moveTo(1.6 * k, 2 * k)
    ctx.lineTo(1.6 * k, 8 * k)
    ctx.lineTo(5.4 * k, 8 * k)
    ctx.lineTo(5.4 * k, 1.2 * k)
    ctx.quadraticCurveTo(5.4 * k, -2.4 * k, 1.6 * k, -2 * k)
    ctx.fill()
    return
  }
  if (name === 'reddit') {
    ctx.beginPath()
    ctx.ellipse(0, 1.5 * k, 8 * k, 6 * k, 0, 0, TAU)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, -6.5 * k, 2 * k, 0, TAU)
    ctx.fill()
    ctx.fillStyle = BG
    ctx.beginPath()
    ctx.arc(-3 * k, 1 * k, 1.5 * k, 0, TAU)
    ctx.arc(3 * k, 1 * k, 1.5 * k, 0, TAU)
    ctx.fill()
    return
  }
  if (name === 'play') {
    ctx.beginPath()
    ctx.moveTo(-4.5 * k, -6 * k)
    ctx.lineTo(7 * k, 0)
    ctx.lineTo(-4.5 * k, 6 * k)
    ctx.closePath()
    ctx.fill()
    return
  }
  if (name === 'pen') {
    ctx.save()
    ctx.rotate(-Math.PI / 4)
    ctx.beginPath()
    ctx.roundRect(-2.4 * k, -8 * k, 4.8 * k, 11 * k, 1.5 * k)
    ctx.fill()
    ctx.restore()
    return
  }
  if (name === 'bubble') {
    ctx.beginPath()
    ctx.roundRect(-8.5 * k, -7 * k, 17 * k, 12.5 * k, 4 * k)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-5 * k, 4.5 * k)
    ctx.lineTo(-6 * k, 9 * k)
    ctx.lineTo(-1 * k, 5 * k)
    ctx.fill()
    return
  }
  if (name === 'sparkle') {
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2
      const r = i % 2 ? 3.2 * k : 9 * k
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
    return
  }
  if (name === 'flag') {
    ctx.lineWidth = 2.2 * k
    ctx.beginPath()
    ctx.moveTo(-6 * k, -9 * k)
    ctx.lineTo(-6 * k, 9 * k)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-5 * k, -8 * k)
    ctx.lineTo(8 * k, -4.5 * k)
    ctx.lineTo(-5 * k, -1 * k)
    ctx.closePath()
    ctx.fill()
    return
  }
  if (name === 'target') {
    ctx.lineWidth = 2 * k
    ctx.beginPath()
    ctx.arc(0, 0, 8.5 * k, 0, TAU)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 4.8 * k, 0, TAU)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 1.6 * k, 0, TAU)
    ctx.fill()
    return
  }
  ctx.font = `800 ${name.length > 2 ? 8 : 12}px ${FONT}`
  ctx.fillText(name[0] || '?', 0, 0.5 * k)
}

function badge(
  ctx: CanvasRenderingContext2D,
  cache: Map<string, HTMLImageElement>,
  x: number,
  y: number,
  s: number,
  o: { bg: string; fg?: string; icon?: string; ring?: string | null; ringW?: number; domain?: string; shape?: 'circle' | 'square'; dashed?: boolean },
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  if (o.shape === 'square') ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.28)
  else ctx.arc(0, 0, s / 2, 0, TAU)
  if (o.dashed) {
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = o.bg
    ctx.lineWidth = 1.5
    ctx.fillStyle = '#141210'
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])
  } else {
    ctx.fillStyle = o.bg
    ctx.fill()
  }
  if (o.ring) {
    ctx.lineWidth = o.ringW || 2
    ctx.strokeStyle = o.ring
    ctx.stroke()
  }
  const im = o.domain ? loadImg(cache, o.domain === 'getsuperagent.com' ? '/superagent-logo.png' : favicon(o.domain)) : undefined
  if (ready(im)) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.36, 0, TAU)
    ctx.clip()
    ctx.drawImage(im!, -s * 0.36, -s * 0.36, s * 0.72, s * 0.72)
    ctx.restore()
  } else if (o.icon) {
    drawIcon(ctx, o.icon, s, o.dashed ? o.bg : o.fg || BG)
  }
  ctx.restore()
}

function isSuperagent(domain?: string) {
  const host = (domain || '').replace(/^www\./, '').toLowerCase()
  return host === 'getsuperagent.com' || host === 'getsuperagent.me' || host === 'superagent.ai'
}

function compsFrom(nodes: MapNode[], domain?: string) {
  const listed = nodes.filter((n) => n.branch === 'competitors')
  if (!listed.length) return COMPETITORS
  const byDomain = new Map(COMPETITORS.map((c) => [c.domain, c]))
  const known = listed
    .map((n) => byDomain.get(n.domain || '') || COMPETITORS.find((c) => c.id === n.id || c.name.toLowerCase() === n.text.toLowerCase()))
    .filter((c): c is Comp => Boolean(c))
  const uniq = [...new Map(known.map((c) => [c.id, c])).values()]
  if (uniq.length) return uniq
  if (isSuperagent(domain)) return COMPETITORS
  return listed.map((n) => ({
    id: n.id,
    name: n.text,
    domain: n.domain || '',
    lane: 'desk',
    price: '',
    tag: n.text,
    vs: '',
    channels: ['meta', 'google'],
    hooks: [],
  }))
}

export function MindMap({
  run,
  nodes,
  onChange,
  onConfirm,
  confirming,
}: {
  run: Run
  nodes: MapNode[]
  onChange: (nodes: MapNode[]) => void
  onConfirm: (competitorIds: string[]) => void
  confirming?: boolean
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logos = useRef(new Map<string, HTMLImageElement>())
  const cam = useRef({ x: 0, y: 0, k: 0.72, tx: 0, ty: 0, tk: 0.72, drag: false, moved: false, lx: 0, ly: 0 })
  const hover = useRef<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [query, setQuery] = useState('')
  const [tip, setTip] = useState<{ x: number; y: number; label: string; sub?: string } | null>(null)
  const graph = useMemo(() => {
    const g = buildGraph(compsFrom(nodes))
    applyFilter(g, filter)
    return g
  }, [nodes, filter])

  useEffect(() => {
    const cache = logos.current
    loadImg(cache, '/superagent-logo.png')
    for (const c of compsFrom(nodes)) loadImg(cache, favicon(c.domain))
  }, [nodes])

  useEffect(() => {
    const c = canvasRef.current
    const wrap = wrapRef.current
    if (!c || !wrap) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let raf = 0
    const t0 = performance.now()
    const draw = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (c.width !== Math.round(w * dpr)) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
        c.style.width = `${w}px`
        c.style.height = `${h}px`
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const camv = cam.current
      camv.x += (camv.tx - camv.x) * 0.08
      camv.y += (camv.ty - camv.y) * 0.08
      camv.k += (camv.tk - camv.k) * 0.08
      for (const n of graph.nodes) {
        n.x += (n.tx - n.x) * 0.1
        n.y += (n.ty - n.y) * 0.1
        n.alpha += (n.talpha - n.alpha) * 0.12
      }
      const sky = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
      sky.addColorStop(0, '#16140f')
      sky.addColorStop(1, BG)
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(camv.k, camv.k)
      ctx.translate(camv.x, camv.y)
      paint(ctx, graph, logos.current, sel, hover.current, query, now - t0, camv.k)
      ctx.restore()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [graph, sel, query])

  useEffect(() => {
    fitAll(cam.current, wrapRef.current, graph)
  }, [graph])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Escape') setSel(null)
      if (e.key === '0') fitAll(cam.current, wrapRef.current, graph)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [graph])

  function pick(ev: React.PointerEvent) {
    const c = canvasRef.current
    if (!c) return null
    const r = c.getBoundingClientRect()
    const { x: cx, y: cy, k } = cam.current
    const x = (ev.clientX - r.left - r.width / 2) / k - cx
    const y = (ev.clientY - r.top - r.height / 2) / k - cy
    let best: GNode | null = null
    let bestD = 999
    for (const n of graph.nodes) {
      if (n.alpha < 0.4) continue
      const d = Math.hypot(n.x - x, n.y - y)
      if (d < n.r + 10 / k && d < bestD) {
        best = n
        bestD = d
      }
    }
    return best
  }

  const selected = graph.byId.get(sel || '') || null
  const competitors = compsFrom(nodes, run.domain)

  function removeComp(id: string) {
    onChange(nodes.filter((n) => n.id !== id))
    if (sel === id) setSel(null)
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col bg-[#0c0b0a] text-[#f4efe6]">
      <div ref={wrapRef} className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => {
            cam.current.drag = true
            cam.current.moved = false
            cam.current.lx = e.clientX
            cam.current.ly = e.clientY
            ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            if (cam.current.drag) {
              const dx = e.clientX - cam.current.lx
              const dy = e.clientY - cam.current.ly
              if (Math.abs(dx) + Math.abs(dy) > 3) cam.current.moved = true
              cam.current.x += dx / cam.current.k
              cam.current.y += dy / cam.current.k
              cam.current.tx = cam.current.x
              cam.current.ty = cam.current.y
              cam.current.lx = e.clientX
              cam.current.ly = e.clientY
              setTip(null)
              return
            }
            const n = pick(e)
            hover.current = n?.id || null
            if (n && n.kind !== 'company') {
              const r = canvasRef.current!.getBoundingClientRect()
              setTip({ x: e.clientX - r.left + 14, y: e.clientY - r.top + 14, label: n.label, sub: n.sub })
            } else setTip(null)
          }}
          onPointerUp={(e) => {
            const moved = cam.current.moved
            cam.current.drag = false
            if (moved) return
            const n = pick(e)
            setSel(n ? n.id : null)
          }}
          onWheel={(e) => {
            e.preventDefault()
            const r = canvasRef.current!.getBoundingClientRect()
            const sx = e.clientX - r.left
            const sy = e.clientY - r.top
            const before = {
              x: (sx - r.width / 2) / cam.current.k - cam.current.x,
              y: (sy - r.height / 2) / cam.current.k - cam.current.y,
            }
            cam.current.k = Math.max(0.28, Math.min(3.2, cam.current.k * Math.exp(-e.deltaY * 0.0015)))
            cam.current.tk = cam.current.k
            const after = {
              x: (sx - r.width / 2) / cam.current.k - cam.current.x,
              y: (sy - r.height / 2) / cam.current.k - cam.current.y,
            }
            cam.current.x += after.x - before.x
            cam.current.y += after.y - before.y
            cam.current.tx = cam.current.x
            cam.current.ty = cam.current.y
          }}
          onDoubleClick={() => fitAll(cam.current, wrapRef.current, graph)}
        />
        {tip && (
          <div
            className="pointer-events-none absolute z-10 max-w-[240px] rounded-xl border border-white/10 bg-[#0c0b0a]/94 px-2.5 py-1.5 text-xs"
            style={{ left: tip.x, top: tip.y }}
          >
            <b className="block font-display">{tip.label}</b>
            {tip.sub && <span className="text-[#a39c92]">{tip.sub}</span>}
          </div>
        )}
        <aside className="absolute left-4 top-4 w-[300px] rounded-[18px] border border-white/10 bg-[#0c0b0a]/82 backdrop-blur-md p-4 max-md:w-auto max-md:right-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">market map</p>
          <h1 className="font-display font-extrabold text-[22px] leading-tight mt-1">The whole market, one map</h1>
          <p className="mt-1.5 text-[13px] text-[#a39c92]">
            Buyers asking right now, what the AI engines answer, your own channels, and every competitor with everything they run. Click anything.
          </p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a competitor, venue, question…"
            className="mt-3 w-full rounded-[10px] border border-white/10 bg-white/5 px-2.5 py-2 text-sm outline-none focus:border-white/30"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <FilterChip on={!filter} onClick={() => setFilter('')}>
              All
            </FilterChip>
            {SECTIONS.map((s) => (
              <FilterChip key={s.id} on={filter === `s:${s.id}`} color={s.color} onClick={() => setFilter(`s:${s.id}`)}>
                {s.short}
              </FilterChip>
            ))}
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">competitor lanes</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {LANES.map((l) => (
              <FilterChip key={l.id} on={filter === `l:${l.id}`} color={l.color} small onClick={() => setFilter(`l:${l.id}`)}>
                {l.label} <span className="text-[#6b6560]">{competitors.filter((c) => c.lane === l.id).length}</span>
              </FilterChip>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" className="text-[13px] font-bold text-[#f4efe6] border border-[rgba(232,195,106,.4)] bg-[rgba(232,195,106,.08)] rounded-full px-3 py-1" onClick={() => setSel('insights')}>
              Insights <span className="ml-1 rounded-full bg-[#e8c36a] text-[#0c0b0a] px-1.5 text-[11px]">{SHOWN_INSIGHTS.length}</span>
            </button>
            <button type="button" className="text-xs text-[#a39c92] border border-white/10 rounded-full px-3 py-1" onClick={() => fitAll(cam.current, wrapRef.current, graph)}>
              Fit
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#6b6560]">Drag to pan · scroll to zoom · Esc closes · 0 fits</p>
        </aside>
        <aside className={`absolute right-4 top-4 bottom-4 w-[380px] overflow-y-auto rounded-[18px] border border-white/10 bg-[#141210]/92 backdrop-blur-md p-4 max-md:left-4 max-md:top-auto max-md:h-[42%] max-md:w-auto ${sel ? '' : 'max-md:hidden'}`}>
          <Drawer
            run={run}
            selected={selected}
            sel={sel}
            competitors={competitors}
            onGo={setSel}
            onRemove={removeComp}
          />
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-[#a39c92] mb-3">Ads stay untouched until you confirm.</p>
            <button
              type="button"
              disabled={confirming}
              className="btn-accent w-full"
              onClick={() => onConfirm(competitors.map((c) => c.id))}
            >
              {confirming ? 'Starting research…' : 'Create Ads'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function FilterChip({
  on,
  color,
  small,
  onClick,
  children,
}: {
  on?: boolean
  color?: string
  small?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ['--c' as string]: color || '#fff' }}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${small ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${
        on ? 'text-[#f4efe6] bg-white/10 border-white/25' : 'text-[#a39c92] border-white/10'
      }`}
    >
      {color && <i className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

function Drawer({
  run,
  selected,
  sel,
  competitors,
  onGo,
  onRemove,
}: {
  run: Run
  selected: GNode | null
  sel: string | null
  competitors: Comp[]
  onGo: (id: string | null) => void
  onRemove: (id: string) => void
}) {
  if (sel === 'insights' || !selected) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">insights · {SHOWN_INSIGHTS.length} from this map</p>
        <h2 className="font-display font-extrabold text-xl leading-tight inline-flex items-center gap-2">
          Create
          <svg className="w-[1.15em] h-[1.15em] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.997 2.9 6.046 6.046 0 0 0 .742 7.096 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.984 5.984 0 0 0 13.26 24a6.055 6.055 0 0 0 5.772-4.205 5.99 5.99 0 0 0 3.997-2.9 6.055 6.055 0 0 0-.747-7.074zM13.26 22.43a4.475 4.475 0 0 1-2.876-1.04l.141-.08 4.778-2.758a.795.795 0 0 0 .392-.681v-6.736l2.02 1.168a.071.071 0 0 1 .038.052v5.582a4.504 4.504 0 0 1-4.493 4.493zM3.6 18.304a4.47 4.47 0 0 1-.535-3.013l.141.085 4.783 2.758a.771.771 0 0 0 .78 0l5.842-3.368v2.332a.08.08 0 0 1-.033.061L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.348a4.482 4.482 0 0 1 2.365-1.972V11.6a.766.766 0 0 0 .388.676l5.814 3.354-2.02 1.168a.075.075 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.596 3.777-5.83-3.387 2.021-1.168a.075.075 0 0 1 .071 0l4.83 2.787a4.494 4.494 0 0 1-.675 8.104v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.773-2.781a.775.775 0 0 0-.785 0L9.409 9.6V7.268a.066.066 0 0 1 .028-.061l4.83-2.786a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.021-1.163a.08.08 0 0 1-.038-.057V6.074a4.499 4.499 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.68zm1.097-2.365 2.602-1.499 2.607 1.499v2.999l-2.597 1.499-2.606-1.499z" />
          </svg>
          Ads
        </h2>
        <p className="text-sm text-[#a39c92]">Ranked by impact. Every card points at the place on the map it came from.</p>
        <div className="space-y-2">
          {SHOWN_INSIGHTS.map((i) => (
            <button
              key={i.title}
              type="button"
              onClick={() => onGo(i.go)}
              className="block w-full text-left rounded-xl border border-white/10 bg-white/[0.03] p-3"
              style={{ borderLeftWidth: 3, borderLeftColor: KIND[i.kind][1] }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: KIND[i.kind][1] }}>
                {KIND[i.kind][0]}
              </span>
              <b className="block font-display mt-1 leading-snug">{i.title}</b>
              <p className="text-sm text-[#a39c92] mt-1">{i.why}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (selected.kind === 'company') {
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">brief · {run.domain}</p>
        <div className="flex items-center gap-2">
          <img src="/superagent-logo.png" alt="" className="w-9 h-9 rounded-lg" />
          <div>
            <h2 className="font-display font-extrabold text-xl leading-tight">{run.brand.name}</h2>
            <p className="text-xs text-[#a39c92]">{run.brand.category}</p>
          </div>
        </div>
        <p className="text-sm text-[#a39c92]">{run.brand.one_liner}</p>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className="chip border-white/10" onClick={() => onGo('s:' + s.id)}>
              {s.short}
            </button>
          ))}
        </div>
      </div>
    )
  }
  if (selected.kind === 'section') {
    const s = SECTIONS.find((x) => x.id === selected.section)
    const groups = selected.section === 'competitors' ? competitors : []
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">{s?.label}</p>
        <h2 className="font-display font-extrabold text-xl">{s?.label}</h2>
        <p className="text-sm text-[#a39c92]">{s?.note}</p>
        {s?.id === 'competitors' && (
          <div className="space-y-2">
            {LANES.map((l) => (
              <p key={l.id} className="text-sm">
                <b style={{ color: l.color }}>{l.label}</b>
                <span className="text-[#a39c92]"> — {l.note}</span>
              </p>
            ))}
            <ul className="text-sm space-y-1.5 pt-2">
              {groups.map((c) => (
                <li key={c.id}>
                  <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => onGo(c.id)}>
                    <img src={favicon(c.domain)} alt="" className="w-4 h-4 rounded-sm bg-white" />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-[#6b6560]">{c.domain}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {s?.id === 'buyers' && (
          <ul className="text-sm space-y-1.5">
            {VENUES.map((v) => (
              <li key={v.id}>
                <button type="button" className="underline underline-offset-2" onClick={() => onGo('v:' + v.id)}>
                  {v.label}
                </button>
                <span className="text-[#6b6560]"> · {v.filed} filed</span>
              </li>
            ))}
          </ul>
        )}
        {s?.id === 'answers' && (
          <ul className="text-sm space-y-2">
            {PROMPTS.map((p) => (
              <li key={p.id}>
                <button type="button" className="text-left" onClick={() => onGo(p.id)}>
                  “{p.text}”
                </button>
              </li>
            ))}
          </ul>
        )}
        {s?.id === 'you' && (
          <ul className="text-sm space-y-1.5">
            {YOU.map((y) => (
              <li key={y.id} className="flex justify-between">
                <span>{CHANNELS[y.id].label}</span>
                <span className="text-[#6b6560]">{y.gap ? 'gap' : 'running'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  if (selected.comp) {
    const c = selected.comp
    const lane = LANES.find((l) => l.id === c.lane)
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: lane?.color }}>
          {lane?.label} · {c.price}
        </p>
        <div className="flex items-center gap-2">
          <img src={favicon(c.domain)} alt="" className="w-8 h-8 rounded-full bg-white" />
          <div>
            <h2 className="font-display font-extrabold text-xl leading-tight">{c.name}</h2>
            <a href={`https://${c.domain}`} target="_blank" rel="noreferrer" className="text-xs text-[#a39c92] underline">
              {c.domain}
            </a>
          </div>
        </div>
        <p className="text-sm italic text-[#f4efe6]/90">“{c.tag}”</p>
        <p className="text-sm text-[#a39c92]">
          <b className="text-[#f4efe6]">vs SUPERAGENT.</b> {c.vs}
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">Where they market</p>
        <div className="flex flex-wrap gap-2">
          {c.channels.map((ch) => (
            <span key={ch} className="chip border-white/10 normal-case">
              {CHANNELS[ch].label}
            </span>
          ))}
        </div>
        {!!c.hooks.length && (
          <ul className="text-sm text-[#a39c92] list-disc pl-4 space-y-1">
            {c.hooks.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <button type="button" className="text-sm text-[#f07167]" onClick={() => onRemove(c.id)}>
          Remove from map
        </button>
      </div>
    )
  }
  if (selected.venue) {
    const ts = THREADS.filter((t) => t.venue === selected.venue!.id)
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">venue · standing {selected.venue.standing}</p>
        <h2 className="font-display font-extrabold text-xl">{selected.venue.label}</h2>
        <p className="text-sm text-[#a39c92]">Threads where a buyer is asking right now. Score is closeness to a buying question.</p>
        <div className="space-y-2">
          {ts.map((t) => (
            <article key={t.title} className="rounded-xl border border-white/10 p-3">
              <div className="flex gap-2">
                <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 font-display font-extrabold text-sm flex items-center justify-center shrink-0">{t.score}</span>
                <div>
                  <p className="font-semibold leading-snug">{t.title}</p>
                  <p className="text-xs text-[#6b6560]">
                    {t.author} · {t.age} · {t.intent}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#a39c92] mt-2">{t.snippet}</p>
            </article>
          ))}
        </div>
      </div>
    )
  }
  if (selected.prompt) {
    const p = selected.prompt
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">buyer question · {p.intent}</p>
        <h2 className="font-display font-extrabold text-lg leading-snug">“{p.text}”</h2>
        {p.results.map((r) => {
          const e = ENGINES[r.engine as keyof typeof ENGINES]
          return (
            <article key={r.engine} className="rounded-xl border border-white/10 p-3" style={{ borderLeftWidth: 3, borderLeftColor: r.named ? '#6ee7b7' : '#f07167' }}>
              <p className="font-bold">{e.label}</p>
              <p className="text-xs text-[#6b6560]">{r.named ? 'names SUPERAGENT' : 'does not name SUPERAGENT'}</p>
              <p className="text-sm text-[#a39c92] mt-1">{r.excerpt}</p>
              <p className="text-xs text-[#6b6560] mt-2">{r.brands.join(' · ')}</p>
            </article>
          )
        })}
      </div>
    )
  }
  if (selected.chan) {
    const ch = CHANNELS[selected.chan]
    const running = competitors.filter((c) => c.channels.includes(selected.chan!))
    return (
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b6560]">{selected.comp ? selected.comp.name : 'your channel'}</p>
        <h2 className="font-display font-extrabold text-xl">{ch.label}</h2>
        <p className="text-sm text-[#a39c92]">{selected.sub}</p>
        {selected.gap && (
          <ul className="text-sm space-y-1.5">
            {running.map((c) => (
              <li key={c.id}>
                <button type="button" className="underline underline-offset-2" onClick={() => onGo(c.id)}>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
  return <p className="text-sm text-[#a39c92]">Click a node. Confirm when the competitor half looks right.</p>
}

function blank(): Pick<GNode, 'x' | 'y' | 'tx' | 'ty' | 'a' | 'alpha' | 'talpha'> {
  return { x: 0, y: 0, tx: 0, ty: 0, a: 0, alpha: 0, talpha: 1 }
}

function buildGraph(comps: Comp[]) {
  const nodes: GNode[] = []
  const byId = new Map<string, GNode>()
  const mk = (n: Omit<GNode, 'x' | 'y' | 'tx' | 'ty' | 'a' | 'alpha' | 'talpha'>) => {
    const full = { ...blank(), ...n }
    nodes.push(full)
    byId.set(full.id, full)
    return full
  }
  mk({ id: 'company', kind: 'company', label: 'SUPERAGENT', color: GOLD, r: 34, domain: 'getsuperagent.com' })
  for (const s of SECTIONS) mk({ id: 's:' + s.id, kind: 'section', section: s.id, label: s.label, color: s.color, r: 24, icon: s.icon })
  for (const c of comps) {
    const lane = LANES.find((l) => l.id === c.lane) || LANES[0]
    mk({ id: c.id, kind: 'group', section: 'competitors', lane: c.lane, label: c.name, color: lane.color, r: 13, sub: `${c.channels.length} channels · ${c.price}`, domain: c.domain, comp: c })
    for (const ch of c.channels) {
      mk({ id: `${c.id}:${ch}`, kind: 'leaf', section: 'competitors', parent: c.id, label: CHANNELS[ch].label, color: CHANNELS[ch].color, r: 8, chan: ch, comp: c })
    }
  }
  for (const v of VENUES) {
    mk({ id: 'v:' + v.id, kind: 'group', section: 'buyers', label: v.label, color: v.color, r: 13, sub: `${v.filed} filed · standing ${v.standing}`, venue: v, icon: v.icon })
    THREADS.filter((t) => t.venue === v.id).forEach((t, i) => {
      mk({ id: `t:${v.id}:${i}`, kind: 'leaf', section: 'buyers', parent: 'v:' + v.id, label: t.title, color: t.score > 80 ? '#6ee7b7' : GOLD, r: 8, thread: t, sub: t.status })
    })
  }
  for (const p of PROMPTS) {
    const named = p.results.filter((r) => r.named).length
    mk({ id: p.id, kind: 'group', section: 'answers', label: p.text, color: named ? '#6ee7b7' : '#f07167', r: 13, sub: named ? `SUPERAGENT named by ${named} / 3` : 'not named', prompt: p })
    for (const r of p.results) {
      const e = ENGINES[r.engine as keyof typeof ENGINES]
      mk({ id: `${p.id}:${r.engine}`, kind: 'leaf', section: 'answers', parent: p.id, label: e.label, color: r.named ? '#6ee7b7' : '#f07167', r: 8, engine: r.engine, prompt: p, sub: r.named ? 'names SUPERAGENT' : r.brands.slice(0, 2).join(', ') })
    }
  }
  for (const y of YOU) {
    const ch = CHANNELS[y.id]
    mk({ id: 'you:' + y.id, kind: 'group', section: 'you', label: ch.label, color: y.gap ? DIM : ch.color, r: 13, sub: y.sub, chan: y.id, gap: y.gap })
  }
  const kids = new Map<string, GNode[]>()
  for (const n of nodes) {
    if (!n.parent) continue
    if (!kids.has(n.parent)) kids.set(n.parent, [])
    kids.get(n.parent)!.push(n)
  }
  return { nodes, byId, kids, arcs: [] as { kind: string; color: string; label?: string; a0: number; a1: number; mid: number; section?: string; lane?: string }[], R0: 150, R1: 300, R2: 480 }
}

function applyFilter(graph: ReturnType<typeof buildGraph>, filter: string) {
  const f = !filter ? null : filter.startsWith('s:') ? { section: filter.slice(2) } : { lane: filter.slice(2) }
  const secs = SECTIONS.filter((s) => !f || f.section === s.id || (f.lane && s.id === 'competitors'))
  const groupsOf = (s: (typeof SECTIONS)[number]) =>
    graph.nodes.filter((n) => n.kind === 'group' && n.section === s.id && (!f?.lane || n.lane === f.lane))
  const plan = secs.map((s) => {
    const groups = groupsOf(s)
    const subs = s.id === 'competitors' ? LANES.map((l) => groups.filter((g) => g.lane === l.id)).filter((g) => g.length) : [groups]
    return { s, groups, subs, units: groups.length + subs.length * 1 }
  })
  const spans = new Map<string, [number, number, number]>()
  const right = plan.filter((p) => p.s.side === 'right')
  const left = plan.filter((p) => p.s.side === 'left')
  const half = (list: typeof plan, from: number, total: number) => {
    const u = list.reduce((a, p) => a + p.units, 0) || 1
    let a = from
    for (const p of list) {
      const sp = (total * p.units) / u
      spans.set(p.s.id, [a, sp, 1])
      a += sp
    }
  }
  if (left.length && right.length) {
    half(right, -Math.PI / 2, Math.PI)
    half(left, Math.PI / 2, Math.PI)
    for (const p of left) {
      const v = spans.get(p.s.id)!
      spans.set(p.s.id, [v[0] + v[1], v[1], -1])
    }
  } else half(plan, -Math.PI / 2, TAU)
  const units = plan.map((p) => spans.get(p.s.id)![1] / p.units)
  graph.R1 = Math.max(250, ...units.map((u) => 30 / u))
  let need = graph.R1 + 160
  plan.forEach((p, i) => {
    for (const g of p.groups) {
      const k = (graph.kids.get(g.id) || []).length
      if (!k) continue
      const rings = k <= 3 ? 1 : k <= 6 ? 2 : 3
      const per = Math.ceil(k / rings)
      need = Math.max(need, (24 * (per - 1)) / (0.82 * units[i]))
    }
  })
  graph.R2 = need
  graph.arcs = []
  const shown = new Set<string>()
  plan.forEach((p, i) => {
    const [start, span, dir] = spans.get(p.s.id)!
    const unit = units[i]
    const hub = graph.byId.get('s:' + p.s.id)!
    const mid = start + (span / 2) * dir
    hub.a = mid
    hub.tx = Math.cos(mid) * graph.R0
    hub.ty = Math.sin(mid) * graph.R0
    hub.talpha = 1
    shown.add(hub.id)
    graph.arcs.push({ kind: 'section', color: p.s.color, section: p.s.id, a0: Math.min(start, start + span * dir), a1: Math.max(start, start + span * dir), mid })
    let a = start
    for (const sub of p.subs) {
      a += (unit * dir) / 2
      const s0 = a
      for (const g of sub) {
        g.a = a + (unit / 2) * dir
        g.tx = Math.cos(g.a) * graph.R1
        g.ty = Math.sin(g.a) * graph.R1
        g.talpha = 1
        shown.add(g.id)
        const ch = graph.kids.get(g.id) || []
        const k = ch.length
        const rings = k <= 3 ? 1 : k <= 6 ? 2 : 3
        const sp = unit * 0.82
        ch.forEach((m, j) => {
          const t = k === 1 ? 0.5 : j / (k - 1)
          m.a = g.a - sp / 2 + sp * t
          const rr = graph.R2 + (j % rings) * 34
          m.tx = Math.cos(m.a) * rr
          m.ty = Math.sin(m.a) * rr
          m.talpha = 1
          shown.add(m.id)
        })
        a += unit * dir
      }
      if (p.s.id === 'competitors' && sub[0]?.lane) {
        const l = LANES.find((x) => x.id === sub[0].lane)!
        graph.arcs.push({ kind: 'lane', color: l.color, label: l.label, lane: l.id, a0: Math.min(s0, a), a1: Math.max(s0, a), mid: (s0 + a) / 2 })
      }
      a += (unit * dir) / 2
    }
  })
  for (const n of graph.nodes) {
    if (n.kind === 'company' || shown.has(n.id)) continue
    n.talpha = 0
    const p = n.parent ? graph.byId.get(n.parent) : n.kind === 'group' ? graph.byId.get('s:' + n.section) : null
    if (p) {
      n.tx = p.tx
      n.ty = p.ty
    }
  }
}

function fitAll(cam: { tx: number; ty: number; tk: number }, wrap: HTMLDivElement | null, graph: ReturnType<typeof buildGraph>) {
  if (!wrap) return
  const w = wrap.clientWidth
  const h = wrap.clientHeight
  const dw = w > 700 ? 200 : 0
  cam.tk = Math.max(0.32, Math.min(1.05, Math.min((w - dw) / (2 * (graph.R2 + 200)), h / (2 * (graph.R2 + 170)))))
  cam.tx = -dw / 2 / cam.tk
  cam.ty = 0
}

function paint(
  ctx: CanvasRenderingContext2D,
  graph: ReturnType<typeof buildGraph>,
  cache: Map<string, HTMLImageElement>,
  sel: string | null,
  hoverId: string | null,
  query: string,
  t: number,
  k: number,
) {
  const q = query.trim().toLowerCase()
  const hot = new Set<string>()
  const add = (id: string | null) => {
    const n = id ? graph.byId.get(id) : null
    if (!n) return
    hot.add(n.id)
    hot.add('company')
    if (n.kind === 'section') graph.nodes.filter((m) => m.kind === 'group' && m.section === n.section).forEach((m) => hot.add(m.id))
    if (n.kind === 'group') {
      hot.add('s:' + n.section)
      ;(graph.kids.get(n.id) || []).forEach((m) => hot.add(m.id))
    }
    if (n.kind === 'leaf') {
      if (n.parent) hot.add(n.parent)
      hot.add('s:' + n.section)
    }
    if (n.kind === 'company') SECTIONS.forEach((s) => hot.add('s:' + s.id))
  }
  add(sel)
  add(hoverId)
  const dim = hot.size > 0
  const matches = (n: GNode) => {
    if (!q) return true
    const g = n.kind === 'leaf' && n.parent ? graph.byId.get(n.parent) : n
    return (g?.label || '').toLowerCase().includes(q) || (g?.domain || '').includes(q)
  }

  for (const ar of graph.arcs) {
    if (ar.kind === 'section') {
      const lit = !dim || [...hot].some((id) => graph.byId.get(id)?.section === ar.section)
      ctx.beginPath()
      ctx.arc(0, 0, graph.R2 + 100, ar.a0 + 0.01, ar.a1 - 0.01)
      ctx.arc(0, 0, graph.R0 + 40, ar.a1 - 0.01, ar.a0 + 0.01, true)
      ctx.closePath()
      ctx.fillStyle = ar.color
      ctx.globalAlpha = lit ? 0.04 : 0.015
      ctx.fill()
      ctx.globalAlpha = 1
    } else {
      const lit = !dim || [...hot].some((id) => graph.byId.get(id)?.lane === ar.lane)
      ctx.beginPath()
      ctx.arc(0, 0, graph.R1 - 40, ar.a0 + 0.01, ar.a1 - 0.01)
      ctx.strokeStyle = ar.color
      ctx.lineWidth = 2 / k
      ctx.globalAlpha = lit ? 0.55 : 0.18
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.save()
      ctx.translate(Math.cos(ar.mid) * (graph.R2 + 108), Math.sin(ar.mid) * (graph.R2 + 108))
      let rot = ar.mid + Math.PI / 2
      if (Math.sin(ar.mid) > 0) rot += Math.PI
      ctx.rotate(rot)
      ctx.font = `700 11px ${FONT}`
      ctx.textAlign = 'center'
      ctx.fillStyle = ar.color
      ctx.globalAlpha = lit ? 0.9 : 0.35
      ctx.fillText((ar.label || '').toUpperCase().split('').join(' '), 0, 0)
      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  const parentOf = (n: GNode) => graph.byId.get(n.parent || (n.kind === 'group' ? 's:' + n.section : 'company'))
  for (const n of graph.nodes) {
    if (n.kind === 'company' || n.alpha < 0.02) continue
    const p = parentOf(n)
    if (!p) continue
    const lit = (!dim || (hot.has(n.id) && hot.has(p.id))) && matches(n)
    ctx.strokeStyle = n.color
    ctx.globalAlpha = n.alpha * (lit ? (n.kind === 'section' ? 0.7 : n.kind === 'group' ? 0.4 : 0.55) : 0.06)
    ctx.lineWidth = (n.kind === 'section' ? 3 : n.kind === 'group' ? 1.5 : 1.1) / k
    if (n.gap) ctx.setLineDash([4 / k, 4 / k])
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    if (n.kind === 'leaf') {
      const pr = Math.hypot(p.x, p.y)
      const nr = Math.hypot(n.x, n.y)
      const mid = (pr + nr) / 2
      const pa = Math.atan2(p.y, p.x)
      ctx.bezierCurveTo(Math.cos(pa) * mid, Math.sin(pa) * mid, Math.cos(n.a) * (mid + 20), Math.sin(n.a) * (mid + 20), n.x, n.y)
    } else {
      ctx.quadraticCurveTo(p.x + (n.x - p.x) * 0.45 - (n.y - p.y) * 0.08, p.y + (n.y - p.y) * 0.45 + (n.x - p.x) * 0.08, n.x, n.y)
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  for (const n of graph.nodes) {
    if (n.kind !== 'leaf' || n.alpha < 0.02) continue
    const isHot = hot.has(n.id)
    const lit = (!dim || isHot) && matches(n)
    ctx.globalAlpha = n.alpha * (lit ? 1 : 0.2)
    const s = isHot ? 20 : 14
    if (n.chan) badge(ctx, cache, n.x, n.y, s, { shape: 'square', bg: CHANNELS[n.chan].color, fg: CHANNELS[n.chan].ink, icon: CHANNELS[n.chan].icon, ring: sel === n.id ? INK : null })
    else if (n.engine) badge(ctx, cache, n.x, n.y, s, { shape: 'circle', bg: ENGINES[n.engine as keyof typeof ENGINES].color, fg: ENGINES[n.engine as keyof typeof ENGINES].ink, icon: n.engine, ring: sel === n.id ? INK : n.color })
    else badge(ctx, cache, n.x, n.y, s, { shape: 'circle', bg: n.color, icon: 'bubble', ring: sel === n.id ? INK : null })
    ctx.globalAlpha = 1
  }
  for (const n of graph.nodes) {
    if (n.kind !== 'group' || n.alpha < 0.02) continue
    const isHot = hot.has(n.id)
    const lit = (!dim || isHot) && matches(n)
    ctx.globalAlpha = n.alpha * (lit ? 1 : 0.25)
    const s = n.r * 2 + 2
    if (n.comp) badge(ctx, cache, n.x, n.y, s, { shape: 'circle', bg: '#141210', fg: n.color, icon: n.comp.name[0], ring: sel === n.id ? INK : n.color, domain: n.comp.domain })
    else if (n.venue) badge(ctx, cache, n.x, n.y, s, { shape: 'circle', bg: n.venue.color, icon: n.venue.icon, ring: sel === n.id ? INK : null })
    else if (n.prompt) badge(ctx, cache, n.x, n.y, s, { shape: 'circle', bg: n.color, icon: 'sparkle', ring: sel === n.id ? INK : null })
    else badge(ctx, cache, n.x, n.y, s, { shape: 'square', bg: n.gap ? DIM : CHANNELS[n.chan || 'meta'].color, fg: CHANNELS[n.chan || 'meta'].ink, icon: CHANNELS[n.chan || 'meta'].icon, dashed: n.gap, ring: sel === n.id ? INK : null })
    radialText(ctx, n.prompt ? n.label.slice(0, 28) + (n.label.length > 28 ? '…' : '') : n.label, n.a, graph.R1 + n.r + 6, { pill: true, color: lit ? INK : '#8a837a' })
    ctx.globalAlpha = 1
  }
  for (const n of graph.nodes) {
    if (n.kind !== 'section' || n.alpha < 0.02) continue
    const lit = !dim || hot.has(n.id)
    ctx.globalAlpha = n.alpha * (lit ? 1 : 0.35)
    badge(ctx, cache, n.x, n.y, n.r * 2, { shape: 'circle', bg: n.color, icon: n.icon, ring: sel === n.id ? INK : null, ringW: 3 })
    const left = Math.cos(n.a) < -0.2
    const below = Math.abs(Math.cos(n.a)) <= 0.2
    ctx.font = `800 13px ${FONT}`
    ctx.textAlign = below ? 'center' : left ? 'right' : 'left'
    ctx.textBaseline = 'middle'
    const lx = below ? n.x : n.x + (left ? -1 : 1) * (n.r + 8)
    const ly = below ? n.y + (Math.sin(n.a) > 0 ? n.r + 12 : -n.r - 12) : n.y
    ctx.fillStyle = INK
    ctx.fillText(n.label, lx, ly)
    ctx.globalAlpha = 1
  }
  const pulse = 1 + Math.sin(t / 900) * 0.04
  ctx.beginPath()
  ctx.arc(0, 0, 34 * 1.8 * pulse, 0, TAU)
  ctx.fillStyle = GOLD
  ctx.globalAlpha = 0.08
  ctx.fill()
  ctx.globalAlpha = 1
  badge(ctx, cache, 0, 0, 68, { shape: 'circle', bg: GOLD, icon: 'sparkle', ring: sel === 'company' ? INK : null, ringW: 3, domain: 'getsuperagent.com' })
  ctx.fillStyle = INK
  ctx.font = `800 15px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText('superagent', 0, 50)
  ctx.fillStyle = MUT
  ctx.font = `500 10px ${FONT}`
  ctx.fillText('the brief · click', 0, 64)
}

function radialText(ctx: CanvasRenderingContext2D, text: string, a: number, r: number, o: { pill?: boolean; color: string }) {
  const flip = Math.cos(a) < 0
  ctx.save()
  ctx.translate(Math.cos(a) * r, Math.sin(a) * r)
  ctx.rotate(flip ? a + Math.PI : a)
  ctx.textAlign = flip ? 'right' : 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `700 13px ${FONT}`
  const wd = ctx.measureText(text).width
  if (o.pill) {
    ctx.fillStyle = BG
    ctx.globalAlpha *= 0.85
    ctx.beginPath()
    ctx.roundRect(flip ? -wd - 6 : -6, -9, wd + 12, 18, 9)
    ctx.fill()
    ctx.globalAlpha /= 0.85
  }
  ctx.fillStyle = o.color
  ctx.fillText(text, 0, 0)
  ctx.restore()
}
