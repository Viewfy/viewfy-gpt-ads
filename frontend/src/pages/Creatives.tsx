import { useState } from 'react'
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
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <img src="/viewfy-happy.png" alt="" className="w-24 h-24 mx-auto" />
        <p className="mt-4 text-neutral-600">Generating original copy and a GPT Image 2 still…</p>
      </div>
    )
  }
  if (!c) return <p className="px-5 py-10 text-neutral-500">No creative yet.</p>
  return (
    <div className="max-w-5xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8">
      <div>
        <h2 className="font-display font-extrabold text-3xl">ChatGPT card</h2>
        <p className="text-neutral-600 mt-1">Title 3–50 characters. Body 100 max. Original, grounded in the approved brief.</p>
        {run.stale.creatives && <p className="mt-2 text-sm text-amber-700">The map changed after this creative was made.</p>}
        <label className="block mt-6 text-xs font-bold uppercase text-neutral-500">Headline</label>
        <input value={title} maxLength={50} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2" />
        <label className="block mt-4 text-xs font-bold uppercase text-neutral-500">Body</label>
        <textarea value={body} maxLength={100} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2" />
        <label className="block mt-4 text-xs font-bold uppercase text-neutral-500">Call to action</label>
        <input value={cta} onChange={(e) => setCta(e.target.value)} className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2" />
        <p className="text-xs text-neutral-400 mt-2">{title.length}/50 · {body.length}/100</p>
      </div>
      <div className="rounded-3xl border border-neutral-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Preview · chat_card</p>
        {c.image_url ? (
          <img src={c.image_url} alt="" className="mt-3 w-full aspect-square object-cover rounded-2xl bg-neutral-100" />
        ) : (
          <div className="mt-3 aspect-square rounded-2xl bg-[#F8F5F1] flex items-center justify-center text-neutral-400 text-sm">
            Image pending or API key missing
          </div>
        )}
        <p className="font-display font-extrabold text-xl mt-4">{title || c.title}</p>
        <p className="text-neutral-600 mt-1">{body || c.body}</p>
        <p className="mt-3 text-sm font-bold">{cta || c.cta}</p>
        <p className="text-xs text-neutral-400 mt-2">{c.target_url}</p>
        <button
          type="button"
          className="btn-accent w-full mt-6"
          onClick={() => {
            onSave({ title, body, cta })
            onLaunch()
          }}
        >
          Launch
        </button>
      </div>
    </div>
  )
}
