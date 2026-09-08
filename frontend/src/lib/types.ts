export type Provenance = 'website' | 'inference' | 'confirmed'

export type Branch =
  | 'products'
  | 'customers'
  | 'problems'
  | 'offers'
  | 'differentiators'
  | 'voice'
  | 'geography'
  | 'competitors'

export type MapNode = {
  id: string
  branch: Branch
  text: string
  source_url: string
  provenance: Provenance
  domain?: string
}

export type Page = {
  kind: string
  url: string
  status: string
  excerpt: string
  error?: string | null
}

export type Ad = {
  id: string
  platform: string
  advertiser?: string | null
  advertiser_relationship?: string | null
  headline?: string | null
  body?: string | null
  cta?: string | null
  image_url?: string | null
  link_url?: string | null
  format?: string | null
  started_at?: string | null
  ended_at?: string | null
  last_shown_at?: string | null
  is_active?: boolean | null
  source_url?: string | null
  status?: string | null
  impressions?: string | null
  evidence_type?: string
  source_id?: string
  observed_at?: string
  verification_note?: string
  video_url?: string | null
}

export type Side = {
  platform: string
  status: string
  error?: string | null
  source_url?: string
  ads: Ad[]
  page_name?: string | null
}

export type PublicChannelItem = {
  id: string
  kind: 'article' | 'post' | 'video' | 'page' | 'press' | 'profile' | 'event'
  title: string
  summary: string
  url: string
  published_at?: string
  observed_at: string
}

export type PublicChannel = {
  id: string
  label: string
  icon: string
  kind: 'owned' | 'social' | 'earned'
  url: string
  description: string
  items: PublicChannelItem[]
}

export type PublicChannelSnapshot = {
  domain: string
  source: string
  version?: string
  observed_at: string
  channels: PublicChannel[]
}

export type Subject = {
  kind: string
  name: string
  domain: string
  meta: Side
  google: Side
  other_ads?: Ad[]
  profile?: {
    category?: string
    summary?: string
    audience?: string
    positioning?: string
    offer?: string
    pricing?: string
    cta?: string
    differentiators?: string[]
    limitations?: string[]
    source_ids?: string[]
  }
  sources?: {
    id: string
    url: string
    title: string
    kind: string
    observed_at?: string
    summary: string
    quotes?: string[]
  }[]
  ad_checks?: {
    platform: string
    url: string
    status: string
    note: string
    checked_at?: string
  }[]
  findings?: string[]
}

export type Insight = {
  title: string
  observation: string
  recommendation: string
  because: string[]
  signals: string[]
  evidence?: { source_id?: string; subject?: string; url: string; title: string; detail?: string }[]
  confidence?: string
  limitation?: string
}

export type Concept = {
  id: string
  name: string
  angle: string
  why: string
  headline: string
  body: string
  cta: string
  visual: string
}

export type Creative = {
  id: string
  concept_id: string
  title: string
  body: string
  cta: string
  target_url: string
  image_url?: string | null
  format: string
}

export type TrackingRepo = {
  full_name: string
  default_branch: string
  html_url: string
  private?: boolean
}

export type Tracking = {
  status: 'idle' | 'connecting' | 'connected' | 'running' | 'pr_ready' | 'error' | string
  login?: string | null
  repos?: TrackingRepo[]
  repo?: string | null
  agent_id?: string | null
  pr_url?: string | null
  snippet?: string | null
  note?: string | null
  error?: string | null
}

export type Campaign = {
  submission_deferred?: boolean
  status: string
  mode?: string | null
  budget_usd: number
  geo: string[]
  account?: { id?: string; name?: string; review?: string } | null
  error?: string | null
  note?: string
  review_status?: string
  connected?: boolean
  preview?: boolean
  insights?: { impressions?: number; clicks?: number; spend?: number; days?: number } | null
  external_ids?: { campaign_id?: string; ad_group_id?: string; ad_id?: string; file_id?: string }
}

export type Run = {
  id: string
  domain: string
  step: string
  status: string
  error?: string | null
  source?: string
  brand: {
    name: string
    one_liner: string
    logo_url?: string | null
    colors: string[]
    category?: string
  }
  pages: Page[]
  public_channels?: PublicChannelSnapshot
  map: { nodes: MapNode[]; missing: string[] }
  brief?: { version?: string; nodes?: MapNode[] } | null
  brief_version?: string | null
  ads: {
    status: string
    subjects: Subject[]
    error?: string | null
    source?: string
    researched_at?: string
    research_version?: string
    methodology?: string | string[]
    coverage?: string | string[]
  }
  insights: Insight[]
  concepts: Concept[]
  selected_concept_id?: string | null
  creative?: Creative | null
  creatives?: Creative[]
  campaign: Campaign
  tracking?: Tracking
  stale: { research: boolean; concepts: boolean; creatives: boolean }
}

export const STEPS = [
  { id: 'product', label: 'Your product', match: ['understanding', 'confirmation', 'product', 'research'] },
  { id: 'launch', label: 'Launch', match: ['concepts', 'creatives', 'launch'] },
  { id: 'ads', label: 'Connect ChatGPT Ads', match: ['ads'] },
  { id: 'autopilot', label: 'Next Steps', match: ['autopilot', 'done'] },
] as const
