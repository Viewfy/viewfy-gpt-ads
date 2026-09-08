import type { Run } from '../lib/types'

export function Concepts({ run, onPick, picking }: { run: Run; onPick: (id: string) => void; picking?: boolean }) {
  return (
    <div className="ui-page space-y-6">
      <header>
        <h2 className="font-display font-extrabold text-3xl">Three directions</h2>
        <p className="ui-body mt-1">Each one joins the approved brief with the ad research. Pick one. Astra will write a ChatGPT card.</p>
        {run.stale.concepts && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">The map changed. These concepts may be stale.</p>}
      </header>
      <div className="grid md:grid-cols-3 gap-4">
        {run.concepts.map((c) => (
          <article key={c.id} className="ui-card p-6 flex flex-col">
            <h3 className="font-display font-extrabold text-xl">{c.name}</h3>
            <p className="text-sm ui-muted mt-1">{c.angle}</p>
            <p className="text-sm ui-body mt-3 flex-1">{c.why}</p>
            <div className="mt-4 rounded-xl ui-surface p-3">
              <p className="text-xs uppercase tracking-wide ui-muted">Chat card draft</p>
              <p className="font-semibold mt-1">{c.headline}</p>
              <p className="text-sm ui-body">{c.body}</p>
              <p className="text-xs font-bold mt-2">{c.cta}</p>
            </div>
            <button type="button" className="btn-accent mt-4" disabled={picking} onClick={() => onPick(c.id)}>
              Use this direction
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
