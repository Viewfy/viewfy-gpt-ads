import { useState } from 'react'
import { ActionBar } from '../components/ActionBar'
import { TrackingSetup } from '../components/TrackingSetup'
import { CreativeVariantPicker } from '../components/CreativeVariantPicker'
import { api } from '../lib/api'
import { hasCampaignIds, isCampaignConnected } from '../lib/campaign-state'
import { getCreativeVariantGroups } from '../lib/creative-variants'
import { safeExternalUrl } from '../lib/external-url'
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
  onSave?: (patch: Partial<Creative>) => Promise<void> | void
  onRun?: (run: Run) => void
}) {
  const c = run.creative
  const ads = run.creatives?.length ? run.creatives : c ? [c] : []
  const variantGroups = getCreativeVariantGroups(run)
  const [budget, setBudget] = useState(run.campaign.budget_usd > 0 ? run.campaign.budget_usd : 25)
  const [geo, setGeo] = useState((run.campaign.geo || []).filter(Boolean).join(', ') || 'US')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [cta, setCta] = useState('')
  const live = run.campaign.mode === 'live'
  const connected = isCampaignConnected(run.campaign)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const insights = live ? run.campaign.insights : null
  const trackingOn = run.tracking && run.tracking.status && run.tracking.status !== 'idle'

  if ((run.status === 'rendering' || run.status === 'writing') && !c) {
    return (
      <div className="ui-page ui-page--narrow text-center">
        <img src="/viewfy-happy.png" alt="" className="w-24 h-24 mx-auto" />
        <p className="mt-4 ui-body">Writing your ChatGPT card…</p>
      </div>
    )
  }

  function startEdit(ad: Creative) {
    setTitle(ad.title)
    setBody(ad.body)
    setCta(ad.cta)
    setEditingId(ad.id)
  }

  function saveEdit() {
    const ad = ads.find((item) => item.id === editingId)
    if (!ad) return
    onSave?.({ id: ad.id, title, body, cta, image_url: ad.image_url || undefined })
    setEditingId(null)
  }

  return (
    <div className={`ui-page ${variantGroups.length ? 'ui-page--medium' : 'ui-page--narrow'} ui-page--actions space-y-4`}>
      <h2 className="font-display font-extrabold text-3xl">Launch campaign</h2>

      {variantGroups.length > 0 && <CreativeVariantPicker key={run.id} groups={variantGroups} ads={ads} onSave={onSave} />}

      {ads.length > 0 && (
        <section>
          <h3 className="font-display font-extrabold text-lg">Ads</h3>
          <p className="text-sm ui-muted mt-0.5">
            {ads.length === 1 ? 'Review your ChatGPT ad before continuing.' : `Review these ${ads.length} ChatGPT ads before continuing.`}
          </p>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {ads.map((ad) => {
              const editing = editingId === ad.id
              const isDemo = ad.image_url?.startsWith('/demo-ads/')
                || ['getsuperagent.com', 'www.getsuperagent.com'].includes(run.domain.toLowerCase())
                  && ['/superagent-ads.png', '/superagent-ads-2.png'].includes(ad.image_url || '')
              const concept = run.concepts.find((item) => item.id === ad.concept_id)
              const destinationUrl = safeExternalUrl(ad.target_url)
              const artworkUrl = ad.image_url?.startsWith('/') && !ad.image_url.startsWith('//')
                ? ad.image_url
                : safeExternalUrl(ad.image_url)
              return (
                <article key={ad.id} className="ui-card overflow-hidden">
                  {isDemo && (
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#faf9f6] px-4 py-3">
                      <img src="/superagent-wordmark.svg" alt="Superagent" className="w-56 max-w-full h-auto" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#65665b]">Illustrative demo</span>
                    </div>
                  )}
                  {editing ? (
                    <div className="p-3 space-y-2">
                      <div className="rounded-lg ui-surface">
                        <img
                          src={ad.image_url || '/superagent-ads.png'}
                          alt={concept?.visual || ad.title}
                          className="block w-full h-auto object-contain"
                        />
                      </div>
                      <input
                        aria-label="Headline"
                        value={title}
                        maxLength={50}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full ui-input px-2 py-1 font-display font-bold"
                      />
                      <textarea
                        aria-label="Body"
                        value={body}
                        maxLength={100}
                        rows={2}
                        onChange={(e) => setBody(e.target.value)}
                        className="w-full ui-input px-2 py-1 text-sm"
                      />
                      <input
                        aria-label="Call to action"
                        value={cta}
                        onChange={(e) => setCta(e.target.value)}
                        className="w-full ui-input px-2 py-1 text-sm"
                      />
                      <p className="text-xs ui-faint">{title.length}/50 · {body.length}/100</p>
                      <div className="flex gap-2">
                        <button type="button" className="btn-accent text-sm min-h-0 py-1.5 px-3" onClick={saveEdit}>
                          Save
                        </button>
                        <button type="button" className="ui-secondary px-3 py-1.5 text-sm font-semibold" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="ui-surface">
                        <img
                          src={ad.image_url || '/superagent-ads.png'}
                          alt={concept?.visual || ad.title}
                          className="block w-full h-auto object-contain"
                        />
                      </div>
                      <div className="p-3">
                        <p className="font-display font-bold leading-tight">{ad.title}</p>
                        <p className="text-sm ui-body mt-1">{ad.body}</p>
                        {destinationUrl && (
                          <a href={destinationUrl} target="_blank" rel="noreferrer" className="inline-flex mt-3 btn-accent text-sm min-h-0 py-2 px-3">
                            {ad.cta} ↗
                          </a>
                        )}
                        {concept && (
                          <details className="mt-4 border-t ui-border pt-3 text-sm">
                            <summary className="cursor-pointer font-semibold ui-text">Why this concept</summary>
                            <p className="mt-2 font-semibold ui-body">{concept.angle}</p>
                            <p className="mt-1 ui-muted leading-relaxed">{concept.why}</p>
                          </details>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            className="ui-secondary text-sm font-semibold min-h-0 py-1.5 px-3"
                            onClick={() => startEdit(ad)}
                          >
                            Edit copy
                          </button>
                          {artworkUrl && (
                            <a href={artworkUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold ui-link underline underline-offset-2">
                              View full artwork ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold ui-muted">
          Budget
          <span className="mt-1 flex items-center gap-1">
            <span className="text-sm font-normal ui-faint">$</span>
            <input
              type="number"
              min={1}
              aria-label="Lifetime budget (USD)"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-[4.5rem] ui-input px-2 py-1 text-sm font-normal ui-text"
            />
          </span>
        </label>
        <label className="text-xs font-semibold ui-muted">
          Geo
          <input
            aria-label="Geography"
            value={geo}
            onChange={(e) => setGeo(e.target.value)}
            className="mt-1 block w-20 ui-input px-2 py-1 text-sm font-normal ui-text"
          />
        </label>
      </div>

      {live && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="chip ui-border">{LABELS[run.campaign.status] || run.campaign.status}</span>
          <span className="ui-muted">
            {connected ? run.campaign.account?.name || run.campaign.account?.id : 'Not connected'}
            {run.campaign.review_status ? ` · review ${run.campaign.review_status}` : ''}
          </span>
          {hasCampaignIds(run.campaign) && onRun && (
            <button
              type="button"
              className="font-semibold ui-link underline underline-offset-2"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true)
                setRefreshError('')
                try {
                  onRun(await api.refreshAds(run.id))
                } catch (error) {
                  setRefreshError(error instanceof Error ? error.message : 'Could not refresh campaign status.')
                } finally {
                  setRefreshing(false)
                }
              }}
            >
              {refreshing ? 'Refreshing…' : 'Refresh status'}
            </button>
          )}
        </div>
      )}
      {insights && (
        <p className="text-sm ui-body">
          {insights.impressions ?? 0} impressions · {insights.clicks ?? 0} clicks · ${insights.spend ?? 0} spend
        </p>
      )}
      {live && run.campaign.note && <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3">{run.campaign.note}</p>}
      {run.campaign.error && <p className="text-sm text-red-600 dark:text-red-300">{run.campaign.error}</p>}
      {refreshError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{refreshError}</p>}
      {onRun && trackingOn && <TrackingSetup run={run} onRun={onRun} />}
      <ActionBar title="Launch campaign">
        <button
          type="button"
          className="btn-accent"
          disabled={!ads.length}
          onClick={() => {
            if (editingId) saveEdit()
            const places = geo.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean)
            onContinue(budget || 25, places.length ? places : ['US'])
          }}
        >
          Continue
        </button>
      </ActionBar>
    </div>
  )
}
