/* "<company> demo": one radial map with four branches.
 *   right: buyers asking · AI answers · your channels
 *   left:  competitors (by lane) and every channel they market on
 * Click anything to open it. Everything drawn on canvas; icons are drawn
 * too, so the same icon renders on the map and in the drawer. */
(() => {
  const D = window.DEMO
  const BG = '#0c0b0a', INK = '#f4efe6', GOLD = '#e8c36a', DIM = '#6b6560', MUT = '#a39c92'
  const FONT = '"Hanken Grotesk", system-ui, sans-serif'
  const TAU = Math.PI * 2
  const laneById = Object.fromEntries(D.lanes.map((l) => [l.id, l]))
  const secById = Object.fromEntries(D.sections.map((s) => [s.id, s]))
  const compById = Object.fromEntries(D.competitors.map((c) => [c.id, c]))
  const venueById = Object.fromEntries(D.venues.map((v) => [v.id, v]))
  const $ = (s) => document.querySelector(s)
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const nl = (s) => esc(s).replace(/\n/g, '<br>')
  const STATUS = { draft: ['#e8c36a', 'draft · waiting for you'], approved: ['#6ee7b7', 'approved · posting'], posted: ['#7eb8e8', 'posted'], skipped: ['#6b6560', 'skipped'] }
  const CH_ICON = { x: 'x', linkedin: 'linkedin', founders: 'person', meta: 'meta', google: 'google', reddit: 'reddit', ph: 'P', youtube: 'play', blog: 'pen', newsletter: 'mail', affiliates: '%', dev: 'DEV', threads: '@' }

  // ---- icons (canvas) --------------------------------------------------------
  const PATHS = {
    x: new Path2D('M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'),
    linkedin: new Path2D('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z'),
  }
  function drawIcon(c, name, s, fg) {
    const k = s / 24
    c.fillStyle = fg; c.strokeStyle = fg; c.lineCap = 'round'; c.lineJoin = 'round'
    c.textAlign = 'center'; c.textBaseline = 'middle'
    if (PATHS[name]) { c.save(); c.scale(k * 0.62, k * 0.62); c.translate(-12, -12); c.fill(PATHS[name]); c.restore(); return }
    switch (name) {
      case 'meta': { c.lineWidth = 2.6 * k; c.beginPath(); for (let i = 0; i <= 40; i++) { const t = (i / 40) * TAU; const d = 1 + Math.sin(t) ** 2; const x = (8 * k * Math.cos(t)) / d, y = (8 * k * Math.sin(t) * Math.cos(t)) / d; i ? c.lineTo(x, y) : c.moveTo(x, y) } c.closePath(); c.stroke(); return }
      case 'google': { const r = 6.5 * k; c.lineWidth = 3 * k; const arc = (a0, a1, col) => { c.beginPath(); c.strokeStyle = col; c.arc(0, 0, r, a0, a1); c.stroke() }; arc(-2.6, -1.2, '#ea4335'); arc(-1.2, 0.0, '#fbbc05'); arc(0.0, 0.9, '#34a853'); arc(2.2, 2.6, '#4285f4'); c.beginPath(); c.strokeStyle = '#4285f4'; c.moveTo(0, 0); c.lineTo(r + 1.4 * k, 0); c.stroke(); return }
      case 'reddit': { c.beginPath(); c.ellipse(0, 1.5 * k, 8 * k, 6 * k, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(0, -6.5 * k, 2 * k, 0, TAU); c.fill(); c.lineWidth = 1.4 * k; c.beginPath(); c.moveTo(0, -4.5 * k); c.lineTo(3 * k, -9 * k); c.stroke(); c.fillStyle = BG; c.beginPath(); c.arc(-3 * k, 1 * k, 1.5 * k, 0, TAU); c.arc(3 * k, 1 * k, 1.5 * k, 0, TAU); c.fill(); c.strokeStyle = BG; c.lineWidth = 1.2 * k; c.beginPath(); c.arc(0, 2.5 * k, 3.2 * k, 0.3, Math.PI - 0.3); c.stroke(); return }
      case 'play': { c.beginPath(); c.moveTo(-4.5 * k, -6 * k); c.lineTo(7 * k, 0); c.lineTo(-4.5 * k, 6 * k); c.closePath(); c.fill(); return }
      case 'pen': { c.save(); c.rotate(-Math.PI / 4); c.beginPath(); c.roundRect(-2.4 * k, -8 * k, 4.8 * k, 11 * k, 1.5 * k); c.fill(); c.beginPath(); c.moveTo(-2.4 * k, 4 * k); c.lineTo(2.4 * k, 4 * k); c.lineTo(0, 8.5 * k); c.closePath(); c.fill(); c.restore(); return }
      case 'mail': { c.lineWidth = 2 * k; c.beginPath(); c.roundRect(-8 * k, -5.5 * k, 16 * k, 11 * k, 2 * k); c.stroke(); c.beginPath(); c.moveTo(-7 * k, -4 * k); c.lineTo(0, 1.5 * k); c.lineTo(7 * k, -4 * k); c.stroke(); return }
      case 'person': { c.beginPath(); c.arc(0, -3.5 * k, 3.6 * k, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 7 * k, 7.5 * k, Math.PI, TAU); c.fill(); return }
      case 'bubble': { c.beginPath(); c.roundRect(-8.5 * k, -7 * k, 17 * k, 12.5 * k, 4 * k); c.fill(); c.beginPath(); c.moveTo(-5 * k, 4.5 * k); c.lineTo(-6 * k, 9 * k); c.lineTo(-1 * k, 5 * k); c.fill(); return }
      case 'bubble?': { drawIcon(c, 'bubble', s, fg); c.fillStyle = BG; c.font = `800 ${11 * k}px ${FONT}`; c.fillText('?', 0, -0.5 * k); return }
      case 'sparkle': { c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2; const r = i % 2 ? 3.2 * k : 9 * k; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r) } c.closePath(); c.fill(); return }
      case 'flag': { c.lineWidth = 2.2 * k; c.beginPath(); c.moveTo(-6 * k, -9 * k); c.lineTo(-6 * k, 9 * k); c.stroke(); c.beginPath(); c.moveTo(-5 * k, -8 * k); c.lineTo(8 * k, -4.5 * k); c.lineTo(-5 * k, -1 * k); c.closePath(); c.fill(); return }
      case 'target': { c.lineWidth = 2 * k; c.beginPath(); c.arc(0, 0, 8.5 * k, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 4.8 * k, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 1.6 * k, 0, TAU); c.fill(); return }
      case 'chatgpt': { for (let i = 0; i < 6; i++) { c.save(); c.rotate((i / 6) * TAU); c.beginPath(); c.roundRect(-1.5 * k, -8.5 * k, 3 * k, 7 * k, 1.5 * k); c.fill(); c.restore() } return }
      case 'claude': { c.lineWidth = 2.2 * k; for (let i = 0; i < 8; i++) { c.save(); c.rotate((i / 8) * TAU); c.beginPath(); c.moveTo(0, -2.5 * k); c.lineTo(0, -8.5 * k); c.stroke(); c.restore() } return }
      case 'perplexity': { c.lineWidth = 2 * k; c.save(); c.rotate(Math.PI / 4); c.beginPath(); c.rect(-5.5 * k, -5.5 * k, 11 * k, 11 * k); c.stroke(); c.restore(); c.beginPath(); c.moveTo(0, -8 * k); c.lineTo(0, 8 * k); c.moveTo(-8 * k, 0); c.lineTo(8 * k, 0); c.stroke(); return }
      case 'layers': { c.lineWidth = 2 * k; for (const dy of [4, 0, -4]) { c.beginPath(); c.moveTo(-8 * k, dy * k); c.lineTo(0, (dy - 4.5) * k); c.lineTo(8 * k, dy * k); c.lineTo(0, (dy + 4.5) * k); c.closePath(); if (dy === -4) c.fill(); else c.stroke() } return }
      case 'link': { c.lineWidth = 2.4 * k; c.save(); c.rotate(-Math.PI / 4); c.beginPath(); c.roundRect(-9 * k, -3 * k, 10 * k, 6 * k, 3 * k); c.stroke(); c.beginPath(); c.roundRect(-1 * k, -3 * k, 10 * k, 6 * k, 3 * k); c.stroke(); c.restore(); return }
      case 'share': { c.lineWidth = 1.8 * k; c.beginPath(); c.moveTo(5 * k, -5 * k); c.lineTo(-5 * k, 0); c.lineTo(5 * k, 5 * k); c.stroke(); for (const [x, y] of [[5, -5], [-5, 0], [5, 5]]) { c.beginPath(); c.arc(x * k, y * k, 2.6 * k, 0, TAU); c.fill() } return }
      case 'globe': { c.lineWidth = 1.8 * k; c.beginPath(); c.arc(0, 0, 8.5 * k, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, 0, 3.6 * k, 8.5 * k, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-8.5 * k, 0); c.lineTo(8.5 * k, 0); c.moveTo(-7.5 * k, -4 * k); c.lineTo(7.5 * k, -4 * k); c.moveTo(-7.5 * k, 4 * k); c.lineTo(7.5 * k, 4 * k); c.stroke(); return }
      case 'page': { c.beginPath(); c.moveTo(-6 * k, -8 * k); c.lineTo(2.5 * k, -8 * k); c.lineTo(6 * k, -4.5 * k); c.lineTo(6 * k, 8 * k); c.lineTo(-6 * k, 8 * k); c.closePath(); c.fill(); c.strokeStyle = BG; c.lineWidth = 1.3 * k; c.beginPath(); for (const y of [-1, 2, 5]) { c.moveTo(-3.5 * k, y * k); c.lineTo(3.5 * k, y * k) } c.stroke(); return }
      case 'home': { c.beginPath(); c.moveTo(-9 * k, 0); c.lineTo(0, -8.5 * k); c.lineTo(9 * k, 0); c.lineTo(6.5 * k, 0); c.lineTo(6.5 * k, 8 * k); c.lineTo(-6.5 * k, 8 * k); c.lineTo(-6.5 * k, 0); c.closePath(); c.fill(); return }
      case 'box': { c.lineWidth = 2 * k; c.beginPath(); c.moveTo(0, -8.5 * k); c.lineTo(8 * k, -4 * k); c.lineTo(8 * k, 4.5 * k); c.lineTo(0, 9 * k); c.lineTo(-8 * k, 4.5 * k); c.lineTo(-8 * k, -4 * k); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-8 * k, -4 * k); c.lineTo(0, 0.5 * k); c.lineTo(8 * k, -4 * k); c.moveTo(0, 0.5 * k); c.lineTo(0, 9 * k); c.stroke(); return }
      case 'shield': { c.beginPath(); c.moveTo(0, -9 * k); c.lineTo(8 * k, -6 * k); c.lineTo(7 * k, 2 * k); c.quadraticCurveTo(5 * k, 7 * k, 0, 9 * k); c.quadraticCurveTo(-5 * k, 7 * k, -7 * k, 2 * k); c.lineTo(-8 * k, -6 * k); c.closePath(); c.fill(); return }
      case 'check': { c.lineWidth = 3 * k; c.beginPath(); c.moveTo(-7 * k, 0.5 * k); c.lineTo(-2 * k, 5.5 * k); c.lineTo(7.5 * k, -5.5 * k); c.stroke(); return }
      case 'cross': { c.lineWidth = 3 * k; c.beginPath(); c.moveTo(-6 * k, -6 * k); c.lineTo(6 * k, 6 * k); c.moveTo(6 * k, -6 * k); c.lineTo(-6 * k, 6 * k); c.stroke(); return }
      default: { const px = name.length > 2 ? 8.5 : name.length > 1 ? 10.5 : 15; c.font = `800 ${px * k}px ${FONT}`; c.fillText(name, 0, 0.5 * k) }
    }
  }
  // badge = background shape + icon (or favicon), centered at x,y
  const favs = new Map()
  function fav(domain) {
    if (!favs.has(domain)) { const im = new Image(); im.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`; favs.set(domain, im) }
    const im = favs.get(domain)
    return im.complete && im.naturalWidth > 4 ? im : null
  }
  function badge(c, x, y, s, o) {
    c.save(); c.translate(x, y)
    const shape = o.shape || 'square'
    c.beginPath()
    if (shape === 'circle') c.arc(0, 0, s / 2, 0, TAU); else c.roundRect(-s / 2, -s / 2, s, s, s * 0.28)
    if (o.dashed) { c.setLineDash([3, 3]); c.strokeStyle = o.bg; c.lineWidth = 1.5; c.fillStyle = '#141210'; c.fill(); c.stroke(); c.setLineDash([]) } else { c.fillStyle = o.bg; c.fill() }
    if (o.ring) { c.lineWidth = o.ringW || 2; c.strokeStyle = o.ring; c.stroke() }
    const im = o.domain ? fav(o.domain) : null
    if (im) { c.save(); c.beginPath(); c.arc(0, 0, s * 0.36, 0, TAU); c.clip(); c.drawImage(im, -s * 0.36, -s * 0.36, s * 0.72, s * 0.72); c.restore() }
    else if (o.icon) drawIcon(c, o.icon, s, o.dashed ? o.bg : o.fg || BG)
    c.restore()
  }
  const iconCache = new Map()
  function iconImg(o, size = 22) {
    const key = JSON.stringify(o) + size
    if (!iconCache.has(key)) {
      const cv = document.createElement('canvas'); cv.width = cv.height = size * 2
      const c = cv.getContext('2d'); c.scale(2, 2); badge(c, size / 2, size / 2, size, { ...o, domain: undefined })
      iconCache.set(key, cv.toDataURL())
    }
    const img = `<img class="ico" src="${iconCache.get(key)}" width="${size}" height="${size}" alt="">`
    if (!o.domain) return img
    return `<span class="fav" style="width:${size}px;height:${size}px"><img src="https://www.google.com/s2/favicons?domain=${esc(o.domain)}&sz=64" alt="" onerror="this.remove()">${img}</span>`
  }
  const chIcon = (ch, size) => iconImg({ shape: 'square', bg: D.channels[ch].color, fg: D.channels[ch].ink, icon: CH_ICON[ch] }, size)
  const secIcon = (sec, size) => iconImg({ shape: 'circle', bg: sec.color, icon: sec.icon }, size)
  const engIcon = (e, size) => iconImg({ shape: 'circle', bg: D.engines[e].color, fg: D.engines[e].ink, icon: e }, size)
  const venIcon = (v, size) => iconImg({ shape: 'circle', bg: v.color, icon: v.icon }, size)
  const compIcon = (c, size) => { const col = laneById[c.lane]?.color || GOLD; return iconImg({ shape: 'circle', bg: '#141210', fg: col, icon: c.name[0], ring: col, domain: c.domain }, size) }

  // ---- nodes -----------------------------------------------------------------
  const nodes = [], byId = new Map()
  function mk(n) { Object.assign(n, { x: 0, y: 0, tx: 0, ty: 0, alpha: 0, talpha: 1, a: 0 }); byId.set(n.id, n); nodes.push(n); return n }
  mk({ id: 'company', kind: 'company', label: D.brain.brand.name, r: 34 })
  for (const s of D.sections) mk({ id: 's:' + s.id, kind: 'section', section: s.id, label: s.label, color: s.color, r: 24, icon: s.icon })
  for (const c of D.competitors) {
    mk({ id: c.id, kind: 'group', section: 'competitors', lane: c.lane, comp: c, label: c.name, color: laneById[c.lane].color, r: 13, sub: `${c.channels.length} channels · ${c.price}` })
    c.channels.forEach((ch) => mk({ id: c.id + ':' + ch, kind: 'leaf', section: 'competitors', parent: c.id, comp: c, chan: ch, label: D.channels[ch].label, color: D.channels[ch].color, r: 8, sub: c.data[ch]?.stat }))
  }
  for (const v of D.venues) mk({ id: 'v:' + v.id, kind: 'group', section: 'buyers', venue: v, label: v.label, color: v.color, r: 13, sub: `${v.filed} filed · standing ${v.standing}` })
  D.threads.forEach((t, i) => mk({ id: 't:' + i, kind: 'leaf', section: 'buyers', parent: 'v:' + t.venue, thread: t, label: t.title, color: STATUS[t.status][0], r: 8, sub: STATUS[t.status][1] }))
  for (const p of D.prompts) {
    const named = p.results.filter((r) => r.named).length
    mk({ id: p.id, kind: 'group', section: 'answers', prompt: p, label: p.text, color: named ? '#6ee7b7' : '#f07167', r: 13, sub: named ? `${D.brain.brand.name} named by ${named} / 3` : 'not named · ' + p.intent })
    p.results.forEach((r) => mk({ id: p.id + ':' + r.engine, kind: 'leaf', section: 'answers', parent: p.id, prompt: p, result: r, engine: r.engine, label: D.engines[r.engine].label, color: r.named ? '#6ee7b7' : '#f07167', r: 8, sub: r.named ? `names ${D.brain.brand.name}${r.position ? ' · #' + r.position : ''}` : r.brands.length ? 'names ' + r.brands.slice(0, 2).join(', ') : 'names nobody' }))
  }
  const TONE = { ok: '#6ee7b7', bad: '#f07167', info: '#7eb8e8', warn: '#e8c36a', muted: DIM }
  const PSTAT = { merged: 'ok', open: 'warn', sent: 'info', replied: 'warn', won: 'ok', quoted: 'muted', queued: 'warn', posted: 'ok', draft: 'muted' }
  for (const a of D.artifacts) mk({ id: 'a:' + a.id, kind: 'group', section: 'artifacts', art: a, label: a.label, color: a.color, r: 13, sub: a.stat })
  D.posts.forEach((it, i) => mk({ id: 'ap:' + i, kind: 'leaf', section: 'artifacts', parent: 'a:blog', post: it, icon: 'pen', label: it.title, color: TONE[it.tone], r: 8, sub: it.verdict }))
  D.prs.forEach((it, i) => mk({ id: 'apr:' + i, kind: 'leaf', section: 'artifacts', parent: 'a:seo', pr: it, icon: 'PR', label: it.title, color: TONE[PSTAT[it.status]], r: 8, sub: `${it.status} · ${it.delta} score` }))
  D.pitches.forEach((it, i) => mk({ id: 'al:' + i, kind: 'leaf', section: 'artifacts', parent: 'a:links', pitch: it, icon: 'mail', label: it.site, color: TONE[PSTAT[it.status]], r: 8, sub: `${it.status} · DR ${it.dr}${it.fee !== 'unknown' ? ' · ' + it.fee : ''}` }))
  D.social.forEach((it, i) => mk({ id: 'as:' + i, kind: 'leaf', section: 'artifacts', parent: 'a:social', soc: it, icon: CH_ICON[it.channel], label: it.text, color: TONE[PSTAT[it.status]], r: 8, sub: `${it.status} · ${D.channels[it.channel].label} · ${it.when}` }))
  const polSub = (pol) => `${D.rungs[pol.rung].label} · ${pol.auto ? 'auto' : 'approve'} · cap ${pol.cap}/day · ${pol.standing}`
  for (const ch of [...D.you.profile.channels, ...D.you.gaps]) {
    const gap = D.you.gaps.includes(ch)
    const running = D.competitors.filter((c) => c.channels.includes(ch)).length
    const pol = D.you.policy[ch]
    mk({ id: 'you:' + ch, kind: 'group', section: 'you', chan: ch, gap, pol, label: D.channels[ch].label, color: gap ? DIM : D.channels[ch].color, r: 13, sub: gap ? `not running · ${running} competitors are` : polSub(pol) })
  }
  const PAGES = D.site.groups.flatMap((g) => g.pages)
  const fmtN = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n))
  for (const g of D.site.groups) mk({ id: 'site:' + g.id, kind: 'group', section: 'site', sg: g, label: g.label, color: g.color, r: 13, sub: `${g.pages.length} page${g.pages.length > 1 ? 's' : ''} · ${fmtN(g.pages.reduce((a, p) => a + p.visits, 0))} visits · ${g.pages.reduce((a, p) => a + p.issues.length, 0)} issues` })
  PAGES.forEach((pg, i) => { const g = D.site.groups.find((g) => g.pages.includes(pg)); mk({ id: 'pg:' + i, kind: 'leaf', section: 'site', parent: 'site:' + g.id, page: pg, icon: 'page', label: pg.path, color: TONE[pg.tone], r: 8, sub: `${fmtN(pg.visits)} visits · ${pg.trials} trials · ${pg.issues.length ? pg.issues.length + ' issues' : 'healthy'}` }) })
  const linked = new Map()
  for (const l of D.links) { for (const [a, b] of [[l.from, l.to], [l.to, l.from]]) { if (!linked.has(a)) linked.set(a, []); linked.get(a).push({ id: b, label: l.label }) } }
  const kids = new Map()
  for (const n of nodes) if (n.parent) { if (!kids.has(n.parent)) kids.set(n.parent, []); kids.get(n.parent).push(n) }

  // ---- layout ----------------------------------------------------------------
  const state = { filter: null, query: '', selected: null, hover: null }
  let arcs = [], R0 = 150, R1 = 300, R2 = 480
  const GAP = 1.0
  function layout() {
    const f = state.filter
    const secs = D.sections.filter((s) => !f || f.section === s.id || (f.lane && s.id === 'competitors'))
    const groupsOf = (s) => nodes.filter((n) => n.kind === 'group' && n.section === s.id && (!f?.lane || n.lane === f.lane))
    const plan = secs.map((s) => {
      const groups = groupsOf(s)
      const subs = s.id === 'competitors' ? D.lanes.map((l) => groups.filter((g) => g.lane === l.id)).filter((g) => g.length) : [groups]
      return { s, groups, subs, units: groups.length + subs.length * GAP }
    })
    const spans = new Map()
    if (plan.length === 1) spans.set(plan[0].s.id, [-Math.PI / 2, TAU, 1])
    else {
      const right = plan.filter((p) => p.s.side === 'right'), left = plan.filter((p) => p.s.side === 'left')
      const half = (list, from, total) => { const u = list.reduce((a, p) => a + p.units, 0); let a = from; for (const p of list) { const sp = (total * p.units) / u; spans.set(p.s.id, [a, sp, 1]); a += sp } }
      if (left.length && right.length) { half(right, -Math.PI / 2, Math.PI); half(left, Math.PI / 2, Math.PI); for (const p of left) { const v = spans.get(p.s.id); spans.set(p.s.id, [v[0] + v[1], v[1], -1]) } }
      else half(plan, -Math.PI / 2, TAU)
    }
    const units = plan.map((p) => spans.get(p.s.id)[1] / p.units)
    R1 = Math.max(250, ...units.map((u) => 30 / u))
    let need = R1 + 160
    plan.forEach((p, i) => { for (const g of p.groups) { const k = (kids.get(g.id) || []).length; if (!k) continue; const rings = k <= 3 ? 1 : k <= 6 ? 2 : 3; const per = Math.ceil(k / rings); need = Math.max(need, (24 * (per - 1)) / (0.82 * units[i])) } })
    R2 = need
    arcs = []
    const shown = new Set()
    plan.forEach((p, i) => {
      const [start, span, dir] = spans.get(p.s.id)
      const unit = units[i]
      const hub = byId.get('s:' + p.s.id)
      const mid = start + (span / 2) * dir
      hub.a = mid; hub.tx = Math.cos(mid) * R0; hub.ty = Math.sin(mid) * R0; hub.talpha = 1; shown.add(hub.id)
      arcs.push({ kind: 'section', s: p.s, a0: Math.min(start, start + span * dir), a1: Math.max(start, start + span * dir), mid })
      let a = start
      for (const sub of p.subs) {
        a += (GAP * unit * dir) / 2
        const s0 = a
        for (const g of sub) {
          g.a = a + (unit / 2) * dir
          g.tx = Math.cos(g.a) * R1; g.ty = Math.sin(g.a) * R1; g.talpha = 1; shown.add(g.id)
          const ch = kids.get(g.id) || []
          const k = ch.length, rings = k <= 3 ? 1 : k <= 6 ? 2 : 3, sp = unit * 0.82
          ch.forEach((m, j) => {
            const t = k === 1 ? 0.5 : j / (k - 1)
            m.a = g.a - sp / 2 + sp * t
            const rr = R2 + (j % rings) * 34
            m.tx = Math.cos(m.a) * rr; m.ty = Math.sin(m.a) * rr; m.talpha = 1; shown.add(m.id)
          })
          a += unit * dir
        }
        if (p.s.id === 'competitors') { const l = laneById[sub[0].lane]; arcs.push({ kind: 'lane', lane: l, a0: Math.min(s0, a), a1: Math.max(s0, a), mid: (s0 + a) / 2 }) }
        a += (GAP * unit * dir) / 2
      }
    })
    for (const n of nodes) {
      if (n.kind === 'company' || shown.has(n.id)) continue
      n.talpha = 0
      const p = n.parent ? byId.get(n.parent) : n.kind === 'group' ? byId.get('s:' + n.section) : null
      if (p) { n.tx = p.tx; n.ty = p.ty } else { n.tx = Math.cos(n.a) * 40; n.ty = Math.sin(n.a) * 40 }
    }
  }

  // ---- canvas ----------------------------------------------------------------
  const wrap = $('#map'), el = $('#canvas'), ctx = el.getContext('2d'), tip = $('#tip')
  const cam = { x: 0, y: 0, k: 0.8 }
  let target = null, w = 0, h = 0, dragging = false, moved = false, lx = 0, ly = 0
  const t0 = performance.now()
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = wrap.getBoundingClientRect()
    const fresh = !w && r.width > 0
    w = r.width; h = r.height
    el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
    el.style.width = w + 'px'; el.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (fresh) state.selected ? select(state.selected) : fitAll()
  }
  resize(); new ResizeObserver(resize).observe(wrap)
  const toWorld = (sx, sy) => ({ x: (sx - w / 2) / cam.k - cam.x, y: (sy - h / 2) / cam.k - cam.y })
  function drawerW() { return $('#drawer').classList.contains('open') && w > 700 ? Math.min(456, w * 0.5) : 0 }
  function fitAll() { const dw = drawerW(); const k = Math.max(0.3, Math.min(1.2, Math.min((w - dw) / (2 * (R2 + 200)), h / (2 * (R2 + 170))))); target = { x: -dw / 2 / k, y: 0, k } }
  function aim(ids, pad = 90, maxK = 1.8) {
    const pts = ids.map((i) => byId.get(i)).filter((n) => n && n.talpha > 0)
    if (!pts.length) return fitAll()
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
    for (const n of pts) { x0 = Math.min(x0, n.tx); y0 = Math.min(y0, n.ty); x1 = Math.max(x1, n.tx); y1 = Math.max(y1, n.ty) }
    const bw = x1 - x0 + pad * 2, bh = y1 - y0 + pad * 2, dw = drawerW()
    const k = Math.max(0.4, Math.min(maxK, Math.min((w - dw) / bw, h / bh)))
    target = { x: -(x0 + x1) / 2 - dw / 2 / k, y: -(y0 + y1) / 2, k }
  }
  function hit(sx, sy) {
    const p = toWorld(sx, sy)
    let best = null, bd = Infinity
    for (const n of nodes) {
      if (n.alpha < 0.5) continue
      const d = Math.hypot(n.x - p.x, n.y - p.y)
      if (d < n.r + 9 / cam.k && d < bd) { best = n; bd = d }
    }
    return best
  }
  function hotSet() {
    const hot = new Set()
    const add = (id) => {
      const n = byId.get(id); if (!n) return
      hot.add(id); hot.add('company')
      if (n.kind === 'section') nodes.filter((m) => m.kind === 'group' && m.section === n.section).forEach((m) => hot.add(m.id))
      if (n.kind === 'group') { hot.add('s:' + n.section); (kids.get(id) || []).forEach((m) => hot.add(m.id)) }
      if (n.kind === 'leaf') { hot.add(n.parent); hot.add('s:' + n.section) }
      if (state.selected === id) (linked.get(id) || []).forEach((l) => hot.add(l.id))
      if (n.kind === 'company') D.sections.forEach((s) => hot.add('s:' + s.id))
    }
    if (state.selected) add(state.selected)
    if (state.hover) add(state.hover)
    return hot
  }
  function matches(n) {
    if (!state.query) return true
    const g = n.kind === 'leaf' ? byId.get(n.parent) : n
    if (g.kind !== 'group') return true
    return g.label.toLowerCase().includes(state.query) || (g.lane || '').includes(state.query) || (g.comp?.domain || '').includes(state.query)
  }
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

  function radialText(text, a, r, o = {}) {
    const flip = Math.cos(a) < 0
    ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(flip ? a + Math.PI : a)
    ctx.textAlign = flip ? 'right' : 'left'; ctx.textBaseline = 'middle'; ctx.font = o.font || `600 12px ${FONT}`
    const wd = ctx.measureText(text).width
    if (o.pill) { ctx.fillStyle = BG; ctx.globalAlpha *= 0.85; ctx.beginPath(); ctx.roundRect(flip ? -wd - 6 : -6, -9, wd + 12, 18, 9); ctx.fill(); ctx.globalAlpha /= 0.85 }
    ctx.fillStyle = o.color || INK; ctx.fillText(text, 0, 0)
    if (o.sub) { ctx.font = `500 10px ${FONT}`; ctx.fillStyle = o.subColor || MUT; ctx.fillText(o.sub, flip ? -wd - 8 : wd + 8, 0) }
    ctx.restore()
  }
  function curve(p, n, radial) {
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
    if (!radial) { const cx = p.x + (n.x - p.x) * 0.45, cy = p.y + (n.y - p.y) * 0.45; ctx.quadraticCurveTo(cx - (n.y - p.y) * 0.08, cy + (n.x - p.x) * 0.08, n.x, n.y); return }
    const pr = Math.hypot(p.x, p.y), nr = Math.hypot(n.x, n.y), mid = (pr + nr) / 2, pa = Math.atan2(p.y, p.x)
    ctx.bezierCurveTo(Math.cos(pa) * mid, Math.sin(pa) * mid, Math.cos(n.a) * (mid + 20), Math.sin(n.a) * (mid + 20), n.x, n.y)
  }

  function draw(now) {
    if (target) { cam.x += (target.x - cam.x) * 0.08; cam.y += (target.y - cam.y) * 0.08; cam.k += (target.k - cam.k) * 0.08; if (Math.abs(cam.x - target.x) < 0.3 && Math.abs(cam.k - target.k) < 0.005) target = null }
    for (const n of nodes) { n.x += (n.tx - n.x) * 0.1; n.y += (n.ty - n.y) * 0.1; n.alpha += (n.talpha - n.alpha) * 0.12 }
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
    g.addColorStop(0, '#16140f'); g.addColorStop(1, BG); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(cam.k, cam.k); ctx.translate(cam.x, cam.y)
    const hot = hotSet(), dim = hot.size > 0, k = cam.k
    const hotSec = new Set([...hot].map((id) => byId.get(id)?.section).filter(Boolean))

    for (const ar of arcs) {
      const outer = R2 + 100, inner = R0 + 40
      if (ar.kind === 'section') {
        const lit = !dim || hotSec.has(ar.s.id)
        ctx.beginPath(); ctx.arc(0, 0, outer, ar.a0 + 0.01, ar.a1 - 0.01); ctx.arc(0, 0, inner, ar.a1 - 0.01, ar.a0 + 0.01, true); ctx.closePath()
        ctx.fillStyle = ar.s.color; ctx.globalAlpha = lit ? 0.04 : 0.015; ctx.fill(); ctx.globalAlpha = 1
      } else {
        const lit = !dim || [...hot].some((id) => byId.get(id)?.lane === ar.lane.id)
        ctx.beginPath(); ctx.arc(0, 0, R1 - 40, ar.a0 + 0.01, ar.a1 - 0.01)
        ctx.strokeStyle = ar.lane.color; ctx.lineWidth = 2 / k; ctx.globalAlpha = lit ? 0.55 : 0.18; ctx.stroke(); ctx.globalAlpha = 1
        ctx.save(); const lr = R2 + 108; ctx.translate(Math.cos(ar.mid) * lr, Math.sin(ar.mid) * lr)
        let rot = ar.mid + Math.PI / 2; if (Math.sin(ar.mid) > 0) rot += Math.PI; ctx.rotate(rot)
        ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ar.lane.color; ctx.globalAlpha = lit ? 0.9 : 0.35
        ctx.fillText(ar.lane.label.toUpperCase().split('').join(' '), 0, 0); ctx.restore(); ctx.globalAlpha = 1
      }
    }

    // edges
    for (const n of nodes) {
      if (n.kind === 'company' || n.alpha < 0.02) continue
      const p = byId.get(n.parent || (n.kind === 'group' ? 's:' + n.section : 'company'))
      const lit = (!dim || (hot.has(n.id) && hot.has(p.id))) && matches(n)
      ctx.strokeStyle = n.color; ctx.globalAlpha = n.alpha * (lit ? (n.kind === 'section' ? 0.7 : n.kind === 'group' ? 0.4 : 0.55) : 0.06)
      ctx.lineWidth = (n.kind === 'section' ? 3 : n.kind === 'group' ? 1.5 : 1.1) / k
      if (n.gap) ctx.setLineDash([4 / k, 4 / k])
      curve(p, n, n.kind === 'leaf'); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1
      if (lit && n.alpha > 0.9 && (n.kind === 'section' ? !dim || hot.has(n.id) : hot.has(n.id))) {
        const t = ((now - t0) / 2600 + n.a) % 1
        const px = p.x + (n.x - p.x) * t, py = p.y + (n.y - p.y) * t
        ctx.beginPath(); ctx.arc(px, py, 2.2 / k, 0, TAU); ctx.fillStyle = n.color; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1
      }
    }

    // cross-links between artifacts and the places they are carried
    for (const l of D.links) {
      const a = byId.get(l.from), b = byId.get(l.to)
      if (!a || !b || a.alpha < 0.5 || b.alpha < 0.5) continue
      const lit = hot.has(a.id) && hot.has(b.id) && (state.selected === a.id || state.selected === b.id || state.hover === a.id || state.hover === b.id)
      if (!lit && dim) continue
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) * 0.5 * 0.35, (a.y + b.y) * 0.5 * 0.35, b.x, b.y)
      ctx.strokeStyle = '#fdba74'; ctx.globalAlpha = lit ? 0.85 : 0.1; ctx.lineWidth = (lit ? 1.8 : 1) / k; ctx.setLineDash([5 / k, 4 / k]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1
      if (lit) { const t = ((now - t0) / 1800) % 1; const mx = (a.x + b.x) * 0.5 * 0.35, my = (a.y + b.y) * 0.5 * 0.35; const px = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mx + t * t * b.x, py = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * my + t * t * b.y; ctx.beginPath(); ctx.arc(px, py, 2.6 / k, 0, TAU); ctx.fillStyle = '#fdba74'; ctx.fill() }
    }

    // leaves
    for (const n of nodes) {
      if (n.kind !== 'leaf' || n.alpha < 0.02) continue
      const isHot = hot.has(n.id), lit = (!dim || isHot) && matches(n), sel = state.selected === n.id || state.hover === n.id
      const s = isHot ? 20 : 14
      ctx.globalAlpha = n.alpha * (lit ? 1 : 0.2)
      if (n.chan) badge(ctx, n.x, n.y, s, { shape: 'square', bg: D.channels[n.chan].color, fg: D.channels[n.chan].ink, icon: CH_ICON[n.chan], ring: sel ? INK : null })
      else if (n.thread) badge(ctx, n.x, n.y, s, { shape: 'circle', bg: n.color, icon: 'bubble', ring: sel ? INK : null })
      else if (n.section === 'artifacts' || n.page) badge(ctx, n.x, n.y, s, { shape: 'square', bg: n.color, icon: n.icon, ring: sel ? INK : null })
      else badge(ctx, n.x, n.y, s, { shape: 'circle', bg: D.engines[n.engine].color, fg: D.engines[n.engine].ink, icon: n.engine, ring: sel ? INK : n.color, ringW: 2.5 })
      if (isHot || k > 2.2) radialText(n.thread ? trunc(n.label, 34) : n.label, n.a, Math.hypot(n.x, n.y) + s * 0.7 + 4, { color: INK, sub: n.sub, font: `600 11px ${FONT}` })
      ctx.globalAlpha = 1
    }

    // groups
    for (const n of nodes) {
      if (n.kind !== 'group' || n.alpha < 0.02) continue
      const isHot = hot.has(n.id), lit = (!dim || isHot) && matches(n), sel = state.selected === n.id
      ctx.globalAlpha = n.alpha * (lit ? 1 : 0.25)
      if (isHot) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 12, 0, TAU); ctx.fillStyle = n.color; ctx.globalAlpha = n.alpha * 0.12; ctx.fill(); ctx.globalAlpha = n.alpha * (lit ? 1 : 0.25) }
      const s = n.r * 2 + 2
      if (n.comp) badge(ctx, n.x, n.y, s, { shape: 'circle', bg: '#141210', fg: n.color, icon: n.comp.name[0], ring: sel ? INK : n.color, ringW: sel ? 3 : 2, domain: n.comp.domain })
      else if (n.venue) badge(ctx, n.x, n.y, s, { shape: 'circle', bg: n.venue.color, icon: n.venue.icon, ring: sel ? INK : null })
      else if (n.prompt) badge(ctx, n.x, n.y, s, { shape: 'circle', bg: n.color, icon: 'bubble?', ring: sel ? INK : null })
      else if (n.art || n.sg) badge(ctx, n.x, n.y, s, { shape: 'circle', bg: n.color, icon: (n.art || n.sg).icon, ring: sel ? INK : null })
      else {
        badge(ctx, n.x, n.y, s, { shape: 'square', bg: n.gap ? DIM : D.channels[n.chan].color, fg: D.channels[n.chan].ink, icon: CH_ICON[n.chan], dashed: n.gap, ring: sel ? INK : n.pol ? D.standing[n.pol.standing] : null, ringW: 2.5 })
        if (n.pol) { const rg = D.rungs[n.pol.rung]; badge(ctx, n.x + s * 0.42, n.y + s * 0.42, 13, { shape: 'circle', bg: rg.color, icon: rg.short, ring: BG, ringW: 2 }); if (n.pol.auto) badge(ctx, n.x - s * 0.42, n.y + s * 0.42, 13, { shape: 'circle', bg: INK, icon: '∞', ring: BG, ringW: 2 }) }
      }
      const label = n.prompt ? trunc(n.label, 30) : n.label
      radialText(label, n.a, R1 + n.r + 6, { pill: true, color: lit ? INK : '#8a837a', font: `700 13px ${FONT}`, sub: isHot ? n.sub : null })
      ctx.globalAlpha = 1
    }

    // section hubs
    for (const n of nodes) {
      if (n.kind !== 'section' || n.alpha < 0.02) continue
      const isHot = hot.has(n.id), lit = !dim || isHot
      ctx.globalAlpha = n.alpha * (lit ? 1 : 0.35)
      if (isHot) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 14, 0, TAU); ctx.fillStyle = n.color; ctx.globalAlpha = n.alpha * 0.14; ctx.fill(); ctx.globalAlpha = n.alpha * (lit ? 1 : 0.35) }
      badge(ctx, n.x, n.y, n.r * 2, { shape: 'circle', bg: n.color, icon: n.icon, ring: state.selected === n.id ? INK : null, ringW: 3 })
      const left = Math.cos(n.a) < -0.2, below = Math.abs(Math.cos(n.a)) <= 0.2
      ctx.font = `800 13px ${FONT}`; ctx.textAlign = below ? 'center' : left ? 'right' : 'left'; ctx.textBaseline = 'middle'
      const lx = below ? n.x : n.x + (left ? -1 : 1) * (n.r + 8), ly = below ? n.y + (Math.sin(n.a) > 0 ? n.r + 12 : -n.r - 12) : n.y
      const wd = ctx.measureText(n.label).width
      ctx.fillStyle = BG; ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.roundRect(lx - (below ? wd / 2 : left ? wd : 0) - 6, ly - 10, wd + 12, 20, 10); ctx.fill(); ctx.globalAlpha /= 0.8
      ctx.fillStyle = INK; ctx.fillText(n.label, lx, ly)
      ctx.globalAlpha = 1
    }

    // company
    const c = byId.get('company'), pulse = 1 + Math.sin((now - t0) / 900) * 0.04
    ctx.beginPath(); ctx.arc(0, 0, c.r * 1.8 * pulse, 0, TAU); ctx.fillStyle = GOLD; ctx.globalAlpha = 0.08; ctx.fill(); ctx.globalAlpha = 1
    badge(ctx, 0, 0, c.r * 2, { shape: 'circle', bg: GOLD, icon: 'sparkle', ring: state.selected === 'company' ? INK : null, ringW: 3, domain: D.brain.brand.domain })
    ctx.fillStyle = INK; ctx.font = `800 15px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(D.brain.brand.name.toLowerCase(), 0, c.r + 16)
    ctx.fillStyle = MUT; ctx.font = `500 10px ${FONT}`; ctx.fillText('his brief · click', 0, c.r + 30)
    ctx.restore()
    requestAnimationFrame(draw)
  }

  // ---- input -----------------------------------------------------------------
  el.addEventListener('pointerdown', (e) => { dragging = true; moved = false; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId) })
  el.addEventListener('pointermove', (e) => {
    if (dragging) { const dx = e.clientX - lx, dy = e.clientY - ly; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; cam.x += dx / cam.k; cam.y += dy / cam.k; target = null; lx = e.clientX; ly = e.clientY; return }
    const r = el.getBoundingClientRect(), n = hit(e.clientX - r.left, e.clientY - r.top)
    state.hover = n ? n.id : null
    el.style.cursor = n ? 'pointer' : 'grab'
    if (n && n.kind !== 'company') {
      tip.innerHTML = `<b>${esc(n.label)}</b>${n.sub ? `<span>${esc(n.sub)}</span>` : ''}`
      tip.style.left = e.clientX - r.left + 14 + 'px'; tip.style.top = e.clientY - r.top + 14 + 'px'; tip.classList.add('show')
    } else tip.classList.remove('show')
  })
  el.addEventListener('pointerup', (e) => { dragging = false; if (moved) return; const r = el.getBoundingClientRect(), n = hit(e.clientX - r.left, e.clientY - r.top); select(n ? n.id : null) })
  el.addEventListener('pointerleave', () => { state.hover = null; tip.classList.remove('show') })
  el.addEventListener('wheel', (e) => { e.preventDefault(); const r = el.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, b = toWorld(sx, sy); cam.k = Math.max(0.2, Math.min(4, cam.k * Math.exp(-e.deltaY * 0.0015))); const a = toWorld(sx, sy); cam.x += a.x - b.x; cam.y += a.y - b.y; target = null }, { passive: false })
  el.addEventListener('dblclick', () => fitAll())
  window.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; if (e.key === 'Escape') select(null); if (e.key === '0') fitAll() })

  // ---- drawer ----------------------------------------------------------------
  const drawer = $('#drawer'), body = $('#drawer-body')
  const chip = (go, icon, label, sub) => `<button class="chip" data-go="${esc(go)}">${icon}<span><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`
  const crumb = (n) => {
    const parts = [chip('s:' + n.section, secIcon(secById[n.section], 16), secById[n.section].label)]
    if (n.parent) { const p = byId.get(n.parent); parts.push(chip(p.id, groupIcon(p, 16), trunc(p.label, 28))) }
    return `<p class="crumbs">${parts.join('<i>›</i>')}</p>`
  }
  function groupIcon(n, size = 22) {
    if (n.comp) return compIcon(n.comp, size)
    if (n.venue) return venIcon(n.venue, size)
    if (n.prompt) return iconImg({ shape: 'circle', bg: n.color, icon: 'bubble?' }, size)
    if (n.art || n.sg) return iconImg({ shape: 'circle', bg: n.color, icon: (n.art || n.sg).icon }, size)
    return iconImg({ shape: 'square', bg: n.gap ? DIM : D.channels[n.chan].color, fg: D.channels[n.chan].ink, icon: CH_ICON[n.chan], dashed: n.gap }, size)
  }
  function select(id) {
    state.selected = id
    const n = id && byId.get(id)
    if (!n) { drawer.classList.remove('open'); history.replaceState(null, '', location.pathname); fitAll(); return }
    drawer.classList.add('open'); history.replaceState(null, '', '#' + id)
    if (n.kind === 'company') { body.innerHTML = brainHtml(); aim(['company'], 300, 1.1) }
    else if (n.kind === 'section') { body.innerHTML = sectionHtml(n); aim([n.id, ...nodes.filter((m) => m.section === n.section).map((m) => m.id)], 80, 1.3) }
    else if (n.kind === 'group') { body.innerHTML = groupHtml(n); aim([n.id, ...(kids.get(n.id) || []).map((m) => m.id)], 70, 1.7) }
    else { body.innerHTML = leafHtml(n); aim([n.parent, n.id], 120, 2) }
    if (state.from === 'insights') { body.insertAdjacentHTML('afterbegin', `<button class="back" data-back>← Back to insights</button>`); state.from = null }
    body.scrollTop = 0
  }
  body.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]'); if (go) { if (go.dataset.from === 'insights') state.from = 'insights'; return select(go.dataset.go) }
    if (e.target.closest('[data-back]')) return showInsights()
    const act = e.target.closest('[data-act]'); if (act) toast(`${act.dataset.act} · mock, nothing sent`)
  })
  $('#drawer-close').addEventListener('click', () => select(null))
  function toast(t) { $('#toast').textContent = t; $('#toast').classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => $('#toast').classList.remove('show'), 3000) }

  // ---- insights: computed from the data, each with a place to go and a thing to do
  const KIND = { act: ['Needs you', GOLD], gap: ['Gap', '#7eb8e8'], risk: ['Risk', '#f07167'], win: ['Working', '#6ee7b7'] }
  let INS = []
  function insights() {
    const B = D.brain.brand.name, out = []
    const add = (o) => out.push(o)
    const go = (id, label) => ({ go: id, label }), act = (label) => ({ act: label, label })
    for (const it of D.intel) {
      const c = it.comp ? compById[it.comp] : null
      const icon = c ? (it.chan ? chIcon(it.chan, 26) : compIcon(c, 26)) : it.hl.startsWith('q-') ? engIcon(it.hl.split(':')[1] || 'chatgpt', 26) : secIcon(secById.buyers, 26)
      const ctas = it.ctas ? it.ctas.map((x) => x[0] === 'go' ? go(x[1], x[2]) : act(x[1])) : [{ draft: it.id, label: it.draft.channel === 'blog' ? 'Draft the page' : 'Copy it' }, go(it.hl, c ? `See ${c.name}’s ${D.channels[it.chan].label}` : 'See it')]
      add({ ...it, icon, ctas, who: c ? `${compIcon(c, 16)} ${c.name}` : '' })
    }
    const hot = D.threads.map((t, i) => ({ t, i })).filter((x) => x.t.status === 'draft' && x.t.score >= 80)
    if (hot.length) add({ kind: 'act', score: 70, icon: secIcon(secById.buyers, 26), hl: 't:' + hot[0].i, title: `${hot.length} buying threads scored 80+ are waiting for your approve`, why: 'Buying questions go stale in a day. The first one is “is there a tool that finds reddit threads… not alerts, actual drafts”, which is the product sentence.', evidence: hot.slice(0, 3).map((x) => [venueById[x.t.venue].label, `“${trunc(x.t.title, 44)}” · ${x.t.score}`]), source: 'scout queue · live', ctas: [go('t:' + hot[0].i, 'Approve the first'), go('s:buyers', 'See the queue')] })
    const check = PAGES.findIndex((x) => x.path === '/check-seo-geo'), pc = PAGES[check], aeo = D.threads.findIndex((t) => t.venue === 'aeo' && t.title.startsWith('GEO agencies'))
    if (pc) add({ kind: 'act', score: 68, icon: iconImg({ shape: 'square', bg: TONE[pc.tone], icon: 'page' }, 26), hl: 'pg:' + check, title: `/check-seo-geo gets ${pc.src.search}% of its traffic from search and ${pc.src.reddit}% from Reddit, while two live threads ask exactly what it answers`, why: `It converts at ${((pc.trials / pc.visits) * 100).toFixed(1)}%. A reply that ends with this link is the cheapest trial you will get this week, and it is the page the engines should be citing on the dashboards question.`, evidence: [['visits / 30d', fmtN(pc.visits)], ['trials', String(pc.trials)], ['cited by engines', String(pc.cited)]], source: 'Viewfy tracker + citation run', ctas: [go('t:' + aeo, 'Reply with the link'), go('pg:' + check, 'See the page')] })
    const off = D.posts.map((p, i) => ({ p, i })).filter((x) => x.p.tone === 'bad')
    if (off.length) add({ kind: 'risk', score: 64, icon: iconImg({ shape: 'square', bg: '#f07167', icon: 'pen' }, 26), hl: 'ap:' + off[0].i, title: `${off.length} published posts compare you to Buffer, Hootsuite and Later. The brief forbids that lane`, why: 'They spend crawl budget on a category you do not sell and teach the engines you are a scheduler. The ChatGPT answer for “AI tool that writes my blog daily” names SEObot, Outrank and Journalist AI, not a scheduler.', evidence: off.map((x) => [x.p.date, x.p.title]), source: 'brief × blog', ctas: [go('a:blog', 'Review the blog'), act(`Unpublish ${off.length} posts`), act('Redirect to the ReplyGuy post')] })
    const quoted = D.pitches.map((p, i) => ({ p, i })).find((x) => x.p.status === 'quoted')
    if (quoted) add({ kind: 'act', score: 60, icon: iconImg({ shape: 'square', bg: DIM, icon: 'mail' }, 26), hl: 'al:' + quoted.i, title: `${quoted.p.site} (DR ${quoted.p.dr}) named ${quoted.p.fee} for a live link to the Show HN audit`, why: 'Under the 29% cap. The same piece already earned a free link on dev.to and two editors replied for free, so the fee buys speed, not access.', evidence: [['fee', quoted.p.fee], ['DR', String(quoted.p.dr)], ['same piece, free links', '1 live · 2 replies']], source: 'linkbuilder inbox', ctas: [go('al:' + quoted.i, 'See the pitch'), act(`Pay ${quoted.p.fee}`), act('Skip')] })
    const nobot = PAGES.map((p, i) => ({ p, i })).filter((x) => x.p.w > 1 && (x.p.bots.GPTBot === 0 || !x.p.llms))
    if (nobot.length) add({ kind: 'risk', score: 56, icon: engIcon('chatgpt', 26), hl: 'pg:' + nobot[0].i, title: `${nobot.length} pages are missing from llms.txt or were never fetched by GPTBot, including ${nobot.slice(0, 2).map((x) => x.p.path).join(' and ')}`, why: 'A page an engine never read cannot be cited. The fix is one PR: list them in llms.txt and ping the sitemap.', evidence: nobot.slice(0, 4).map((x) => [x.p.path, x.p.bots.GPTBot === 0 ? 'GPTBot 0 hits' : 'not in llms.txt']), source: 'server logs + our crawl', ctas: [act('Open the llms.txt PR'), go('s:site', 'See the site')] })
    for (const [ch, pol] of Object.entries(D.you.policy)) if (pol.standing === 'limited') add({ kind: 'risk', score: 52, icon: chIcon(ch, 26), hl: 'you:' + ch, title: `${D.channels[ch].label} standing is limited and 102 of 144 drafts there were rejected`, why: 'The channel is costing review time and risking the brand account. Pause it a week; the buyers there are also in r/saasbuild.', evidence: [['cap', `${pol.cap}/day`], ['rung', D.rungs[pol.rung].label], ['identity', pol.identity]], source: 'account standing', ctas: [act(`Pause ${D.channels[ch].label} 7 days`), go('you:' + ch, 'See the policy')] })
    const openPr = D.prs.map((p, i) => ({ p, i })).find((x) => x.p.status === 'open')
    if (openPr) add({ kind: 'act', score: 48, icon: iconImg({ shape: 'square', bg: GOLD, icon: 'PR' }, 26), hl: 'apr:' + openPr.i, title: `A PR is waiting for your merge: ${openPr.p.title.toLowerCase()}`, why: openPr.p.note, evidence: [['files', String(openPr.p.files)], ['audit score', openPr.p.delta]], source: 'SEO audit', ctas: [act('Merge'), go('apr:' + openPr.i, 'See the PR')] })
    const live = D.pitches.find((p) => p.status === 'won')
    if (live) add({ kind: 'win', score: 44, icon: iconImg({ shape: 'square', bg: '#6ee7b7', icon: 'link' }, 26), hl: 'ap:2', title: `The Show HN audit earned a live link on ${live.site} and four pitches carry it`, why: 'Original research is the artifact editors say yes to. Nothing on the competitor half of the map ships this. The next one is already in the data: 41 of 156 launches block GPTBot by accident.', evidence: [['live links', '1'], ['pitches carrying it', '4'], ['replies', '2']], source: 'linkbuilder', ctas: [act('Commission the next audit'), go('ap:2', 'See the post')] })
    INS = out.sort((a, b) => b.score - a.score)
    return INS
  }
  function insightsHtml() {
    const list = insights()
    const counts = Object.fromEntries(Object.keys(KIND).map((k) => [k, list.filter((i) => i.kind === k).length]))
    return `<p class="eyebrow">insights · ${list.length} from the data on this map</p><h2>${iconImg({ shape: 'circle', bg: GOLD, icon: 'sparkle' }, 34)} What he would do next</h2>
<p class="lead">Ranked by impact. Every card points at the place on the map it came from, and at the one thing you can click.</p>
<ul class="facts big">${Object.entries(KIND).map(([k, v]) => `<li><i style="background:${v[1]}"></i>${counts[k]} ${v[0].toLowerCase()}</li>`).join('')}</ul>
<div class="list">${list.map((i, idx) => `<article class="ins ${i.kind}" data-hl="${esc(i.hl)}" style="--c:${KIND[i.kind][1]}"><header>${i.icon}<em>${KIND[i.kind][0]}</em>${i.who ? `<span class="who">${i.who}</span>` : ''}<span class="impact">impact ${i.score}</span></header><b>${esc(i.title)}</b><p>${esc(i.why)}</p>${i.evidence ? `<table class="ev">${i.evidence.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>` : ''}${i.source ? `<span class="src">${esc(i.source)}</span>` : ''}<footer>${i.ctas.map((c, j) => c.draft ? `<button data-draft="${idx}">${esc(c.label)}</button>` : c.go ? `<button data-go="${esc(c.go)}" data-from="insights" class="${j ? 'ghost' : ''}">${esc(c.label)}</button>` : `<button data-act="${esc(c.act)}" class="${j ? 'ghost' : ''}">${esc(c.label)}</button>`).join('')}</footer></article>`).join('')}</div>`
  }
  function draftHtml(i) {
    const d = i.draft, c = compById[i.comp], you = D.you.profile
    const one = (comp, ch, item, data) => renderers[ch](comp, { ...(data || {}), followers: data?.followers || 0, items: [item] })
    let orig = '', mine = ''
    if (c && i.chan && c.data[i.chan]) {
      const data = c.data[i.chan], sig = data.items.find((x) => x.signal) || data.items[0]
      orig = one(c, i.chan, sig, data)
    }
    if (d.channel === 'meta') mine = one(you, 'meta', { id: 'draft', status: 'Draft', started: 'today', since: '', platforms: d.platforms, format: d.format, headline: d.headline, primary: d.primary, description: d.description, cta: d.cta, url: 'viewfy.ai/start', variants: 1, reach_eu: '–', bg: you.colors, hook: d.hook })
    else if (d.channel === 'x') mine = one(d.author === 'founder' ? { ...you, name: you.founders[0].name, domain: 'viewfy.ai' } : you, 'x', { text: d.text, date: '', ago: 'draft', likes: 0, reposts: 0, replies: 0, views: '–', kind: 'draft', handle: d.author === 'founder' ? '@mkovetsky' : '@viewfy_ai' })
    else if (d.channel === 'linkedin') mine = one(you, 'linkedin', { type: d.type, text: d.text, date: '', ago: 'draft', reactions: 0, comments: 0, reposts: 0 }, { followers: 0 })
    else if (d.channel === 'blog') mine = `<article class="bpost"><b>${esc(d.title)}</b><span class="gu">viewfy.ai/blog/${esc(d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48))}</span><ol class="outline">${d.outline.map((o) => `<li>${esc(o)}</li>`).join('')}</ol><div class="tags">${d.keywords.map((k) => `<span class="tag me">${esc(k)}</span>`).join('')}</div></article>`
    return `<button class="back" data-back>← Back to insights</button><p class="eyebrow">copy it · ${esc(i.source || '')}</p><h2>${iconImg({ shape: 'circle', bg: GOLD, icon: 'sparkle' }, 34)} His draft, your voice</h2><p class="lead">${esc(i.title)}.</p>
${orig ? `<h3>What ${esc(c.name)} runs</h3><div class="list">${orig}</div>` : ''}
<h3>Your version</h3><div class="list mine">${mine}</div>
<div class="draft"><small>${d.channel === 'blog' ? 'blogger writes it from this outline, you attest before publish' : 'nothing posts until you approve'}</small><footer><span>${esc(D.brain.voice.tone)}. No banned words.</span><button data-act="Approve">Approve</button><button data-act="Edit" class="ghost">Edit</button><button data-act="Skip" class="ghost">Skip</button></footer></div>`
  }
  body.addEventListener('click', (e) => { const b = e.target.closest('[data-draft]'); if (b) { const i = INS[+b.dataset.draft]; body.innerHTML = draftHtml(i); body.scrollTop = 0; state.hover = i.hl; select.keepHover = true } })
  function showInsights() { state.selected = null; state.from = null; drawer.classList.add('open'); body.innerHTML = insightsHtml(); body.scrollTop = 0; history.replaceState(null, '', '#insights'); fitAll() }
  body.addEventListener('mouseover', (e) => { const c = e.target.closest('[data-hl]'); if (c && byId.get(c.dataset.hl)?.talpha) state.hover = c.dataset.hl })
  body.addEventListener('mouseleave', () => { if (!state.selected) state.hover = null })

  function brainHtml() {
    const b = D.brain
    return `<p class="eyebrow">his brief · built ${b.built}</p>
<h2>${iconImg({ shape: 'circle', bg: GOLD, icon: 'sparkle', domain: b.brand.domain }, 34)} ${esc(b.brand.name)} <span class="muted">${esc(b.brand.domain)}</span></h2>
<p class="lead">${esc(b.brand.one_liner)}</p>
<dl class="kv"><dt>Category</dt><dd>${esc(b.brand.category)}</dd><dt>Buyer</dt><dd>${esc(b.audience.icp)}</dd><dt>Jobs</dt><dd>${b.audience.jobs.map((j) => `<span class="tag">${esc(j)}</span>`).join(' ')}</dd><dt>Voice</dt><dd>${esc(b.voice.tone)}</dd><dt>Banned</dt><dd>${b.voice.banned.map((j) => `<span class="tag bad">${esc(j)}</span>`).join(' ')}</dd><dt>Prices</dt><dd>${esc(b.prices)}</dd></dl>
<h3>Four branches</h3>
<div class="chips stack">${D.sections.map((s) => chip('s:' + s.id, secIcon(s, 24), s.label, `${nodes.filter((n) => n.kind === 'group' && n.section === s.id).length} ${s.id === 'buyers' ? 'venues' : s.id === 'answers' ? 'questions' : 'channels'}`)).join('')}</div>
<p class="foot">Mock data today. Bright Data (X, LinkedIn, Reddit, YouTube), Meta Ad Library, Google Ads Transparency and the scout queue replace it 1:1.</p>`
  }
  function sectionHtml(n) {
    const s = secById[n.section], groups = nodes.filter((m) => m.kind === 'group' && m.section === s.id)
    let extra = ''
    if (s.id === 'buyers') { const c = {}; D.threads.forEach((t) => (c[t.status] = (c[t.status] || 0) + 1)); extra = `<ul class="facts big">${Object.entries(STATUS).map(([k, v]) => `<li><i style="background:${v[0]}"></i>${c[k] || 0} ${k}</li>`).join('')}</ul>` }
    if (s.id === 'answers') { const named = D.prompts.filter((p) => p.results.some((r) => r.named)).length; extra = `<ul class="facts big"><li><i style="background:#6ee7b7"></i>${named} questions name ${esc(D.brain.brand.name)}</li><li><i style="background:#f07167"></i>${D.prompts.length - named} name someone else</li></ul>` }
    if (s.id === 'artifacts') extra = `<ul class="facts big"><li><i style="background:#c9b58a"></i>${D.posts.length} posts</li><li><i style="background:#93c5fd"></i>${D.prs.length} PRs</li><li><i style="background:#86efac"></i>${D.pitches.length} pitches</li><li><i style="background:#fda4af"></i>${D.social.length} social</li></ul>`
    if (s.id === 'site') { const t = D.site.total; extra = `<div class="tiles">${[['visits / 30d', fmtN(t.visits)], ['trials started', t.trials], ['indexed', `${t.indexed} / ${t.pages}`], ['AI crawler hits', fmtN(t.bots)], ['open issues', t.issues]].map(([k, v]) => `<div class="tile"><small>${k}</small><b>${v}</b></div>`).join('')}</div><h3>Stats we collect per page</h3><table class="collect">${D.site.collect.map((c) => `<tr><td>${esc(c.k)}</td><td>${esc(c.src)}</td><td>${esc(c.when)}</td></tr>`).join('')}</table>` }
    if (s.id === 'you') extra = `<ul class="facts big"><li><i style="background:${GOLD}"></i>${D.you.profile.channels.length} running</li><li><i style="background:${DIM}"></i>${D.you.gaps.length} gaps</li></ul>`
    if (s.id === 'competitors') extra = `<div class="lanes">${D.lanes.map((l) => `<button class="lane" data-lane="${l.id}" style="--c:${l.color}"><b>${esc(l.label)}</b><span>${D.competitors.filter((c) => c.lane === l.id).length}</span><small>${esc(l.note)}</small></button>`).join('')}</div>`
    return `<p class="eyebrow">branch ${D.sections.indexOf(s) + 1} of ${D.sections.length}</p>
<h2>${secIcon(s, 34)} ${esc(s.label)}</h2><p class="lead">${esc(s.note)}</p>${extra}
<h3>${groups.length} ${s.id === 'buyers' ? 'venues' : s.id === 'answers' ? 'buyer questions' : s.id === 'you' ? 'channels' : s.id === 'artifacts' ? 'kinds of artifact' : s.id === 'site' ? 'sections of the site' : 'competitors'}</h3>
<div class="chips stack">${groups.map((g) => chip(g.id, groupIcon(g, 24), trunc(g.label, 40), g.sub)).join('')}</div>`
  }
  function groupHtml(n) {
    if (n.comp) return compHtml(n)
    if (n.venue) return venueHtml(n)
    if (n.prompt) return promptHtml(n)
    if (n.art) return artHtml(n)
    if (n.sg) return siteGroupHtml(n)
    return youHtml(n)
  }
  function compHtml(n) {
    const c = n.comp, lane = laneById[c.lane]
    return `${crumb(n)}<p class="eyebrow" style="color:${lane.color}">${esc(lane.label)} · ${esc(c.price)}</p>
<h2>${compIcon(c, 36)} ${esc(c.name)} <a class="muted" href="https://${esc(c.domain)}" target="_blank" rel="noopener">${esc(c.domain)} ↗</a></h2>
<blockquote>“${esc(c.tag)}”</blockquote>
<p class="lead"><b>vs ${esc(D.brain.brand.name)}.</b> ${esc(c.vs)}</p>
<h3>Where they market</h3><div class="chips stack">${c.channels.map((ch) => chip(c.id + ':' + ch, chIcon(ch, 24), D.channels[ch].label, c.data[ch]?.stat)).join('')}</div>
<h3>People</h3><ul class="people">${c.founders.map((f) => `<li><span class="pav">${esc(f.name[0])}</span><div><b>${esc(f.name)}</b><span class="muted">${esc(f.role)} · ${esc(f.handle)}</span></div></li>`).join('')}</ul>
<h3>Their hooks</h3><ul class="hooks">${c.hooks.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`
  }
  function venueHtml(n) {
    const v = n.venue, ts = kids.get(n.id) || []
    return `${crumb(n)}<p class="eyebrow">venue · standing <b style="color:${v.standing === 'good' ? '#6ee7b7' : v.standing === 'warming' ? GOLD : '#f07167'}">${esc(v.standing)}</b> · ${v.filed} filed</p>
<h2>${venIcon(v, 34)} ${esc(v.label)}</h2>
<p class="lead">Threads where a buyer is asking right now. Score is how close the question is to a buying question. He drafts; you approve in the reply box.</p>
<div class="list">${ts.map((t) => threadCard(t, true)).join('')}</div>`
  }
  function threadCard(n, brief) {
    const t = n.thread, [col, st] = STATUS[t.status]
    return `<article class="thread ${brief ? 'brief' : ''}" ${brief ? `data-go="${n.id}"` : ''}>
<header><span class="score" style="--c:${t.score > 75 ? '#6ee7b7' : t.score > 50 ? GOLD : DIM}">${t.score}</span><div><b>${esc(t.title)}</b><span>${esc(t.author)} · ${esc(t.age)} · ${esc(t.intent)}</span></div><em style="color:${col}">${esc(t.status)}</em></header>
<p>${esc(t.snippet)}</p>${brief ? '' : t.draft ? `<div class="draft"><small>${iconImg({ shape: 'circle', bg: GOLD, icon: 'sparkle' }, 14)} his draft · your voice</small><p>${nl(t.draft)}</p><footer><span style="color:${col}">${esc(st)}</span>${t.status === 'draft' ? `<button data-act="Approve">Approve</button><button data-act="Edit" class="ghost">Edit</button><button data-act="Skip" class="ghost">Skip</button>` : ''}</footer></div>` : `<div class="draft skip"><small>skipped</small><p>${esc(t.why)}</p></div>`}
</article>`
  }
  function promptHtml(n) {
    const p = n.prompt
    return `${crumb(n)}<p class="eyebrow">buyer question · ${esc(p.intent)}</p>
<h2>${iconImg({ shape: 'circle', bg: n.color, icon: 'bubble?' }, 34)} “${esc(p.text)}”</h2>
<p class="lead">Asked verbatim of three engines. Green means ${esc(D.brain.brand.name)} is named in the answer.</p>
<div class="list">${p.results.map((r) => `<article class="engine ${r.named ? 'ok' : 'no'}" data-go="${p.id}:${r.engine}"><header>${engIcon(r.engine, 30)}<div><b>${esc(D.engines[r.engine].label)}</b><span>${r.named ? `names ${esc(D.brain.brand.name)}${r.position ? ' at #' + r.position : ''}` : 'does not name ' + esc(D.brain.brand.name)}</span></div>${iconImg({ shape: 'circle', bg: r.named ? '#6ee7b7' : '#f07167', icon: r.named ? 'check' : 'cross' }, 20)}</header><div class="tags">${r.brands.length ? r.brands.map((b) => `<span class="tag ${b === D.brain.brand.name ? 'me' : ''}">${esc(b)}</span>`).join('') : '<span class="tag">no product named</span>'}</div></article>`).join('')}</div>`
  }
  const leafIcon = (m, size = 22) => m.chan ? chIcon(m.chan, size) : m.thread ? iconImg({ shape: 'circle', bg: m.color, icon: 'bubble' }, size) : m.engine ? engIcon(m.engine, size) : iconImg({ shape: 'square', bg: m.color, icon: m.icon }, size)
  const carried = (id) => { const ls = linked.get(id) || []; return ls.length ? `<h3>Carried by</h3><div class="chips stack">${ls.map((l) => { const m = byId.get(l.id); return m ? chip(m.id, m.kind === 'group' ? groupIcon(m, 22) : leafIcon(m, 22), trunc(m.label, 34), l.label) : '' }).join('')}</div>` : '' }
  function artHtml(n) {
    const a = n.art, ls = kids.get(n.id) || []
    return `${crumb(n)}<p class="eyebrow" style="color:${a.color}">${esc(a.stat)}</p><h2>${groupIcon(n, 34)} ${esc(a.label)}</h2><p class="lead">${esc(a.note)}</p>
<div class="list">${ls.map((m) => `<article class="brief-card" data-go="${m.id}"><header>${leafIcon(m, 26)}<div><b>${esc(m.label)}</b><span>${esc(m.sub)}</span></div><i class="dot" style="background:${m.color}"></i></header></article>`).join('')}</div>`
  }
  function artLeafHtml(n) {
    const head = (title, sub) => `${crumb(n)}<h2>${leafIcon(n, 34)} ${esc(title)}</h2><p class="eyebrow" style="color:${n.color}">${esc(sub)}</p>`
    if (n.post) { const p = n.post; return `${head(p.title, p.verdict)}<dl class="kv"><dt>Published</dt><dd>${p.date} · ${p.words} words</dd><dt>Keyword</dt><dd><span class="tag ${p.tone === 'bad' ? 'bad' : 'me'}">${esc(p.keyword)}</span></dd><dt>URL</dt><dd class="gu">${esc(D.brain.brand.domain)}/blog/${esc(p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48))}</dd></dl><p class="lead">${esc(p.note)}</p>${carried(n.id)}` }
    if (n.pr) { const p = n.pr; return `${head(p.title, `${p.status} · ${p.delta} audit score`)}<dl class="kv"><dt>Repo</dt><dd class="gu">${esc(p.repo)}</dd><dt>Files</dt><dd>${p.files} changed</dd><dt>Opened</dt><dd>${p.date}</dd></dl><p class="lead">${esc(p.note)}</p>${p.status === 'open' ? '<div class="draft"><small>waiting for you</small><footer><span>Review the diff in your repo.</span><button data-act="Merge">Merge</button><button data-act="Close" class="ghost">Close</button></footer></div>' : ''}` }
    if (n.pitch) { const p = n.pitch; return `${head(p.site, `${p.status} · DR ${p.dr} · fee ${p.fee}`)}<p class="lead">${esc(p.note)}</p>${carried(n.id)}${p.status === 'quoted' ? `<div class="draft"><small>editor named a fee</small><footer><span>${esc(p.fee)} for a live link on ${esc(p.site)}.</span><button data-act="Pay">Pay ${esc(p.fee)}</button><button data-act="Skip" class="ghost">Skip</button></footer></div>` : ''}` }
    const so = n.soc; return `${head(D.channels[so.channel].label + ' · ' + so.when, so.status)}<article class="post"><header>${compIcon({ name: D.brain.brand.name, domain: D.brain.brand.domain, lane: 'reply' }, 30)}<div><b>${esc(D.brain.brand.name)}</b><span>${esc(so.when)} · ${esc(so.status)}</span></div>${chIcon(so.channel, 18)}</header><p>${esc(so.text)}</p></article>${carried(n.id)}${so.status !== 'posted' ? '<div class="draft"><small>your calendar</small><footer><span>Posts on schedule once approved.</span><button data-act="Approve">Approve</button><button data-act="Edit" class="ghost">Edit</button></footer></div>' : ''}`
  }
  const spark = (tr, color) => { const mx = Math.max(...tr), w = 120, h = 30; const pts = tr.map((v, i) => `${(i / (tr.length - 1)) * w},${h - (v / mx) * (h - 2) - 1}`).join(' '); return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/></svg>` }
  const srcBar = (src) => { const C = { search: '#5bc27a', ai: '#f0abfc', reddit: '#ff6a3d', direct: '#e7e5e4', social: '#4c9be8' }; return `<div class="bar">${Object.entries(src).map(([k, v]) => `<i style="width:${v}%;background:${C[k]}" title="${k} ${v}%"></i>`).join('')}</div><div class="barkey">${Object.entries(src).map(([k, v]) => `<span><i style="background:${C[k]}"></i>${k} ${v}%</span>`).join('')}</div>` }
  function siteGroupHtml(n) {
    const g = n.sg, ls = kids.get(n.id) || []
    return `${crumb(n)}<p class="eyebrow" style="color:${g.color}">${esc(n.sub)}</p><h2>${groupIcon(n, 34)} ${esc(g.label)}</h2>
<table class="pages"><tr><th>page</th><th>visits</th><th>trials</th><th>AI bots</th><th>cited</th><th>issues</th></tr>${ls.map((m) => { const p = m.page; return `<tr data-go="${m.id}"><td><i class="dot" style="background:${m.color}"></i><b>${esc(p.path)}</b><span>${esc(p.title)}</span></td><td>${fmtN(p.visits)}</td><td>${p.trials}</td><td>${Object.values(p.bots).reduce((a, b) => a + b, 0)}</td><td>${p.cited || '·'}</td><td>${p.issues.length || '·'}</td></tr>` }).join('')}</table>`
  }
  function pageHtml(n) {
    const p = n.page, ok = (b) => iconImg({ shape: 'circle', bg: b ? '#6ee7b7' : '#f07167', icon: b ? 'check' : 'cross' }, 16)
    const bots = Object.entries(p.bots)
    return `${crumb(n)}<p class="eyebrow" style="color:${n.color}">${esc(n.sub)}</p><h2>${leafIcon(n, 34)} ${esc(p.path)}</h2><p class="lead">${esc(p.title)} <a class="muted" href="https://${esc(D.site.domain + p.path)}" target="_blank" rel="noopener">open ↗</a></p>
<div class="tiles"><div class="tile wide"><small>visits · 12 weeks</small><b>${fmtN(p.visits)}</b>${spark(p.trend, n.color)}</div><div class="tile"><small>trials started</small><b>${p.trials}</b></div><div class="tile"><small>search impressions</small><b>${fmtN(p.gsc.impressions)}</b><em>${p.gsc.clicks} clicks · pos ${p.gsc.pos}</em></div><div class="tile"><small>backlinks</small><b>${p.backlinks}</b></div></div>
<h3>Where visits come from</h3>${srcBar(p.src)}
<h3>AI crawlers · 30d</h3><div class="tiles four">${bots.map(([b, v]) => `<div class="tile ${v ? '' : 'off'}"><small>${esc(b)}</small><b>${v}</b></div>`).join('')}</div>
<h3>Cited by engines</h3><p class="lead">${p.cited ? `${p.cited} of 3 engines quote this page on a buyer question. ${Object.keys(D.engines).slice(0, p.cited).map((e) => engIcon(e, 20)).join(' ')}` : 'No engine cites this page yet.'}</p>
${p.kws.length ? `<h3>Brief keywords on this page</h3><div class="tags">${p.kws.map((k) => `<span class="tag me">${esc(k.k)} <em>#${k.pos}</em></span>`).join('')}</div>` : ''}
<h3>Health</h3><ul class="health"><li>${ok(p.indexed)}indexed · last change ${p.changed}</li><li>${ok(p.schema)}schema markup</li><li>${ok(p.llms)}listed in llms.txt</li><li>${ok(p.titleLen <= 60)}title ${p.titleLen} chars</li><li>${ok(p.metaLen <= 160)}meta ${p.metaLen} chars</li><li>${ok(p.words >= 350)}${p.words} words</li><li>${ok(p.linksIn >= 2)}${p.linksIn} internal links in · ${p.linksOut} out</li><li>${ok(p.lcp <= 2.5)}LCP ${p.lcp}s</li></ul>
${p.issues.length ? `<div class="draft"><small>${p.issues.length} fixes he would open as a PR</small><p>${p.issues.map(esc).join(' · ')}</p><footer><span>Into your repo, you merge.</span><button data-act="Open PR">Open PR</button></footer></div>` : ''}${carried(n.id)}`
  }
  function policyHtml(pol) {
    const rg = D.rungs[pol.rung]
    const cell = (icon, k, v) => `<div class="pol">${icon}<div><small>${k}</small><b>${esc(v)}</b></div></div>`
    return `<h3>Policy · as set in product settings</h3><div class="pols">
${cell(iconImg({ shape: 'circle', bg: D.standing[pol.standing], icon: 'check' }, 22), 'standing', pol.standing)}
${cell(iconImg({ shape: 'circle', bg: rg.color, icon: rg.short }, 22), 'autonomy rung', rg.label)}
${cell(iconImg({ shape: 'circle', bg: pol.auto ? INK : '#141210', fg: pol.auto ? BG : INK, icon: pol.auto ? '∞' : '✓', ring: INK }, 22), 'posting', pol.auto ? 'auto, after attest' : 'you approve each one')}
${cell(iconImg({ shape: 'circle', bg: '#141210', fg: INK, icon: String(pol.cap), ring: DIM }, 22), 'daily cap', `${pol.cap} / day`)}
${cell(iconImg({ shape: 'circle', bg: '#141210', fg: INK, icon: 'D', ring: DIM }, 22), 'schedule', pol.days)}
${cell(iconImg({ shape: 'circle', bg: '#141210', fg: INK, icon: 'link', ring: DIM }, 22), 'links', pol.link)}
${cell(iconImg({ shape: 'circle', bg: '#141210', fg: INK, icon: 'person', ring: DIM }, 22), 'identity', pol.identity)}
${cell(iconImg({ shape: 'circle', bg: '#141210', fg: INK, icon: 'target', ring: DIM }, 22), 'where', pol.rooms)}
</div>`
  }
  function youHtml(n) {
    const ch = n.chan, d = D.channels[ch]
    if (n.gap) {
      const running = D.competitors.filter((c) => c.channels.includes(ch))
      return `${crumb(n)}<p class="eyebrow">your channel · gap</p><h2>${groupIcon(n, 34)} ${esc(d.label)} <span class="muted">not running</span></h2>
<p class="lead">${running.length} of ${D.competitors.length} competitors market here. You do not. Click one to see what they run.</p>
<div class="chips stack">${running.map((c) => chip(c.id + ':' + ch, compIcon(c, 24), c.name, c.data[ch]?.stat)).join('')}</div>`
    }
    const data = D.you.data[ch]
    return `${crumb(n)}<p class="eyebrow">your channel · <span style="color:${d.color}">${esc(d.label)}</span></p>
<h2>${groupIcon(n, 34)} ${esc(d.label)} <span class="muted">${esc(data.stat)}</span></h2>
<p class="source"><span class="dot"></span>${esc(d.source)} <em>mock</em></p>${n.pol ? policyHtml(n.pol) : ''}${carried(n.id)}<h3>Recent</h3>${(renderers[ch] || (() => ''))(D.you.profile, data)}`
  }
  function leafHtml(n) {
    if (n.chan) { const c = n.comp, d = D.channels[n.chan], data = c.data[n.chan]; return `${crumb(n)}<h2>${chIcon(n.chan, 34)} ${esc(d.label)} <span class="muted">${esc(data.stat)}</span></h2><p class="source"><span class="dot"></span>${esc(d.source)} <em>mock</em></p>${(renderers[n.chan] || (() => ''))(c, data)}` }
    if (n.section === 'artifacts') return artLeafHtml(n)
    if (n.page) return pageHtml(n)
    if (n.thread) return `${crumb(n)}<p class="eyebrow">thread · ${esc(venueById[n.thread.venue].label)}</p><div class="list">${threadCard(n, false)}</div>${carried(n.id)}`
    const r = n.result, p = n.prompt, e = D.engines[r.engine]
    const hl = (s) => { let out = esc(s); for (const b of r.brands) out = out.replace(new RegExp(esc(b).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `<mark class="${b === D.brain.brand.name ? 'me' : ''}">${esc(b)}</mark>`); return out }
    return `${crumb(n)}<p class="eyebrow">“${esc(p.text)}”</p>
<h2>${engIcon(r.engine, 34)} ${esc(e.label)} ${iconImg({ shape: 'circle', bg: r.named ? '#6ee7b7' : '#f07167', icon: r.named ? 'check' : 'cross' }, 22)} <span class="muted">${r.named ? `names ${esc(D.brain.brand.name)}${r.position ? ' at #' + r.position : ''}` : `does not name ${esc(D.brain.brand.name)}`}</span></h2>
<article class="answer"><p>${hl(r.excerpt)}</p><h4>Named</h4><div class="tags">${r.brands.length ? r.brands.map((b) => `<span class="tag ${b === D.brain.brand.name ? 'me' : ''}">${esc(b)}</span>`).join('') : '<span class="tag">nobody</span>'}</div><h4>Sources cited</h4><div class="tags">${r.sources.length ? r.sources.map((s) => `<span class="tag src">${esc(s)}</span>`).join('') : '<span class="tag">none shown</span>'}</div></article>
${carried(n.id)}${r.named ? '' : `<p class="lead"><b>Next job.</b> The named products have a source the engine can quote for this question. Earn one: a thread reply that answers it, and a post on your domain that names the rivals.</p>`}`
  }

  const av = (c, size = 28) => c.domain ? compIcon(c, size) : `<span class="av" style="background:linear-gradient(135deg,${c.colors[0]},${c.colors[1]});width:${size}px;height:${size}px;font-size:${size * 0.5}px">${esc(c.name[0])}</span>`
  const renderers = {
    meta: (c, data) => `<div class="ads">${data.items.map((a) => `
<article class="ad ${a.status.toLowerCase()}"><header>${av(c)}<div><b>${esc(c.name)}</b><span>Sponsored · ${esc(a.platforms.join(', '))}</span></div><span class="status">${a.status}</span></header>
<p class="primary">${nl(a.primary)}</p>
<div class="creative ${a.format.toLowerCase()}" style="background:linear-gradient(135deg,${a.bg[0]},${a.bg[1]})">${a.format === 'Carousel' ? `<div class="cards">${[0, 1, 2].map((i) => `<div class="card"><b>${esc(c.proofs[i % c.proofs.length])}</b></div>`).join('')}</div>` : `<span class="hook">${esc(a.hook)}</span>`}${a.format === 'Video' ? '<span class="play">▶</span>' : ''}<span class="fmt">${a.format}${a.variants > 1 ? ` · ${a.variants} versions` : ''}</span></div>
<footer><div><small>${esc(a.url)}</small><b>${esc(a.headline)}</b><span>${esc(a.description)}</span></div><button>${esc(a.cta)}</button></footer>
<ul class="facts"><li>Started ${a.started} <em>${a.since}</em></li><li>EU reach ${a.reach_eu}</li><li>ID ${a.id}</li></ul></article>`).join('')}</div>`,
    google: (c, data) => `<div class="list">${data.items.map((a) => `<article class="gad"><p class="eyebrow">${chIcon('google', 14)} ${esc(a.format)} · ${esc(a.regions.join(' · '))} · ${a.first} → ${a.last}</p><b class="gh">${a.headlines.map(esc).join(' | ')}</b><span class="gu">${esc(a.display)}</span><p>${a.descriptions.map(esc).join(' ')}</p><div class="tags">${a.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></article>`).join('')}</div>`,
    x: (c, data) => `<div class="list">${data.items.map((p) => `<article class="post x"><header>${av(c, 30)}<div><b>${esc(c.name)}</b><span>${esc(p.handle)} · ${p.ago}</span></div>${chIcon('x', 18)}</header><p>${nl(p.text)}</p><ul class="facts"><li>♡ ${p.likes}</li><li>⟲ ${p.reposts}</li><li>↩ ${p.replies}</li><li>${p.views} views</li><li class="kind">${p.kind}</li></ul></article>`).join('')}</div>`,
    linkedin: (c, data) => `<div class="list">${data.items.map((p) => `<article class="post li"><header>${av(c, 30)}<div><b>${esc(c.name)}</b><span>${data.followers.toLocaleString()} followers · ${p.ago} · ${esc(p.type)}</span></div>${chIcon('linkedin', 18)}</header><p>${nl(p.text)}</p><ul class="facts"><li>👍 ${p.reactions}</li><li>${p.comments} comments</li><li>${p.reposts} reposts</li></ul></article>`).join('')}</div>`,
    founders: (c, data) => `<div class="list">${data.items.map((f) => `<article class="person"><header><span class="pav big">${esc(f.name[0])}</span><div><b>${esc(f.name)}</b><span>${esc(f.role)} · ${esc(f.handle)}</span><span>${f.followers_fmt} followers on ${esc(f.platform)} · posts ${esc(f.cadence)}</span></div></header><p class="quote">“${esc(f.last.text)}”<small>${f.last.ago} · ♡ ${f.last.likes}</small></p><div class="tags">${f.topics.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></article>`).join('')}</div>`,
    reddit: (c, data) => `<div class="list">${data.items.map((p) => `<article class="post rd ${p.promo ? 'promo' : ''}"><header>${chIcon('reddit', 18)}<span class="sub">${esc(p.sub)}</span><span class="thr">${esc(p.thread)}</span></header><p>${esc(p.text)}</p><ul class="facts"><li>${esc(p.account)}</li><li>${p.score > 0 ? '▲' : '▼'} ${p.score}</li><li>${p.ago}</li>${p.promo ? '<li class="warn">self-promo</li>' : ''}</ul></article>`).join('')}</div>`,
    ph: (c, data) => `<div class="list">${data.items.map((l) => `<article class="launch"><header>${av(c, 40)}<div><b>${esc(l.name)}</b><span>${esc(l.tagline)}</span></div><span class="up">▲ ${l.upvotes}</span></header><ul class="facts"><li>${esc(l.rank)}</li><li>${l.comments} comments</li><li>${l.date}</li><li>by ${esc(l.maker)}</li></ul></article>`).join('')}</div>`,
    youtube: (c, data) => `<div class="list">${data.items.map((v) => `<article class="video"><div class="thumb" style="background:linear-gradient(135deg,${c.colors[0]},${c.colors[1]})"><span>▶</span><em>${v.duration}</em></div><div><b>${esc(v.title)}</b><span>${v.views} views · ${v.ago} · ${esc(v.kind)}</span></div></article>`).join('')}</div>`,
    blog: (c, data) => `<div class="list">${data.items.map((p) => `<article class="bpost"><b>${esc(p.title)}</b><span class="gu">${esc(c.domain)}${esc(p.slug)}</span><ul class="facts"><li>${p.date}</li><li>${p.words} words</li><li>~${p.traffic}/mo</li>${p.ai ? '<li class="warn">reads AI-written</li>' : ''}</ul><div class="tags">${p.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join('')}</div></article>`).join('')}</div>`,
    newsletter: (c, data) => `<div class="list">${data.items.map((n) => `<article class="mail"><b>${esc(n.subject)}</b><p>${esc(n.preview)}</p><ul class="facts"><li>${n.ago}</li><li>${n.open} open</li><li>${n.list} list</li></ul></article>`).join('')}</div>`,
    affiliates: (c, data) => `<dl class="kv">${data.items.map((i) => `<dt>${esc(i.k)}</dt><dd>${esc(i.v)}</dd>`).join('')}</dl>`,
  }
  renderers.threads = renderers.x; renderers.dev = renderers.linkedin

  // ---- chrome ----------------------------------------------------------------
  const filters = $('#filters')
  filters.innerHTML = `<button class="f on" data-f="">All</button>` + D.sections.map((s) => `<button class="f" data-f="s:${s.id}" style="--c:${s.color}">${secIcon(s, 16)}${esc(s.short)}</button>`).join('')
  $('#lanes').innerHTML = D.lanes.map((l) => `<button class="f sm" data-f="l:${l.id}" style="--c:${l.color}"><i></i>${esc(l.label)} <span>${D.competitors.filter((c) => c.lane === l.id).length}</span></button>`).join('')
  function setFilter(key) {
    state.filter = !key ? null : key.startsWith('s:') ? { section: key.slice(2) } : { lane: key.slice(2) }
    document.querySelectorAll('[data-f]').forEach((b) => b.classList.toggle('on', (b.dataset.f || '') === (key || '')))
    layout()
    if (state.selected && byId.get(state.selected)?.talpha === 0) select(null); else if (state.selected) select(state.selected); else fitAll()
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) setFilter(b.dataset.f); const l = e.target.closest('[data-lane]'); if (l) { setFilter('l:' + l.dataset.lane); select(null) } })
  $('#search').addEventListener('input', (e) => { state.query = e.target.value.trim().toLowerCase() })
  $('#legend').innerHTML = Object.entries(D.channels).map(([k, d]) => `<span title="${esc(d.source)}">${chIcon(k, 16)}${esc(d.label)}</span>`).join('') +
    Object.entries(D.engines).map(([k, e]) => `<span>${engIcon(k, 16)}${esc(e.label)}</span>`).join('') +
    Object.entries(STATUS).map(([k, v]) => `<span>${iconImg({ shape: 'circle', bg: v[0], icon: 'bubble' }, 16)}${k}</span>`).join('') +
    Object.entries(D.rungs).map(([k, r]) => `<span>${iconImg({ shape: 'circle', bg: r.color, icon: r.short }, 16)}${esc(r.label)}</span>`).join('') +
    ['good', 'warming', 'limited'].map((k) => `<span>${iconImg({ shape: 'square', bg: '#141210', fg: INK, icon: 'flag', ring: D.standing[k], ringW: 3 }, 16)}standing ${k}</span>`).join('')
  $('#fit').addEventListener('click', fitAll)
  $('#insights').innerHTML = `${iconImg({ shape: 'circle', bg: GOLD, icon: 'sparkle' }, 16)} Insights <span>${insights().length}</span>`
  $('#insights').addEventListener('click', showInsights)
  $('#company').value = D.brain.brand.domain
  $('#build').addEventListener('click', () => { const v = $('#company').value.trim().toLowerCase(); if (v === D.brain.brand.domain) return select('company'); toast(`${v || 'that domain'}: no brief built yet. Only ${D.brain.brand.domain} is wired in this mock.`) })
  document.title = `${D.brain.brand.name} demo`; $('#title').textContent = `${D.brain.brand.name} demo`

  layout()
  for (const n of nodes) { n.x = n.tx * 0.2; n.y = n.ty * 0.2; n.alpha = 0 }
  fitAll()
  const hash = decodeURIComponent(location.hash.slice(1))
  if (hash && byId.has(hash)) select(hash); else showInsights()
  requestAnimationFrame(draw)
  window.__demo = { state, nodes, byId, cam, hit, select, setFilter, layout, settle() { for (const n of nodes) { n.x = n.tx; n.y = n.ty; n.alpha = n.talpha } if (target) { Object.assign(cam, target); target = null } } }
})()
