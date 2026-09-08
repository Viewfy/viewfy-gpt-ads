import type { Campaign } from './types'

function hasId(value?: string) {
  return Boolean(value?.trim()) && !/(?:^|[_-])(demo|mock|fixture)(?:$|[_-])/i.test(value || '')
}

export function isCampaignConnected(campaign: Campaign) {
  return campaign.mode === 'live' && campaign.connected === true && hasId(campaign.account?.id)
}

export function hasCampaignIds(campaign: Campaign) {
  const ids = campaign.external_ids
  return campaign.mode === 'live' && hasId(ids?.campaign_id) && hasId(ids?.ad_group_id) && hasId(ids?.ad_id)
}

export function hasSubmittedCampaign(campaign: Campaign) {
  return hasCampaignIds(campaign)
    && ['active', 'submitted', 'under_review'].includes(campaign.status)
    && campaign.review_status !== 'rejected'
}

export function isCampaignLaunched(campaign: Campaign) {
  if (campaign.submission_deferred) return hasSubmittedCampaign(campaign)
  return Boolean(campaign.preview) || hasSubmittedCampaign(campaign)
}

export function campaignOutcome(campaign: Campaign) {
  if (campaign.submission_deferred && !hasSubmittedCampaign(campaign)) {
    return { title: 'Campaign saved for later', description: 'Submission skipped for now. Your creative and campaign settings are saved.' }
  }
  if (!campaign.preview && campaign.mode === 'live' && (campaign.status === 'failed' || campaign.review_status === 'rejected')) {
    return { title: 'Campaign needs attention', description: 'Review the error below and finish campaign setup.' }
  }
  if (isCampaignLaunched(campaign)) {
    return { title: 'Campaign launched!', description: 'Your first ChatGPT ads are live. Here’s what happens next.' }
  }
  return { title: 'Campaign not launched', description: 'Finish your account connection and launch the campaign when you’re ready.' }
}
