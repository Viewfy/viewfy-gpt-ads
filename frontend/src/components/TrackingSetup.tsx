import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Run } from '../lib/types'

export function TrackingSetup({ run, onRun }: { run: Run; onRun: (run: Run) => void }) {
  const t = run.tracking
  const [repo, setRepo] = useState(t?.repo || t?.repos?.[0]?.full_name || '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (t?.repo) setRepo(t.repo)
  }, [t?.repo])

  useEffect(() => {
    if (t?.status !== 'running') return
    const id = window.setInterval(() => {
      api.get(run.id).then(onRun).catch(() => undefined)
    }, 1600)
    return () => window.clearInterval(id)
  }, [run.id, t?.status, onRun])

  const connected = t?.status === 'connected' || t?.status === 'running' || t?.status === 'pr_ready'
  const repos = t?.repos || []

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161412] p-5 space-y-3">
      <div>
        <h3 className="font-display font-extrabold text-xl">Set up conversion tracking</h3>
        <p className="text-sm text-neutral-600 dark:text-[#a39c92] mt-1">
          Connect GitHub. GPT6 Astra adds the Ads pixel to the site and opens a pull request.
        </p>
      </div>
      {!connected && (
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => api.githubLogin(run.id)}>
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
          Connect GitHub
        </button>
      )}
      {connected && (
        <>
          <p className="text-sm text-neutral-500 dark:text-[#a39c92]">
            Connected as <span className="font-semibold text-neutral-800 dark:text-[#f4efe6]">@{t?.login}</span>
          </p>
          <label className="block text-sm">
            Repository
            <select
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              disabled={t?.status === 'running'}
              className="mt-1 w-full rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2"
            >
              {repos.map((r) => (
                <option key={r.full_name} value={r.full_name}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </label>
          {t?.status !== 'pr_ready' && (
            <button
              type="button"
              className="btn-accent"
              disabled={busy || t?.status === 'running' || !repo}
              onClick={async () => {
                setBusy(true)
                try {
                  onRun(await api.startTracking(run.id, repo))
                } finally {
                  setBusy(false)
                }
              }}
            >
              {t?.status === 'running' ? 'Astra is installing the pixel…' : 'Install Ads pixel'}
            </button>
          )}
        </>
      )}
      {t?.note && <p className="text-sm text-neutral-500 dark:text-[#a39c92]">{t.note}</p>}
      {t?.error && <p className="text-sm text-red-600">{t.error}</p>}
      {t?.status === 'pr_ready' && t.pr_url && (
        <a href={t.pr_url} target="_blank" rel="noreferrer" className="inline-flex btn-primary">
          Open pull request
        </a>
      )}
      {t?.snippet && (
        <pre className="text-xs overflow-x-auto rounded-xl bg-neutral-100 dark:bg-black/40 px-3 py-2 text-neutral-700 dark:text-[#a39c92]">{t.snippet}</pre>
      )}
    </section>
  )
}