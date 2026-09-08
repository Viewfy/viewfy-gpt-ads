import { useEffect, useState } from 'react'
import { TrackingSetup } from '../components/TrackingSetup'
import { api } from '../lib/api'
import type { Creative, Run } from '../lib/types'

const LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  active: 'Active',
  failed: 'Failed',
}

export function Launch({
  run,
  onContinue,
  onSave,
  onRun,
}: {
  run: Run
  onContinue: (budget: number, geo: string[]) => void
  onSave?: (patch: Partial<Creative>) => void
  onRun?: (run: Run) => void
}) {
  const c = run.creative
  const [budget, setBudget] = useState(run.campaign.budget_usd > 0 ? run.campaign.budget_usd : 25)
  const [geo, setGeo] = useState((run.campaign.geo || []).filter(Boolean).join(', ') || 'US')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(c?.title || '')
  const [body, setBody] = useState(c?.body || '')
  const [cta, setCta] = useState(c?.cta || '')
  const mode = run.campaign.mode
  const [accountName, setAccountName] = useState(run.campaign.account?.name || '')
  const [adsMode, setAdsMode] = useState(mode || '')
  const [refreshing, setRefreshing] = useState(false)
  const insights = run.campaign.insights

  useEffect(() => {
    api.health().then((h) => {
      setAdsMode(h.ads.mode)
      if (h.ads.name) setAccountName(h.ads.name)
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (run.campaign.account?.name) setAccountName(run.campaign.account.name)
  }, [run.campaign.account?.name])

  if ((run.status === 'rendering' || run.status === 'writing') && !c) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <img src="/viewfy-happy.png" alt="" className="w-24 h-24 mx-auto" />
        <p className="mt-4 text-neutral-600 dark:text-[#a39c92]">Writing your ChatGPT card…</p>
      </div>
    )
  }

  function saveEdit() {
    onSave?.({ id: c?.id, title, body, cta, image_url: c?.image_url || undefined })
    setEditing(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-4 pb-8 space-y-6">
      <h2 className="font-display font-extrabold text-3xl">Launch campaign</h2>
      <p className="text-neutral-600 dark:text-[#a39c92]">Credentials stay on the server. Launch is the only action that can spend.</p>
      {(run.creatives?.length ? run.creatives : c ? [c] : []).length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {(run.creatives?.length ? run.creatives : c ? [c] : []).map((ad) => {
            const on = (c?.id || c?.image_url) === (ad.id || ad.image_url)
            return (
              <button
                key={ad.id}
                type="button"
                onClick={() => {
                  setTitle(ad.title)
                  setBody(ad.body)
                  setCta(ad.cta)
                  setEditing(false)
                  onSave?.({ id: ad.id, title: ad.title, body: ad.body, cta: ad.cta, image_url: ad.image_url || undefined })
                }}
                className={`text-left rounded-2xl border p-3 bg-white dark:bg-[#161412] ${
                  on ? 'border-neutral-900 dark:border-white' : 'border-neutral-200 dark:border-white/10'
                }`}
              >
                <img
                  src={ad.image_url || '/superagent-ads.png'}
                  alt=""
                  className="w-full aspect-square rounded-xl object-cover bg-neutral-100 dark:bg-white/5"
                />
                <p className="mt-3 font-display font-bold">{ad.title}</p>
                <p className="text-sm text-neutral-600 dark:text-[#a39c92] mt-1">{ad.body}</p>
              </button>
            )
          })}
        </div>
      )}
      {c && !editing && (
        <button
          type="button"
          className="text-sm font-semibold text-neutral-600 dark:text-[#a39c92] underline underline-offset-2"
          onClick={() => {
            setTitle(c.title)
            setBody(c.body)
            setCta(c.cta)
            setEditing(true)
          }}
        >
          Edit selected
        </button>
      )}
      {c && editing && (
        <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161412] p-4">
          <div className="flex gap-4">
            <img
              src={c.image_url || '/superagent-ads.png'}
              alt=""
              className="w-28 h-28 rounded-xl object-cover bg-neutral-100 dark:bg-white/5 shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 font-display font-bold text-lg"
              />
              <textarea
                value={body}
                maxLength={100}
                rows={3}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm"
              />
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm"
              />
              <p className="text-xs text-neutral-400">{title.length}/50 · {body.length}/100</p>
              <div className="flex gap-2">
                <button type="button" className="btn-accent text-sm py-2 px-4" onClick={saveEdit}>
                  Save
                </button>
                <button type="button" className="text-sm font-semibold text-neutral-500 dark:text-[#a39c92]" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm">
          Lifetime budget (USD)
          <input
            type="number"
            min={1}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Geography
          <input
            value={geo}
            onChange={(e) => setGeo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2"
          />
        </label>
      </div>
      <p className="text-sm text-neutral-500 dark:text-[#a39c92]">
        Ad account: {accountName || (adsMode === 'live' ? 'Connected' : 'Not connected')}
        {run.campaign.review_status ? ` · review ${run.campaign.review_status}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="chip border-neutral-300 dark:border-white/15">{LABELS[run.campaign.status] || run.campaign.status}</span>
        {(mode === 'demo' || adsMode === 'demo') && <span className="chip border-amber-400 text-amber-800 dark:text-amber-300">Demo / export</span>}
        {(mode === 'live' || adsMode === 'live') && <span className="chip border-emerald-400 text-emerald-800 dark:text-emerald-300">Live Ads API</span>}
        {run.campaign.external_ids?.ad_id && onRun && (
          <button
            type="button"
            className="text-sm font-semibold underline underline-offset-2"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true)
              try {
                onRun(await api.refreshAds(run.id))
              } finally {
                setRefreshing(false)
              }
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh status'}
          </button>
        )}
      </div>
      {insights && (
        <p className="text-sm text-neutral-600 dark:text-[#a39c92]">
          {insights.impressions ?? 0} impressions · {insights.clicks ?? 0} clicks · ${insights.spend ?? 0} spend
        </p>
      )}
      {run.campaign.note && <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3">{run.campaign.note}</p>}
      {run.campaign.error && <p className="text-sm text-red-600">{run.campaign.error}</p>}
      {onRun && <TrackingSetup run={run} onRun={onRun} />}
      <button
        type="button"
        className="btn-accent"
        disabled={!c}
        onClick={() => {
          if (editing) saveEdit()
          const places = geo.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean)
          onContinue(budget || 25, places.length ? places : ['US'])
        }}
      >
        Continue
      </button>
    </div>
  )
}
