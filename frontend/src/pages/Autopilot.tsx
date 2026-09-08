import { ActionBar } from '../components/ActionBar'
import { CampaignRoadmap } from '../components/CampaignRoadmap'
import { campaignOutcome, isCampaignLaunched } from '../lib/campaign-state'
import type { Run } from '../lib/types'

export function Autopilot({ run, onContinue }: { run: Run; onContinue: () => void }) {
  const launched = isCampaignLaunched(run.campaign)
  const outcome = campaignOutcome(run.campaign)
  const raw = run.brand.name || run.domain
  const brand = raw === raw.toUpperCase() && raw.length > 3 ? raw.charAt(0) + raw.slice(1).toLowerCase() : raw
  return (
    <div className="ui-page campaign-roadmap-page ui-page--actions">
      <div className="text-center">
        <picture>
          <source srcSet="/astra-hug-superagent-fireworks.webp?v=2" type="image/webp" />
          <img
            src="/astra-hug-superagent-fireworks.png?v=2"
            alt={`Astra hugging the ${brand} logo with fireworks`}
            width={760}
            height={760}
            className="w-52 sm:w-64 lg:w-72 h-auto mx-auto select-none pointer-events-none"
          />
        </picture>
        <h2 className="mt-3 font-display font-extrabold text-5xl sm:text-6xl tracking-tight">{outcome.title}</h2>
        <p className="mt-4 ui-body">{outcome.description}</p>
      </div>

      <CampaignRoadmap />
      <ActionBar title={outcome.title} description={outcome.description}>
        {launched
          ? <a className="btn-primary" href="https://ads.openai.com" target="_blank" rel="noopener noreferrer">Open Ads Manager</a>
          : <button type="button" className="btn-primary" onClick={onContinue}>Review campaign setup</button>}
      </ActionBar>
    </div>
  )
}
