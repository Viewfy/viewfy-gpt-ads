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
  headline?: string | null
  body?: string | null
  cta?: string | null
  image_url?: string | null
  link_url?: string | null
  format?: string | null
  started_at?: string | null
  ended_at?: string | null
  is_active?: boolean | null
  source_url?: string | null
  status?: string | null
  impressions?: string | null
}

export type Side = {
  platform: string
  status: string
  error?: string | null
  source_url?: string
  ads: Ad[]
  page_name?: string | null
}

export type Subject = {
  kind: string
  name: string
  domain: string
  meta: Side
  google: Side
}

export type Insight = {
  title: string
  observation: string
  recommendation: string
  because: string[]
  signals: string[]
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
  status: string
  mode?: string | null
  budget_usd: number
  geo: string[]
  account?: { id?: string; name?: string; review?: string } | null
  error?: string | null
  note?: string
  review_status?: string
  connected?: boolean
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
  map: { nodes: MapNode[]; missing: string[] }
  brief?: { version?: string; nodes?: MapNode[] } | null
  brief_version?: string | null
  ads: { status: string; subjects: Subject[]; error?: string | null; source?: string }
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
  { id: 'product', label: 'Your product', match: ['understanding', 'confirmation', 'product'] },
  { id: 'research', label: 'Your competitors', match: ['research'] },
  { id: 'launch', label: 'Launch', match: ['concepts', 'creatives', 'launch'] },
  { id: 'ads', label: 'Connect ads', match: ['ads'] },
  { id: 'autopilot', label: 'Roadmap', match: ['autopilot', 'done'] },
] as const
