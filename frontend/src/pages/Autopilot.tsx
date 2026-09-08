import type { Run } from '../lib/types'

const STOPS = [
  { when: 'Now', title: "You're live", body: 'The first ChatGPT cards are up.' },
  { when: 'This week', title: 'New tests', body: 'Fresh angles, not the same line twice.' },
  { when: 'Week 3', title: 'A sharper pitch', body: 'Headline, offer, and proof get tighter.' },
  { when: 'Always', title: 'Watch the field', body: 'Public competitor ads inform the next test.' },
]

export function Autopilot({ run }: { run: Run }) {
  const raw = run.brand.name || run.domain
  const brand = raw === raw.toUpperCase() && raw.length > 3 ? raw.charAt(0) + raw.slice(1).toLowerCase() : raw
  return (
    <div className="max-w-4xl mx-auto px-5 pt-4 pb-16">
      <div className="text-center">
        <picture>
          <source srcSet="/astra-hug-superagent.webp?v=9" type="image/webp" />
          <img
            src="/astra-hug-superagent.png?v=9"
            alt={`Astra hugging the ${brand} logo`}
            width={760}
            height={760}
            className="w-52 sm:w-64 lg:w-72 h-auto mx-auto select-none pointer-events-none"
          />
        </picture>
        <h2 className="mt-3 font-display font-extrabold text-5xl sm:text-6xl tracking-tight">You&apos;re live!</h2>
      </div>

      <section className="mt-12">
        <ol className="relative grid sm:grid-cols-4 gap-8 sm:gap-4">
          <div
            aria-hidden
            className="hidden sm:block absolute left-[12%] right-[12%] top-[22px] h-[2px] bg-gradient-to-r from-accent-400 via-[#e8c36a] to-white/20"
          />
          {STOPS.map((s, i) => (
            <li key={s.when} className="relative flex gap-4 sm:block sm:text-center">
              <span
                className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display font-extrabold text-sm border-2 sm:mx-auto ${
                  i === 0
                    ? 'bg-accent-400 text-neutral-900 border-accent-300 shadow-[0_0_24px_rgba(125,211,252,0.45)]'
                    : 'bg-[#141210] text-[#f4efe6] border-[#e8c36a]/70'
                }`}
              >
                {i + 1}
              </span>
              <div>
                <p className="sm:mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-400">{s.when}</p>
                <p className="mt-1 font-display font-extrabold text-lg leading-tight">{s.title}</p>
                <p className="mt-1.5 text-sm text-neutral-600 dark:text-[#a39c92] leading-relaxed sm:px-1">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
