import library from '../../../fixtures/superagent/library.json'
import answerSnapshot from '../../../fixtures/superagent/ai-answers.json'

export type Lane = { id: string; label: string; color: string; note: string }
export type Channel = { label: string; color: string; ink: string; icon: string }
export type MarketProfile = {
  category?: string
  summary?: string
  audience?: string
  positioning?: string
  offer?: string
  pricing?: string
  price?: string
  cta?: string
  differentiators?: string[]
  limitations?: string[]
  source_ids?: string[]
}
export type Comp = {
  id: string
  name: string
  domain: string
  lane: string
  price: string
  tag: string
  vs: string
  channels: string[]
  hooks: string[]
  profile?: MarketProfile
  channelEvidence?: Record<string, { records: number; thirdPartyRecords: number; note: string }>
}
export type Venue = { id: string; label: string; color: string; icon: string; standing: string; filed: number }
export type Thread = { venue: string; title: string; author: string; age: string; snippet: string; score: number; status: string; intent: string }
export type Prompt = {
  id: string
  text: string
  topic: string
  intent: string
  results: {
    engine: string
    named: boolean
    brands: string[]
    excerpt: string
    response: string
    model: string
    method: 'web_app' | 'api'
    sourceLabel: string
    collectedAt: string
    citations: { id?: number; title: string; url: string }[]
  }[]
}
export type Insight = { kind: 'act' | 'gap' | 'risk' | 'win'; score: number; title: string; why: string; go: string }

export const LANES: Lane[] = [
  { id: 'insurance', label: 'Insurance AI', color: '#e8c36a', note: 'Voice automation explicitly positioned for insurance agencies.' },
  { id: 'desk', label: 'Receptionist', color: '#7eb8e8', note: 'Receptionist products serving business phone and appointment workflows.' },
  { id: 'voice', label: 'Voice AI', color: '#b39dfa', note: 'Platforms for building and deploying voice workflows.' },
  { id: 'answering', label: 'Answering service', color: '#9ad0c2', note: 'Managed human call answering and related business services.' },
]

export const CHANNELS: Record<string, Channel> = {
  meta: { label: 'Meta ads', color: '#3d7bff', ink: '#ffffff', icon: 'meta' },
  google: { label: 'Google ads', color: '#5bc27a', ink: '#0c0b0a', icon: 'google' },
  linkedin: { label: 'LinkedIn', color: '#4c9be8', ink: '#0c0b0a', icon: 'linkedin' },
  x: { label: 'X', color: '#e7e5e4', ink: '#0c0b0a', icon: 'x' },
  youtube: { label: 'YouTube', color: '#ff5252', ink: '#ffffff', icon: 'youtube' },
  newsletter: { label: 'Newsletter sponsorship', color: '#c9b58a', ink: '#0c0b0a', icon: 'pen' },
  chatgpt: { label: 'ChatGPT ad captures', color: '#10a37f', ink: '#ffffff', icon: 'chatgpt' },
  tiktok: { label: 'TikTok campaigns', color: '#e7e5e4', ink: '#0c0b0a', icon: 'tiktok' },
  blog: { label: 'Website / SEO', color: '#c9b58a', ink: '#0c0b0a', icon: 'pen' },
  reddit: { label: 'Reddit', color: '#ff6a3d', ink: '#0c0b0a', icon: 'reddit' },
}

export const SECTIONS = [
  { id: 'buyers', label: 'Buyers asking', short: 'Buyers', color: '#5eead4', icon: 'bubble', side: 'right' as const, note: 'Public buyer questions, grouped by the decision people are trying to make.' },
  { id: 'answers', label: 'AI answers', short: 'AI answers', color: '#f0abfc', icon: 'sparkle', side: 'right' as const, note: 'Captured engine answers with full response text, brands mentioned, and source links.' },
  { id: 'you', label: 'Your channels', short: 'You', color: '#e8c36a', icon: 'flag', side: 'right' as const, note: 'Channels with saved public advertising evidence for SUPERAGENT. Saved ads do not establish current activity.' },
  { id: 'competitors', label: 'Competitors', short: 'Competitors', color: '#7eb8e8', icon: 'target', side: 'left' as const, note: 'Companies grouped by product category, with sourced profiles and public ad evidence.' },
]

type RecordedAd = { platform?: string; headline?: string | null; source_url?: string | null; evidence_type?: string | null; advertiser_relationship?: string | null }
type RecordedSide = { ads?: RecordedAd[] }
type ResearchSubject = {
  kind: string
  name: string
  domain: string
  profile?: MarketProfile
  meta?: RecordedSide
  google?: RecordedSide
  newsletter?: RecordedSide
  linkedin?: RecordedSide
  youtube?: RecordedSide
  x?: RecordedSide
  reddit?: RecordedSide
  other_ads?: RecordedAd[]
}
const research = library as unknown as { source?: string; researched_at?: string; subjects: ResearchSubject[] }
export const PUBLIC_RESEARCH_SNAPSHOT = { source: research.source, observedAt: research.researched_at }
const CATEGORIES: Record<string, { id: string; lane: string }> = {
  'sonant.ai': { id: 'sonant', lane: 'insurance' },
  'smith.ai': { id: 'smith', lane: 'desk' },
  'callruby.com': { id: 'ruby', lane: 'desk' },
  'ruby.com': { id: 'ruby', lane: 'desk' },
  'goodcall.com': { id: 'goodcall', lane: 'desk' },
  'myaifrontdesk.com': { id: 'frontdesk', lane: 'desk' },
  'heyrosie.com': { id: 'rosie', lane: 'desk' },
  'retellai.com': { id: 'retell', lane: 'voice' },
  'synthflow.ai': { id: 'synthflow', lane: 'voice' },
  'bland.ai': { id: 'bland', lane: 'voice' },
  'answerconnect.com': { id: 'answerconnect', lane: 'answering' },
  'patlive.com': { id: 'patlive', lane: 'answering' },
}
const AD_CHANNELS = ['meta', 'google', 'newsletter', 'linkedin', 'youtube', 'x', 'reddit'] as const

function isRecordedAd(ad: RecordedAd): boolean {
  if (!ad.source_url) return false
  // Old mock rows linked to a domain search rather than an observed creative.
  // Explicit evidence labels cover publisher-confirmed sponsorships as well.
  return /\/creative\/CR\d+|facebook\.com\/ads\/library\/\?[^#]*\bid=\d+/i.test(ad.source_url)
    || ['ad_library', 'ad_library_verified', 'publisher_confirmed_paid_ad', 'publisher_confirmed_campaign', 'third_party_observed_ad', 'verified_ad', 'primary_ad_library'].includes(ad.evidence_type || '')
}

function recordedAdGroups(subject: ResearchSubject): Record<string, RecordedAd[]> {
  const groups: Record<string, RecordedAd[]> = {}
  for (const channel of AD_CHANNELS) {
    const ads = subject[channel]?.ads?.filter(isRecordedAd) || []
    if (ads.length) groups[channel] = ads
  }
  for (const ad of subject.other_ads || []) {
    const channel = ad.platform?.toLowerCase()
    if (channel && CHANNELS[channel] && isRecordedAd(ad)) (groups[channel] ||= []).push(ad)
  }
  return groups
}

function channelEvidence(subject: ResearchSubject): NonNullable<Comp['channelEvidence']> {
  return Object.fromEntries(Object.entries(recordedAdGroups(subject)).map(([channel, ads]) => {
    const thirdPartyRecords = ads.filter(ad => ad.advertiser_relationship === 'unverified_third_party').length
    const independent = ads.some(ad => ad.evidence_type === 'third_party_observed_ad')
    return [channel, { records: ads.length, thirdPartyRecords, note: thirdPartyRecords === ads.length
      ? 'Domain-matched ads from other advertisers; relationship to the brand is unverified.'
      : independent ? 'Independent public captures; official delivery and campaign ownership are not confirmed.'
      : 'Saved public advertising evidence; current activity and performance are not inferred.' }]
  }))
}

// The research library is the single source for descriptions, prices and hooks.
// No profile or claim is reconstructed from the old illustrative market data.
export const COMPETITORS: Comp[] = research.subjects
  .filter(subject => subject.kind !== 'self' && subject.profile)
  .map(subject => {
    const domain = subject.domain.toLowerCase().replace(/^www\./, '')
    const category = CATEGORIES[domain]
    const profile = subject.profile!
    return {
      id: category?.id || domain.replace(/[^a-z0-9]+/g, '-'),
      name: subject.name,
      domain,
      lane: category?.lane || 'desk',
      price: profile.pricing || profile.price || 'Price not published in the collected evidence',
      tag: profile.positioning || profile.summary || profile.category || '',
      vs: profile.summary || '',
      channels: Object.keys(recordedAdGroups(subject)),
      channelEvidence: channelEvidence(subject),
      hooks: Object.values(recordedAdGroups(subject)).flat()
        .filter(ad => ad.advertiser_relationship !== 'unverified_third_party')
        .map(ad => ad.headline?.trim() || '')
        .filter((headline, index, all) => Boolean(headline) && all.indexOf(headline) === index)
        .slice(0, 3),
      profile,
    }
  })

// Collection gaps remain empty instead of displaying invented buyer activity.
export const VENUES: Venue[] = []
export const THREADS: Thread[] = []

export const ENGINES = {
  chatgpt: { label: 'ChatGPT', color: '#10a37f', ink: '#0c0b0a' },
  claude: { label: 'Claude', color: '#d4a27f', ink: '#0c0b0a' },
  perplexity: { label: 'Perplexity', color: '#20808d', ink: '#ffffff' },
}

export const ANSWER_TOPICS = [
  { id: 'choose', label: 'Choosing a receptionist', icon: 'search' },
  { id: 'coverage', label: 'Missed-call coverage', icon: 'phone' },
  { id: 'compare', label: 'Comparing options', icon: 'users' },
]

// Verbatim engine captures and their original citation links are saved together.
export const PROMPTS: Prompt[] = answerSnapshot.prompts as Prompt[]

const self = research.subjects.find(subject => subject.kind === 'self')
export const YOU: { id: string; gap?: boolean; sub: string }[] = self
  ? Object.entries(channelEvidence(self)).map(([id, evidence]) => ({
    id,
    sub: `${evidence.records} saved public creatives. ${evidence.note}`,
  }))
  : []

// Sourced insights are stored with the research library, not fabricated here.
export const INSIGHTS: Insight[] = []

export const BRIEF_COMPETITORS = COMPETITORS.map((c) => ({
  id: c.id,
  branch: 'competitors' as const,
  text: c.name,
  source_url: `https://${c.domain}`,
  provenance: 'confirmed' as const,
  domain: c.domain,
}))
