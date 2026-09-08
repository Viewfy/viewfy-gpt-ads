import { useEffect, useState } from 'react'
import { Hero } from './components/Hero'
import { ThemeToggle } from './components/ThemeToggle'
import { MindMap } from './components/MindMap'
import { Stepper } from './components/Stepper'
import { api } from './lib/api'
import type { MapNode, Run } from './lib/types'
import { Autopilot } from './pages/Autopilot'
import { ConnectAds } from './pages/ConnectAds'
import { Launch } from './pages/Launch'
import { Research } from './pages/Research'

function Working({ run }: { run: Run }) {
  const host = run.domain
  return (
    <div className="max-w-xl mx-auto px-5 pt-10 pb-20 text-center">
      <img src="/viewfy-mascot.png" alt="" className="w-28 h-28 mx-auto object-contain" />
      <h2 className="mt-4 font-display font-extrabold text-3xl">Astra is reading {host}</h2>
      <p className="mt-2 text-neutral-500 dark:text-[#a39c92]">Homepage, about, products, pricing, and FAQs. Facts only. No invented claims.</p>
      <ul className="mt-6 text-left text-sm text-neutral-600 dark:text-[#a39c92] space-y-1">
        {(run.pages.length ? run.pages : [{ kind: 'home', status: 'crawling', url: '', excerpt: '' }]).map((p) => (
          <li key={p.kind} className="flex justify-between border-b border-neutral-200 dark:border-white/10 py-1">
            <span className="capitalize">{p.kind}</span>
            <span>{p.status || '…'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function App() {
  const [run, setRun] = useState<Run | null>(null)
  const [view, setView] = useState('url')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('run')
    if (!id) return
    api.get(id).then((r) => {
      setRun(r)
      setView(r.step === 'understanding' ? 'understanding' : ['concepts', 'creatives'].includes(r.step) ? 'launch' : r.step === 'done' ? 'autopilot' : r.step)
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!run) return
    const hot = ['crawling', 'researching', 'writing', 'rendering', 'launching'].includes(run.status)
    if (!hot) return
    const t = window.setInterval(() => {
      api.get(run.id).then((r) => {
        setRun(r)
        if (r.step !== 'understanding') setView((v) => (v === 'url' || v === 'understanding' ? r.step : v))
      }).catch(() => undefined)
    }, 1600)
    return () => window.clearInterval(t)
  }, [run?.id, run?.status])

  async function start(domain: string) {
    setBusy(true)
    setErr('')
    try {
      const r = await api.create(domain)
      setRun(r)
      setView('understanding')
      const u = new URL(window.location.href)
      u.searchParams.set('run', r.id)
      window.history.replaceState({}, '', u)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not start')
    } finally {
      setBusy(false)
    }
  }

  async function saveNodes(nodes: MapNode[]) {
    if (!run) return
    const r = await api.saveMap(run.id, nodes, run.map.missing)
    setRun(r)
  }

  async function confirm(ids: string[]) {
    if (!run) return
    setBusy(true)
    try {
      const r = await api.confirm(run.id, ids)
      setRun(r)
      setView('research')
    } finally {
      setBusy(false)
    }
  }

  if (!run || view === 'url') {
    return (
      <>
        <Hero onSubmit={start} busy={busy} />
        {err && <p className="text-center text-red-500 -mt-10">{err}</p>}
      </>
    )
  }

  const step = view === 'understanding' ? 'understanding' : view
  const onJump = (id: string) => {
    if (id === 'product' || id === 'understanding' || id === 'confirmation') {
      setView(run.map.nodes.length ? 'confirmation' : 'understanding')
    } else setView(id)
  }
  const steps = <Stepper step={step} onJump={onJump} />
  const bodyWidth =
    step === 'launch' || step === 'creatives' || step === 'ads'
      ? 'max-w-3xl'
      : step === 'autopilot'
        ? 'max-w-4xl'
      : step === 'understanding'
        ? 'max-w-xl'
        : 'max-w-6xl'

  return (
    <div className={step === 'confirmation' ? 'min-h-screen bg-[#0c0b0a] text-[#f4efe6]' : 'min-h-screen bg-[#F8F5F1] text-neutral-900 dark:bg-[#0c0b0a] dark:text-[#f4efe6]'}>
      <header className={`sticky top-0 z-20 border-b px-5 py-3 flex items-center justify-between gap-4 ${step === 'confirmation' ? 'bg-[#0c0b0a] border-white/10 text-[#f4efe6]' : 'bg-[#F8F5F1]/90 dark:bg-[#0c0b0a]/90 backdrop-blur border-black/5 dark:border-white/10'}`}>
        <button type="button" className="flex items-center gap-2" onClick={() => { setRun(null); setView('url'); window.history.replaceState({}, '', '/') }}>
          <img src="/viewfy-mascot.png" alt="" className="w-7 h-7" />
          <span className="font-display font-extrabold">Viewfy 💙 GPT Ads</span>
        </button>
        <ThemeToggle />
      </header>
      {run.error && <p className="px-5 py-2 text-sm text-red-600">{run.error}</p>}
      <div className={`${step === 'confirmation' ? 'max-w-none' : bodyWidth} mx-auto px-5 pt-6 ${step === 'confirmation' ? 'flex justify-center' : ''}`}>
        {steps}
      </div>
      {(step === 'understanding' || (run.status === 'crawling' && !run.map.nodes.length)) && <Working run={run} />}
      {step === 'confirmation' && run.map.nodes.length > 0 && (
        <MindMap run={run} nodes={run.map.nodes} onChange={saveNodes} onConfirm={confirm} confirming={busy} />
      )}
      {step === 'research' && (
        <Research
          run={run}
          onNext={async () => {
            setBusy(true)
            try {
              let current = run
              if (!current.concepts.length) current = await api.concepts(current.id)
              const pick = current.selected_concept_id || current.concepts[0]?.id
              if (pick) current = await api.select(current.id, pick)
              setRun(current)
              setView('launch')
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
      {(step === 'creatives' || step === 'launch') && (
        <Launch
          run={run}
          onRun={setRun}
          onSave={async (p) => setRun(await api.patchCreative(run.id, p))}
          onContinue={async (budget, geo) => {
            setRun(await api.saveCampaign(run.id, budget, geo))
            setView('ads')
          }}
        />
      )}
      {step === 'ads' && (
        <ConnectAds
          run={run}
          launching={run.status === 'launching'}
          onRun={setRun}
          onLaunch={async () => {
            const budget = run.campaign.budget_usd || 25
            const geo = (run.campaign.geo || []).filter(Boolean)
            const next = await api.launch(run.id, budget, geo.length ? geo : ['US'])
            setRun(next)
            setView('autopilot')
          }}
        />
      )}
      {step === 'autopilot' && <Autopilot run={run} />}
    </div>
  )
}
