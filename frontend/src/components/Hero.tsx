import { useEffect, useRef, useState } from 'react'
import { ActionBar } from './ActionBar'
import { SiteHeader } from './SiteHeader'
import { BrandLogo } from './BrandLogo'

function HandArrow() {
  return (
    <svg className="w-9 h-9 ui-text rotate-[20deg]" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M8 40c10-18 28-28 48-28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 8l10 4-6 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Hero({ onSubmit, busy }: { onSubmit: (domain: string) => void; busy?: boolean }) {
  const [url, setUrl] = useState('getsuperagent.com')
  const [err, setErr] = useState('')
  const inlineAction = useRef<HTMLButtonElement>(null)
  const domainInput = useRef<HTMLInputElement>(null)
  const [showActionBar, setShowActionBar] = useState(false)

  useEffect(() => {
    const button = inlineAction.current
    if (!button) return
    const observer = new IntersectionObserver(([entry]) => {
      setShowActionBar(entry.intersectionRatio < .999)
    }, { rootMargin: '-64px 0px 0px', threshold: [0, 1] })
    observer.observe(button)
    return () => observer.disconnect()
  }, [])

  function go() {
    const raw = url.trim()
    try {
      const host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname
      if (!host.includes('.')) throw new Error('bad')
    } catch {
      setErr('Enter a domain like getsuperagent.com')
      domainInput.current?.focus()
      domainInput.current?.scrollIntoView({ block: 'center' })
      return
    }
    setErr('')
    onSubmit(raw)
  }

  return (
    <div className={`site-shell hero-shell${showActionBar ? ' hero-shell--actions' : ''}`}>
      <SiteHeader onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      <section className="hero-content flex items-center">
        <div className="max-w-6xl mx-auto px-5 w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="text-center lg:text-left">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] hero-accent">One domain. A world of possibilities.</p>
            <h1
              className="font-display font-extrabold ui-text"
              style={{ fontSize: 'clamp(28px, 4.4vw, 48px)', letterSpacing: '-0.04em', lineHeight: 1.05 }}
            >
              Launch a <span className="hero-accent">ChatGPT Ad</span>
              <br />
              in 3 clicks.
            </h1>
            <p className="mt-6 text-lg md:text-xl ui-body max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Understand your business, explore competitor ads, and shape your first ChatGPT campaign with Astra.
            </p>
            <div className="mt-8 max-w-xl mx-auto lg:mx-0">
              <div className="relative">
                <div
                  className="pointer-events-none absolute -inset-x-6 -inset-y-5 animate-halo blur-2xl"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 70% at 30% 50%, rgb(var(--accent) / 0.5), transparent 70%), radial-gradient(ellipse 55% 70% at 75% 50%, rgba(251,191,36,0.42), transparent 70%)',
                  }}
                />
                <div className="shine-ring relative rounded-[22px] p-[2px] shadow-[0_18px_40px_-16px_rgba(18,16,12,0.4)]">
                  <div className="hero-form flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-[20px]">
                    <input
                      ref={domainInput}
                      aria-label="Business domain"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && go()}
                      placeholder="Paste a business domain"
                      className="ui-input flex-1 px-4 py-3"
                    />
                    <button ref={inlineAction} type="button" onClick={go} disabled={busy} className="btn-accent whitespace-nowrap">
                      <span className="relative z-10">{busy ? 'Reading…' : 'Let Astra read it'}</span>
                    </button>
                  </div>
                </div>
              </div>
              {err && <p role="alert" className="text-sm text-red-600 dark:text-red-300 mt-2">{err}</p>}
              <p className="mt-5 text-xs ui-muted">Your business map comes first. You decide when to launch.</p>
            </div>
          </div>
          <div className="relative">
            <div className="relative mx-auto w-44 sm:w-64 lg:w-full lg:max-w-[440px]">
              <picture>
                <source srcSet="/viewfy-hero.webp?v=5" type="image/webp" />
                <img src="/viewfy-hero.png?v=5" alt="Astra hugging the ChatGPT icon" width={760} height={760} className="hero-mascot-glow w-full h-auto select-none pointer-events-none" />
              </picture>
              <div className="hidden lg:flex flex-col items-end absolute top-2 right-2 -rotate-3">
                <p
                  className="flex flex-col items-end gap-0.5 text-[26px] leading-none ui-text"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  <span>5 mins from your first</span>
                  <span className="inline-flex items-center gap-1.5">
                    <BrandLogo brand="chatgpt" size={28} />
                    ads.
                  </span>
                </p>
                <span className="inline-block rotate-[155deg] mr-6 mt-1">
                  <HandArrow />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="max-w-6xl mx-auto px-5 pb-8 flex flex-wrap justify-between gap-3 text-xs ui-muted">
        <span>Viewfy 💙 GPT Ads</span>
        <span>Code built with Astra.</span>
      </footer>
      {showActionBar && <ActionBar title="Start with your business" description={url.trim() || 'Enter a domain to get started.'}>
        <button type="button" onClick={go} disabled={busy} className="btn-primary">
          {busy ? 'Reading…' : 'Let Astra read it'}
        </button>
      </ActionBar>}
    </div>
  )
}
