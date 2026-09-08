import { useEffect, useState } from 'react'
import { Hero } from './components/Hero'
import { SiteHeader } from './components/SiteHeader'
import { MindMap } from './components/MindMap'
import { Stepper } from './components/Stepper'
import { api } from './lib/api'
import type { MapNode, Run } from './lib/types'
import { Autopilot } from './pages/Autopilot'
import { ConnectAds } from './pages/ConnectAds'
import { Launch } from './pages/Launch'

function viewForStep(step: string) {
  if (['product', 'confirmation', 'research'].includes(step)) return 'confirmation'
  if (['concepts', 'creatives'].includes(step)) return 'launch'
  return step === 'done' ? 'autopilot' : step
}

function Working({ run }: { run: Run }) {
  const host = run.domain
  return (
    <div className="ui-page ui-page--narrow text-center">
      <img src="/viewfy-mascot.png" alt="" className="w-28 h-28 mx-auto object-contain" />
      <h2 className="mt-4 font-display font-extrabold text-3xl">Astra is reading {host}</h2>
      <p className="mt-2 ui-muted">Homepage, about, products, pricing, and FAQs. Facts only. No invented claims.</p>
      <ul className="ui-card p-5 mt-6 text-left text-sm ui-body space-y-1">
        {(run.pages.length ? run.pages : [{ kind: 'home', status: 'crawling', url: '', excerpt: '' }]).map((p) => (
          <li key={p.kind} className="flex justify-between border-b ui-border py-1">
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
    window.scrollTo({ top: 0, left: 0 })
  }, [view])

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('run')
    if (!id) return
    api.get(id).then((r) => {
      setRun(r)
      setView(viewForStep(r.step))
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!run) return
    const hot = ['crawling', 'researching', 'writing', 'rendering', 'launching'].includes(run.status)
    if (!hot) return
    const t = window.setInterval(() => {
      api.get(run.id).then((r) => {
        setRun(r)
        if (r.step !== 'understanding') setView((v) => (v === 'url' || v === 'understanding' ? viewForStep(r.step) : v))
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
      setView(viewForStep(r.step))
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
    if (!run || busy || ['researching', 'writing', 'rendering'].includes(run.status)) return
    setBusy(true)
    setErr('')
    try {
      if (run.brief && !run.stale.research && !run.stale.concepts && run.concepts.length) {
        const pick = run.selected_concept_id || run.concepts[0].id
        setRun(await api.select(run.id, pick))
        setView('launch')
      } else {
        setRun(await api.confirm(run.id, ids))
        setView('confirmation')
      }
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not prepare your campaign. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!run || view === 'url') {
    return (
      <>
        <Hero onSubmit={start} busy={busy} />
        {err && <p role="alert" className="text-center text-red-600 dark:text-red-300 -mt-10">{err}</p>}
      </>
    )
  }

  const step = view === 'understanding' ? 'understanding' : view
  const onJump = (id: string) => {
    if (id === 'product' || id === 'understanding' || id === 'confirmation' || id === 'research') {
      setView(run.map.nodes.length ? 'confirmation' : 'understanding')
    } else setView(id)
  }
  return (
    <div className={`site-shell${step === 'confirmation' ? ' glass-map-shell' : ''}`}>
      <SiteHeader onHome={() => { setRun(null); setView('url'); window.history.replaceState({}, '', '/') }} />
      <nav className="wizard-nav" aria-label="Campaign setup">
        <Stepper step={step} onJump={onJump} />
      </nav>
      {err && <p role="alert" className="px-5 py-2 text-sm text-red-600 dark:text-red-300">{err}</p>}
      {run.error && <p role="alert" className="px-5 py-2 text-sm text-red-600 dark:text-red-300">{run.error}</p>}
      {(step === 'understanding' || (run.status === 'crawling' && !run.map.nodes.length)) && <Working run={run} />}
      {step === 'confirmation' && run.map.nodes.length > 0 && (
        <MindMap run={run} nodes={run.map.nodes} onChange={saveNodes} onConfirm={confirm} confirming={busy} />
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
          saving={busy || run.status === 'launching'}
          onContinue={async () => {
            if (busy) return
            setBusy(true)
            try {
              setRun(await api.skipLaunch(run.id))
              setView('autopilot')
            } finally {
              setBusy(false)
            }
          }}
        />
      )}
      {step === 'autopilot' && <Autopilot run={run} onContinue={() => setView('ads')} />}
    </div>
  )
}
