import { useState } from 'react'
import { ActionBar } from '../components/ActionBar'
import type { Run } from '../lib/types'

export function Creatives({
  run,
  onSave,
  onLaunch,
}: {
  run: Run
  onSave: (patch: { title?: string; body?: string; cta?: string }) => void
  onLaunch: () => void
}) {
  const c = run.creative
  const [title, setTitle] = useState(c?.title || '')
  const [body, setBody] = useState(c?.body || '')
  const [cta, setCta] = useState(c?.cta || '')
  if (run.status === 'rendering' && !c) {
    return (
      <div className="ui-page ui-page--narrow text-center">
        <img src="/viewfy-happy.png" alt="" className="w-24 h-24 mx-auto" />
        <p className="mt-4 ui-body">Generating original copy and a GPT Image 2 still…</p>
      </div>
    )
  }
  if (!c) return <p className="ui-page ui-page--narrow ui-muted">No creative yet.</p>
  return (
    <div className="ui-page ui-page--narrow ui-page--actions space-y-6">
      <header>
        <h2 className="font-display font-extrabold text-3xl">ChatGPT card</h2>
        <p className="ui-body mt-1">Title 3–50 characters. Body 100 max. Original, grounded in the approved brief.</p>
        {run.stale.creatives && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">The map changed after this creative was made.</p>}
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="ui-card p-6">
          <label htmlFor="creative-headline" className="block text-xs font-bold uppercase ui-muted">Headline</label>
          <input id="creative-headline" value={title} maxLength={50} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 ui-input px-3 py-2" />
          <label htmlFor="creative-body" className="block mt-4 text-xs font-bold uppercase ui-muted">Body</label>
          <textarea id="creative-body" value={body} maxLength={100} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full mt-1 ui-input px-3 py-2" />
          <label htmlFor="creative-cta" className="block mt-4 text-xs font-bold uppercase ui-muted">Call to action</label>
          <input id="creative-cta" value={cta} onChange={(e) => setCta(e.target.value)} className="w-full mt-1 ui-input px-3 py-2" />
          <p className="text-xs ui-faint mt-2">{title.length}/50 · {body.length}/100</p>
        </section>
        <div className="ui-card p-6">
          <p className="text-xs uppercase tracking-wide ui-muted">Preview · chat_card</p>
          {c.image_url ? (
            <img src={c.image_url} alt="" className="mt-3 w-full aspect-square object-cover rounded-2xl ui-surface" />
          ) : (
            <div className="mt-3 aspect-square rounded-2xl ui-surface flex items-center justify-center ui-faint text-sm">
              Image pending or API key missing
            </div>
          )}
          <p className="font-display font-extrabold text-xl mt-4">{title || c.title}</p>
          <p className="ui-body mt-1">{body || c.body}</p>
          <p className="mt-3 text-sm font-bold">{cta || c.cta}</p>
          <p className="text-xs ui-faint mt-2">{c.target_url}</p>
        </div>
      </div>
      <ActionBar title="ChatGPT card" description="Review your headline, body, and call to action.">
        <button
          type="button"
          className="btn-accent"
          onClick={() => {
            onSave({ title, body, cta })
            onLaunch()
          }}
        >
          Launch
        </button>
      </ActionBar>
    </div>
  )
}
