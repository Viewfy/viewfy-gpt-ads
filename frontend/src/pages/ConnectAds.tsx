import { useState } from 'react'
import { ActionBar } from '../components/ActionBar'
import type { Run } from '../lib/types'

export function ConnectAds({ run, saving, onContinue }: {
  run: Run
  saving?: boolean
  onContinue: () => void | Promise<void>
}) {
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')

  async function continueSetup() {
    if (saving || continuing) return
    setContinuing(true)
    setError('')
    try {
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
        <h3 className="font-display font-bold text-xl">Ready for the next step</h3>
        <p className="ui-body">Your campaign settings are saved. Continue to your next steps and connect your ad account whenever you’re ready.</p>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="ui-muted">Daily budget</dt>
            <dd className="mt-1 font-semibold ui-text">${run.campaign.budget_usd || 25}</dd>
          </div>
          <div>
            <dt className="ui-muted">Geography</dt>
            <dd className="mt-1 font-semibold ui-text">{run.campaign.geo?.filter(Boolean).join(', ') || 'US'}</dd>
          </div>
        </dl>
        <p className="text-sm ui-muted">Campaign submission is paused for now. Continuing saves your progress without publishing ads.</p>
      </section>
      <ActionBar title="Ready to continue" description="Save your setup and see what’s next.">
        <button type="button" className="btn-primary" disabled={saving || continuing} onClick={continueSetup}>
          {saving || continuing ? 'Continuing…' : 'Continue to Next Steps'}
        </button>
      </ActionBar>
    </div>
  )
}
