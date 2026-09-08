import { useState } from 'react'
import { api } from '../lib/api'
import type { Run } from '../lib/types'

const KEY_URL = 'https://ads.openai.com/settings?act=adacct_6a9f63bbdb10819e87b23fd178c50b5b'

const LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  active: 'Active',
  failed: 'Failed',
}

const STEPS = ['Get a key', 'Save it', 'Create the ad'] as const

export function ConnectAds({
  run,
  launching,
  onRun,
  onLaunch,
}: {
  run: Run
  launching?: boolean
  onRun: (run: Run) => void
  onLaunch: () => void
}) {
  const live = run.campaign.mode === 'live'
  const connected = live && Boolean(run.campaign.connected || run.campaign.account?.name)
  const [phase, setPhase] = useState(connected ? 3 : 1)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const insights = run.campaign.insights

  async function saveKey() {
    if (!key.trim()) return
    setBusy(true)
    try {
      const next = await api.connectAds(run.id, key)
      onRun(next)
      setKey('')
      if (next.campaign.mode === 'live' && (next.campaign.connected || next.campaign.account?.name)) {
        setPhase(3)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-4 pb-8 space-y-6">
      <header>
        <h2 className="font-display font-extrabold text-3xl">Connect ads</h2>
        <p className="text-sm text-neutral-500 dark:text-[#6b6560] mt-2">
          Step {phase} of {STEPS.length} · {STEPS[phase - 1]}
        </p>
      </header>

      {phase === 1 && (
        <section className="space-y-4">
          <p className="text-neutral-600 dark:text-[#a39c92]">
            Open Ads Manager and create a key for this ad account.
          </p>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => {
              window.open(KEY_URL, '_blank', 'noopener,noreferrer')
              setPhase(2)
            }}
          >
            Get API Key
            <span aria-hidden>↗</span>
          </button>
        </section>
      )}

      {phase === 2 && (
        <section className="space-y-4">
          <p className="text-neutral-600 dark:text-[#a39c92]">
            Paste the key. Viewfy stores it on the server for this run only.
          </p>
          <label className="block text-sm">
            Ads Manager API key
            <input
              type="password"
              value={key}
              autoComplete="off"
              autoFocus
              placeholder="sk-… or Ads Manager key"
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2"
            />
          </label>
          {run.campaign.error && <p className="text-sm text-red-600">{run.campaign.error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary" disabled={busy || !key.trim()} onClick={saveKey}>
              {busy ? 'Saving…' : 'Save API Key'}
            </button>
            <button type="button" className="text-sm font-semibold underline underline-offset-2" onClick={() => setPhase(1)}>
              Back
            </button>
          </div>
        </section>
      )}

      {phase === 3 && (
        <section className="space-y-4">
          <p className="text-neutral-600 dark:text-[#a39c92]">Key is saved. Create the ChatGPT ad.</p>
          {connected && run.campaign.account?.name && (
            <p className="text-sm text-neutral-600 dark:text-[#a39c92]">
              Account: <span className="font-semibold text-neutral-900 dark:text-[#f4efe6]">{run.campaign.account.name}</span>
              {run.campaign.account.review ? ` · review ${run.campaign.account.review}` : ''}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="chip border-neutral-300 dark:border-white/15">{LABELS[run.campaign.status] || run.campaign.status}</span>
            {connected && <span className="chip border-emerald-400 text-emerald-800 dark:text-emerald-300">Key saved</span>}
          </div>
          {insights && (
            <p className="text-sm text-neutral-600 dark:text-[#a39c92]">
              {insights.impressions ?? 0} impressions · {insights.clicks ?? 0} clicks · ${insights.spend ?? 0} spend
            </p>
          )}
          {run.campaign.note && <p className="text-sm text-neutral-500 dark:text-[#a39c92]">{run.campaign.note}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-accent"
              disabled={launching || !connected || !run.creative}
              onClick={onLaunch}
            >
              {launching ? 'Creating…' : 'Create Ad'}
            </button>
            <button type="button" className="text-sm font-semibold underline underline-offset-2" onClick={() => setPhase(2)}>
              Use a different key
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
