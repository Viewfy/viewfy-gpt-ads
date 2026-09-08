import snapshot from '../../../fixtures/superagent/creative-variants.json'
import type { Creative, Run } from './types'

export type CreativeVariant = {
  id: string
  label: string
  name: string
  description: string
  image_url: string
}

export type CreativeVariantGroup = {
  concept_id: string
  creative_id: string
  headline: string
  variants: CreativeVariant[]
}

type VariantSnapshot = { ready: boolean; groups: CreativeVariantGroup[] }
type CreativeRun = Pick<Run, 'domain' | 'creative' | 'creatives'>

export function getCreativeVariantGroups(run: CreativeRun, variants: VariantSnapshot = snapshot): CreativeVariantGroup[] {
  if (!variants.ready || !variants.groups.length) return []
  try {
    const url = new URL(run.domain.includes('://') ? run.domain : `https://${run.domain}`)
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
    if (!['https:', 'http:'].includes(url.protocol) || host !== 'getsuperagent.com') return []
  } catch {
    return []
  }

  const ads = run.creatives?.length ? run.creatives : run.creative ? [run.creative] : []
  if (!variants.groups.every((group) => ads.some((ad) => ad.id === group.creative_id && ad.concept_id === group.concept_id))) return []
  return variants.groups
}

export function creativeVariantPatch(ad: Creative, group: CreativeVariantGroup, variant: CreativeVariant): Partial<Creative> | null {
  if (ad.id !== group.creative_id || ad.concept_id !== group.concept_id) return null
  if (!group.variants.some((item) => item.id === variant.id && item.image_url === variant.image_url)) return null
  return { id: ad.id, image_url: variant.image_url }
}
