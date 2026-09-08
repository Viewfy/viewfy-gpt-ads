import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

function HandArrow() {
  return (
    <svg className="w-9 h-9 text-neutral-800 dark:text-[#f4efe6] rotate-[20deg]" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M8 40c10-18 28-28 48-28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 8l10 4-6 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChatGptMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.997 2.9 6.046 6.046 0 0 0 .742 7.096 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.984 5.984 0 0 0 13.26 24a6.055 6.055 0 0 0 5.772-4.205 5.99 5.99 0 0 0 3.997-2.9 6.055 6.055 0 0 0-.747-7.074zM13.26 22.43a4.475 4.475 0 0 1-2.876-1.04l.141-.08 4.778-2.758a.795.795 0 0 0 .392-.681v-6.736l2.02 1.168a.071.071 0 0 1 .038.052v5.582a4.504 4.504 0 0 1-4.493 4.493zM3.6 18.304a4.47 4.47 0 0 1-.535-3.013l.141.085 4.783 2.758a.771.771 0 0 0 .78 0l5.842-3.368v2.332a.08.08 0 0 1-.033.061L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.348a4.482 4.482 0 0 1 2.365-1.972V11.6a.766.766 0 0 0 .388.676l5.814 3.354-2.02 1.168a.075.075 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.596 3.777-5.83-3.387 2.021-1.168a.075.075 0 0 1 .071 0l4.83 2.787a4.494 4.494 0 0 1-.675 8.104v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.773-2.781a.775.775 0 0 0-.785 0L9.409 9.6V7.268a.066.066 0 0 1 .028-.061l4.83-2.786a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.021-1.163a.08.08 0 0 1-.038-.057V6.074a4.499 4.499 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.68zm1.097-2.365 2.602-1.499 2.607 1.499v2.999l-2.597 1.499-2.606-1.499z" />
    </svg>
  )
}

export function Hero({ onSubmit, busy }: { onSubmit: (domain: string) => void; busy?: boolean }) {
  const [url, setUrl] = useState('getsuperagent.com')
  const [err, setErr] = useState('')

  function go() {
    const raw = url.trim()
    try {
      const host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname
      if (!host.includes('.')) throw new Error('bad')
    } catch {
      setErr('Enter a domain like getsuperagent.com')
      return
    }
    setErr('')
    onSubmit(raw)
  }

  return (
    <div className="min-h-screen bg-[#F8F5F1] dark:bg-[#0c0b0a] text-neutral-900 dark:text-[#f4efe6]">
      <nav className="fixed top-0 inset-x-0 z-50 py-4 bg-[#F8F5F1]/80 dark:bg-[#0c0b0a]/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/viewfy-mascot.png" alt="" width={32} height={32} className="w-8 h-8" />
            <span className="font-display font-extrabold text-xl tracking-tight">Viewfy 💙 GPT Ads</span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <section className="min-h-[90vh] flex items-center pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-5 w-full grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="text-center lg:text-left">
            <h1
              className="font-display font-extrabold text-neutral-900 dark:text-[#f4efe6]"
              style={{ fontSize: 'clamp(28px, 4.4vw, 48px)', letterSpacing: '-0.04em', lineHeight: 1.05 }}
            >
              Launch a <span className="text-accent-500">ChatGPT Ad</span>
              <br />
              in 3 clicks.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-600 dark:text-[#a39c92] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              GPT6-Astra reads your site, understands your business, spies on competitors, finds their public ads, and launches your first ChatGPT campaign.
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
                  <div className="flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-[20px] bg-white dark:bg-[#161412]">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && go()}
                      placeholder="Paste a business domain"
                      className="flex-1 bg-transparent px-4 py-3 text-neutral-900 dark:text-[#f4efe6] placeholder-neutral-400 outline-none"
                    />
                    <button type="button" onClick={go} disabled={busy} className="btn-accent whitespace-nowrap">
                      <span className="relative z-10">{busy ? 'Reading…' : 'Let Astra read it'}</span>
                    </button>
                  </div>
                </div>
              </div>
              {err && <p className="text-sm text-red-500 mt-2">{err}</p>}
            </div>
          </div>
          <div className="relative">
            <div className="relative mx-auto w-44 sm:w-64 lg:w-full lg:max-w-[440px]">
              <picture>
                <source srcSet="/viewfy-hero.webp?v=5" type="image/webp" />
                <img src="/viewfy-hero.png?v=5" alt="Astra hugging the ChatGPT icon" width={760} height={760} className="w-full h-auto select-none pointer-events-none" />
              </picture>
              <div className="hidden lg:flex flex-col items-end absolute top-2 right-2 -rotate-3">
                <p
                  className="flex flex-col items-end gap-0.5 text-[26px] leading-none text-neutral-800 dark:text-[#f4efe6]"
                  style={{ fontFamily: 'Caveat, cursive' }}
                >
                  <span>5 mins from your first</span>
                  <span className="inline-flex items-center gap-1.5">
                    <ChatGptMark className="w-[1.15em] h-[1.15em] shrink-0 text-neutral-900 dark:text-[#f4efe6]" />
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
    </div>
  )
}
