import { useEffect, useState } from 'react'
import type { Run, Subject } from '../lib/types'
import { AdCard, StatusNote } from '../components/AdCard'

function count(s: Subject) {
  return {
    meta: (s.meta.ads || []).length,
    google: (s.google.ads || []).length,
  }
}

function logo(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

function MetaLogo({ className = 'h-4 w-6 shrink-0' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 22" className={`${className} overflow-visible`} aria-hidden>
      <path
        fill="none"
        stroke="#0081FB"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 18.5C4.8 18.5 2.2 15 2.2 11S5.4 3.5 9.8 3.5c2.5 0 4.5 1.3 7.2 5.2C19.6 4.8 21.7 3.5 24.3 3.5 28.8 3.5 31.8 7 31.8 11s-3 7.5-7.5 7.5c-2.6 0-4.8-1.4-7.4-5.3C14.3 17.1 12.2 18.5 9.2 18.5z"
      />
    </svg>
  )
}

function GoogleLogo({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.7v3h4c2.4-2.2 3.5-5.4 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-4-3c-1.1.8-2.5 1.2-3.9 1.2-3 0-5.6-2-6.5-4.8H1.4v3.1C3.4 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.5 14.5c-.2-.7-.4-1.4-.4-2.1s.1-1.5.4-2.1V7.2H1.4C.5 8.9 0 10.4 0 12.4s.5 3.5 1.4 5.2l4.1-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.4l4.1 3.1C6.4 6.8 9 4.8 12 4.8z" />
    </svg>
  )
}

function PlatformLabel({ platform, children }: { platform: 'meta' | 'google'; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {platform === 'meta' ? <MetaLogo /> : <GoogleLogo />}
      {children}
    </span>
  )
}

export function Research({ run, onNext }: { run: Run; onNext: () => void }) {
  const running = run.status === 'researching'
  const subjects = run.ads.subjects || []
  const [open, setOpen] = useState<string | null>(null)
  const selected = subjects.find((s) => s.domain === open) || null

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
    <div className="max-w-6xl mx-auto px-5 pt-4 pb-8 space-y-8">
      <header>
        <h2 className="font-display font-extrabold text-3xl">Ad research</h2>
        <p className="text-neutral-600 dark:text-[#a39c92] mt-1">
          Public creatives for you and the competitors on the map. Longevity and repetition are signals. Not performance.
        </p>
        {run.stale.research && <p className="mt-2 text-sm text-amber-700">The map changed after this research. Re-confirm to refresh.</p>}
      </header>
      {running && <p className="text-neutral-500 dark:text-[#a39c92]">Astra is matching advertisers in Meta Ad Library and Google Ads Transparency…</p>}
      <div className="grid md:grid-cols-3 gap-4">
        {subjects.map((s) => {
          const st = count(s)
          return (
            <article key={s.domain} className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161412] p-5">
              <div className="flex items-start gap-3">
                <img src={logo(s.domain)} alt="" className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/10" />
                <div className="min-w-0">
                  <p className="font-display font-extrabold text-lg leading-tight truncate">{s.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-[#a39c92] truncate">{s.domain}</p>
                </div>
                <span
                  className={`chip shrink-0 ${
                    s.kind === 'self'
                      ? 'border-accent-300 bg-accent-50 text-accent-700 dark:bg-accent-400/15 dark:text-accent-300 dark:border-accent-400/40 normal-case'
                      : 'border-neutral-200 text-neutral-500 dark:border-white/15 dark:text-[#a39c92]'
                  }`}
                >
                  {s.kind === 'self' ? 'You' : s.kind}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-[#6b6560]">
                    <PlatformLabel platform="meta">Meta</PlatformLabel>
                  </dt>
                  <dd className="font-semibold shrink-0">{st.meta ? `${st.meta} ads` : 'None found'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-[#6b6560]">
                    <PlatformLabel platform="google">Google</PlatformLabel>
                  </dt>
                  <dd className="font-semibold shrink-0">{st.google ? `${st.google} ads` : 'None found'}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-[#f4efe6] hover:bg-neutral-50 dark:hover:bg-white/10"
                onClick={() => setOpen(s.domain)}
              >
                See their ads
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
            className="relative w-full max-w-6xl rounded-3xl border border-neutral-200 dark:border-white/10 bg-[#F8F5F1] dark:bg-[#141210] shadow-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-200 dark:border-white/10 bg-[#F8F5F1] dark:bg-[#141210] rounded-t-3xl px-5 py-4">
              <div>
                <h3 id="ads-dialog-title" className="font-display font-extrabold text-2xl">
                  {selected.name}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-[#a39c92]">{selected.domain}</p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-1.5 text-sm font-semibold text-neutral-800 dark:text-[#f4efe6] hover:bg-neutral-50 dark:hover:bg-white/10"
                onClick={() => setOpen(null)}
              >
                Close
              </button>
            </div>
            <div className="px-5 py-5 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-[#a39c92] mb-3">
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
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-[#a39c92] mb-3">
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
            </div>
          </div>
        </div>
      )}
      <section className="space-y-3">
        <h3 className="font-display font-bold text-xl">Insights</h3>
        <div className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161412] shadow-sm overflow-hidden divide-y divide-neutral-100 dark:divide-white/10">
          <div className="px-5 py-4">
            <p className="text-[11px] font-display font-bold uppercase tracking-[0.12em] text-neutral-400">Finding</p>
            <p className="mt-2 border-l-[3px] border-accent-400 pl-3.5 text-[15px] font-medium text-neutral-900 dark:text-[#f4efe6] leading-snug">
              None of your competitors are running ChatGPT ads. All their FOMO Ads perform best. Start from here
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[11px] font-display font-bold uppercase tracking-[0.12em] text-neutral-400">Finding</p>
            <p className="mt-2 border-l-[3px] border-accent-400 pl-3.5 text-[15px] font-medium text-neutral-900 dark:text-[#f4efe6] leading-snug">
              Smith and Ruby sell a receptionist for every SMB. Nobody in the set talks to the agency owner who already paid for the lead and then missed the inbound call. That is the ChatGPT card: the phone you already bought, answered.
            </p>
          </div>
        </div>
      </section>
      <button type="button" className="btn-accent" disabled={running || !run.concepts.length} onClick={onNext}>
        Create my Ad
      </button>
    </div>
  )
}
