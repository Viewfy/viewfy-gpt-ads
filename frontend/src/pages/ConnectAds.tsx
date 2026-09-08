import { useState } from 'react'
import { ActionBar } from '../components/ActionBar'
import { BrandLogo } from '../components/BrandLogo'
import { api } from '../lib/api'
import type { Run } from '../lib/types'

export function ConnectAds({ run, saving, onContinue }: {
  run: Run
  saving?: boolean
  onContinue: () => void | Promise<void>
}) {
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')
  const [budget, setBudget] = useState(run.campaign.budget_usd > 0 ? run.campaign.budget_usd : 25)
  const [geo, setGeo] = useState((run.campaign.geo || []).filter(Boolean).join(', ') || 'US')

  async function continueSetup() {
    if (saving || continuing) return
    setContinuing(true)
    setError('')
    try {
      const places = geo.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean)
      await api.saveCampaign(run.id, budget || 25, places.length ? places : ['US'])
      await onContinue()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not continue. Please try again.')
    } finally {
      setContinuing(false)
    }
  }

  return (
    <div className="ui-page ui-page--narrow ui-page--actions space-y-6">
      <header>
        <h2 className="font-display font-extrabold text-3xl">Connect ads</h2>
        <p className="text-sm ui-muted mt-2">Keep your setup and continue</p>
      </header>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      <section className="ui-card p-6 space-y-4">
        <button
          type="button"
          className="ui-secondary w-full !bg-white !border-0 !shadow-none font-display font-bold text-lg min-h-[45px] px-5"
          disabled={saving || continuing}
          onClick={continueSetup}
        >
          <BrandLogo brand="chatgpt" size={28} />
          {saving || continuing ? 'Launching…' : 'Connect ChatGPT Ads Account'}
        </button>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="ui-muted">
            Daily budget
            <span className="mt-1 flex items-center gap-1">
              <span className="ui-faint">$</span>
              <input
                type="number"
                min={1}
                aria-label="Daily budget (USD)"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-[4.5rem] ui-input px-2 py-1 text-sm font-semibold ui-text"
              />
            </span>
          </label>
          <label className="ui-muted">
            Geography
            <input
              aria-label="Geography"
              value={geo}
              onChange={(e) => setGeo(e.target.value)}
              className="mt-1 block w-20 ui-input px-2 py-1 text-sm font-semibold ui-text"
            />
          </label>
        </div>
        <p className="text-sm ui-muted">Campaign submission is paused for now. Continuing saves your progress without publishing ads.</p>
      </section>
      <ActionBar title="Ready to continue" description="Save your setup and see what’s next.">
        <button type="button" className="btn-primary" disabled={saving || continuing} onClick={continueSetup}>
          {saving || continuing ? 'Launching…' : 'Launch 🎉'}
        </button>
      </ActionBar>
    </div>
  )
}
