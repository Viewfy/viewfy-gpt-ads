import { useEffect, useState } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import type { Run, Side, Subject } from '../lib/types'
import { AdCard, researchStatusLabel, StatusNote } from '../components/AdCard'
import { ActionBar } from '../components/ActionBar'
import { safeExternalUrl } from '../lib/external-url'

function count(s: Subject) {
  return {
    meta: (s.meta.ads || []).length,
    google: (s.google.ads || []).length,
    other: (s.other_ads || []).length,
  }
}

function sideSummary(side: Side) {
  const thirdParty = (side.ads || []).filter((ad) => ad.advertiser_relationship === 'unverified_third_party').length
  if (thirdParty && thirdParty === side.ads.length) return `${thirdParty} third-party record${thirdParty === 1 ? '' : 's'}`
  if (side.ads?.length) return `${side.ads.length} ad record${side.ads.length === 1 ? '' : 's'}`
  const label = researchStatusLabel(side.status)
  return ['Access limited', 'Source unavailable', 'Checking'].includes(label) ? label : 'Unverified'
}

function describe(value?: string | string[]) {
  return Array.isArray(value) ? value.join(' ') : value
}

export function SubjectProfile({ subject }: { subject: Subject }) {
  const profile = subject.profile
  const fields = [
    ['Audience', profile?.audience],
    ['Positioning', profile?.positioning],
    ['Offer', profile?.offer],
    ['Pricing', profile?.pricing],
    ['Call to action', profile?.cta],
  ].filter(([, value]) => value)
  const sources = (subject.sources || []).filter((source) => profile?.source_ids?.includes(source.id))
  if (!profile && !subject.findings?.length) return null
  return (
    <section className="ui-card p-5 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide ui-muted">Website & product intelligence</p>
        {profile?.category && <p className="mt-2 text-sm font-semibold ui-link">{profile.category}</p>}
        {profile?.summary && <p className="mt-2 text-sm leading-relaxed ui-body">{profile.summary}</p>}
      </div>
      {!!fields.length && (
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold ui-muted">{label}</dt>
              <dd className="mt-1 leading-relaxed">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!profile?.differentiators?.length && (
        <div className="text-sm">
          <p className="font-semibold">Differentiators claimed on the website</p>
          <ul className="mt-2 pl-5 list-disc space-y-1 ui-body">
            {profile.differentiators.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      {!!subject.findings?.length && (
        <div className="border-t ui-border pt-4 text-sm">
          <p className="font-semibold">Research findings</p>
          <ul className="mt-2 pl-5 list-disc space-y-2 leading-relaxed ui-body">
            {subject.findings.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      {!!profile?.limitations?.length && (
        <div className="rounded-xl ui-surface px-3 py-3 text-xs leading-relaxed ui-muted">
          <p className="font-semibold mb-1">Evidence limits</p>
          {profile.limitations.map((item) => <p key={item} className="mt-1">{item}</p>)}
        </div>
      )}
      {!!sources.length && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {sources.map((source) => (
            <a key={source.id} href={safeExternalUrl(source.url)} target="_blank" rel="noreferrer" className="underline underline-offset-2 ui-link">{source.title} ↗</a>
          ))}
        </div>
      )}
    </section>
  )
}

export function SubjectSources({ subject }: { subject: Subject }) {
  if (!subject.sources?.length) return null
  return (
    <section className="space-y-3">
      <h4 className="font-display font-bold text-lg">Source evidence</h4>
      <div className="grid sm:grid-cols-2 gap-3">
        {subject.sources.map((source) => (
          <article key={source.id} className="ui-card p-4">
            <p className="text-[11px] uppercase tracking-wide ui-muted">
              {source.kind.replace(/_/g, ' ')}{source.observed_at && ` · Checked ${source.observed_at.slice(0, 10)}`}
            </p>
            <a href={safeExternalUrl(source.url)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold underline underline-offset-2 ui-link">{source.title} ↗</a>
            <p className="mt-2 text-sm leading-relaxed ui-body">{source.summary}</p>
            {source.quotes?.map((quote) => (
              <blockquote key={quote} className="mt-3 border-l-2 ui-border pl-3 text-sm italic ui-body">“{quote}”</blockquote>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}

function logo(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

function PlatformLabel({ platform, children }: { platform: 'meta' | 'google'; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <BrandLogo brand={platform} size={18} />
      {children}
    </span>
  )
}

export function Research({ run, onNext, busy = false, embedded = false }: { run: Run; onNext?: () => void; busy?: boolean; embedded?: boolean }) {
  const running = run.status === 'researching'
  const subjects = run.ads.subjects || []
  const [open, setOpen] = useState<string | null>(null)
  const selected = subjects.find((s) => s.domain === open) || null
  const coverage = Array.isArray(run.ads.coverage) ? run.ads.coverage : run.ads.coverage ? [run.ads.coverage] : []

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className={`ui-page ${embedded ? 'product-research-content' : 'ui-page--actions'} ui-text space-y-8`}>
      <header>
        <h2 className="font-display font-extrabold text-3xl">Research & insights</h2>
        <p className="ui-body mt-1">
          Public ad records and sourced website research for you and your competitors.
        </p>
        {(run.ads.researched_at || run.ads.methodology || run.ads.coverage) && (
          <div className="mt-3 max-w-4xl space-y-1 text-xs leading-relaxed ui-muted">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {run.ads.researched_at && <p>Researched {run.ads.researched_at.slice(0, 10)}</p>}
              {coverage[0] && <p>{coverage[0]}</p>}
            </div>
            {(run.ads.methodology || coverage.length > 1) && (
              <details className="pt-1">
                <summary className="cursor-pointer font-semibold hover:underline">Research method and limits</summary>
                <div className="mt-2 space-y-2">
                  {run.ads.methodology && <p>{describe(run.ads.methodology)}</p>}
                  {coverage.slice(1).map((line) => <p key={line}>{line}</p>)}
                </div>
              </details>
            )}
          </div>
        )}
        {run.stale.research && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">The map changed after this research. Re-confirm to refresh.</p>}
      </header>
      {running && <p className="ui-muted">Astra is matching advertisers in Meta Ad Library and Google Ads Transparency…</p>}
      <div className="grid md:grid-cols-3 gap-4">
        {subjects.map((s) => {
          const st = count(s)
          return (
            <article key={s.domain} className="flex flex-col ui-card p-5">
              <div className="flex items-start gap-3">
                <img src={logo(s.domain)} alt="" className="w-10 h-10 rounded-xl ui-surface" />
                <div className="min-w-0">
                  <p className="font-display font-extrabold text-lg leading-tight truncate">{s.name}</p>
                  <p className="text-sm ui-muted truncate">{s.domain}</p>
                </div>
                <span
                  className={`chip shrink-0 ${
                    s.kind === 'self'
                      ? 'ui-border ui-surface ui-link normal-case'
                      : 'ui-border ui-muted'
                  }`}
                >
                  {s.kind === 'self' ? 'You' : s.kind}
                </span>
              </div>
              {s.profile?.category && <p className="mt-4 text-xs font-semibold ui-link">{s.profile.category}</p>}
              {s.profile?.summary && <p className="mt-2 text-sm leading-relaxed ui-body line-clamp-4">{s.profile.summary}</p>}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[11px] uppercase tracking-wide ui-faint">
                    <PlatformLabel platform="meta">Meta</PlatformLabel>
                  </dt>
                  <dd className="font-semibold shrink-0">{sideSummary(s.meta)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[11px] uppercase tracking-wide ui-faint">
                    <PlatformLabel platform="google">Google</PlatformLabel>
                  </dt>
                  <dd className="font-semibold shrink-0">{sideSummary(s.google)}</dd>
                </div>
                {!!st.other && <div className="flex items-center justify-between gap-3"><dt className="ui-muted">Other platforms</dt><dd className="font-semibold">{st.other} ad record{st.other === 1 ? '' : 's'}</dd></div>}
              </dl>
              {!!s.sources?.length && <p className="mt-3 text-xs ui-muted">{s.sources.length} source{s.sources.length === 1 ? '' : 's'} reviewed</p>}
              <div className="flex-1" />
              <button
                type="button"
                className="mt-4 w-full ui-secondary px-4 py-2 text-sm font-semibold"
                onClick={() => setOpen(s.domain)}
              >
                View research & ads
              </button>
            </article>
          )
        })}
      </div>
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 sm:p-8 overflow-y-auto"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ads-dialog-title"
            className="ui-dialog relative w-full max-w-6xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b ui-border bg-inherit rounded-t-[inherit] px-5 py-4">
              <div>
                <h3 id="ads-dialog-title" className="font-display font-extrabold text-2xl">
                  {selected.name}
                </h3>
                <p className="text-sm ui-muted">{selected.domain}</p>
              </div>
              <button
                type="button"
                className="ui-secondary px-3 py-1.5 text-sm font-semibold"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-5 space-y-6">
              <SubjectProfile subject={selected} />
              <div>
                <h4 className="font-display font-bold text-lg">Public ad records</h4>
                <p className="mt-1 text-xs leading-relaxed ui-muted">Library access and advertiser matching affect coverage. An unverified result does not mean a company is not advertising. Public records do not establish conversion performance.</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide ui-muted mb-3">
                  <PlatformLabel platform="meta">Meta Ad Library</PlatformLabel>
                </p>
                <StatusNote side={selected.meta} />
                {!!selected.meta.ads?.length && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selected.meta.ads.map((ad) => (
                      <AdCard key={ad.id} ad={ad} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide ui-muted mb-3">
                  <PlatformLabel platform="google">Google Ads Transparency</PlatformLabel>
                </p>
                <StatusNote side={selected.google} />
                {!!selected.google.ads?.length && (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selected.google.ads.map((ad) => (
                      <AdCard key={ad.id} ad={ad} />
                    ))}
                  </div>
                )}
              </div>
              {!!selected.other_ads?.length && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide ui-muted mb-3">Other platforms</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {selected.other_ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
                  </div>
                </div>
              )}
              {!!selected.ad_checks?.length && (
                <section className="ui-card p-4">
                  <h4 className="text-sm font-semibold">Ad library checks</h4>
                  <div className="mt-3">
                    {selected.ad_checks.map((check, index) => (
                      <div key={`${check.platform}-${index}`} className="border-b ui-border py-3 first:pt-0 last:pb-0 last:border-b-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <a href={safeExternalUrl(check.url)} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2 ui-link">{check.platform} ↗</a>
                          <span className="ui-muted capitalize">{researchStatusLabel(check.status)}{check.checked_at && ` · ${check.checked_at.slice(0, 10)}`}</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed ui-body">{check.note}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <SubjectSources subject={selected} />
            </div>
          </div>
        </div>
      )}
      <section className="space-y-3">
        <h3 className="font-display font-bold text-xl">Insights</h3>
        {!run.insights?.length && <p className="text-sm ui-muted">{running ? 'Gathering evidence for recommendations…' : 'No sourced insights are available for this research yet.'}</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {(run.insights || []).map((insight, index) => (
            <article key={`${insight.title}-${index}`} className="ui-card p-5 space-y-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] ui-muted">Finding {index + 1}</p>
                  {insight.confidence && <p className="text-[11px] ui-muted capitalize">Confidence: {insight.confidence}</p>}
                </div>
                <h4 className="mt-2 font-display font-bold text-lg leading-snug">{insight.title}</h4>
                <p className="mt-3 text-sm ui-body leading-relaxed">{insight.observation}</p>
              </div>
              {insight.recommendation && (
                <div className="border-l-[3px] border-accent-400 pl-3.5">
                  <p className="text-[11px] uppercase tracking-wide font-semibold ui-link">Recommended test</p>
                  <p className="mt-1 text-sm leading-relaxed">{insight.recommendation}</p>
                </div>
              )}
              {!!insight.because?.length && !insight.evidence?.some((evidence) => safeExternalUrl(evidence.url)) && (
                <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed ui-muted">
                  {insight.because.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
              {!!insight.evidence?.length && (
                <div className="border-t ui-border pt-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide ui-muted">Supporting evidence</p>
                  {insight.evidence.map((evidence, evidenceIndex) => (
                    <div key={`${evidence.url}-${evidenceIndex}`} className="text-xs leading-relaxed">
                      <a href={safeExternalUrl(evidence.url)} target="_blank" rel="noreferrer" className="underline underline-offset-2 ui-link">{evidence.subject ? `${evidence.subject}: ` : ''}{evidence.title} ↗</a>
                      {evidence.detail && <p className="mt-0.5 ui-muted">{evidence.detail}</p>}
                    </div>
                  ))}
                </div>
              )}
              {insight.limitation && <p className="rounded-lg ui-surface p-3 text-xs leading-relaxed ui-muted">{insight.limitation}</p>}
            </article>
          ))}
        </div>
      </section>
      {!embedded && <ActionBar title="Ready for your next ad?" description="Turn your research into a campaign.">
        <button type="button" className="btn-accent" disabled={busy || running || !run.concepts.length} onClick={onNext}>
          {busy ? 'Preparing your ad…' : 'Create my Ad'}
        </button>
      </ActionBar>}
    </div>
  )
}
