import { useState } from 'react'
import type { Ad, Side } from '../lib/types'
import { safeExternalUrl } from '../lib/external-url'

const EVIDENCE_LABELS: Record<string, string> = {
  ad_library: 'Ad library record',
  primary_ad_library: 'Ad library record',
  ad_library_verified: 'Verified ad library record',
  primary_ad_library_domain_match: 'Ad library · domain match',
  publisher_confirmed_campaign: 'Campaign confirmed by publisher',
}

export function researchStatusLabel(status?: string) {
  if (!status) return 'Unverified'
  if (/blocked|login|captcha|restricted/i.test(status)) return 'Access limited'
  if (/error|unavailable|failed/i.test(status)) return 'Source unavailable'
  if (/empty|unknown|not_found|unverified|not_checked|no_verified/i.test(status)) return 'Unverified'
  if (/pending|running|searching/i.test(status)) return 'Checking'
  return status.replace(/_/g, ' ')
}

export function StatusNote({ side }: { side: Side }) {
  const hasAds = !!side.ads?.length
  const sourceUrl = safeExternalUrl(side.source_url)
  return (
    <p className="mb-3 text-sm leading-relaxed ui-muted">
      {!hasAds && <span>{researchStatusLabel(side.status)}. No paid creatives verified from this source. </span>}
      {side.error && <span>{side.error} </span>}
      {sourceUrl && (
        <a href={sourceUrl} className="underline underline-offset-2 ui-link" target="_blank" rel="noreferrer">
          Open ad library ↗
        </a>
      )}
    </p>
  )
}

export function AdCard({ ad }: { ad: Ad }) {
  const [imageFailed, setImageFailed] = useState(false)
  const dates = [
    ad.started_at && `First seen ${ad.started_at.slice(0, 10)}`,
    ad.last_shown_at && `Last seen ${ad.last_shown_at.slice(0, 10)}`,
    ad.ended_at && `Ended ${ad.ended_at.slice(0, 10)}`,
  ].filter(Boolean).join(' · ')
  const evidenceLabel = EVIDENCE_LABELS[ad.evidence_type || ''] || (ad.evidence_type || 'Public ad record').replace(/_/g, ' ')
  const activity = ad.is_active === true ? 'Listed active' : ad.is_active === false ? 'Listed inactive' : 'Activity unknown'
  const imageUrl = safeExternalUrl(ad.image_url)
  const videoUrl = safeExternalUrl(ad.video_url)
  const sourceUrl = safeExternalUrl(ad.source_url)
  const landingUrl = safeExternalUrl(ad.link_url)
  return (
    <article className="h-full flex flex-col ui-card ui-text overflow-hidden">
      {videoUrl ? (
        <video controls preload="none" poster={imageUrl} className="aspect-video w-full ui-surface">
          <source src={videoUrl} />
          <a href={videoUrl}>Open video creative</a>
        </video>
      ) : imageUrl && !imageFailed ? (
        <div className="relative aspect-[16/10] ui-surface">
          <img src={imageUrl} alt={`${ad.advertiser || 'Advertiser'} creative`} loading="lazy" onError={() => setImageFailed(true)} className="absolute inset-0 w-full h-full object-contain" />
        </div>
      ) : /image|video/i.test(ad.format || '') ? (
        <div className="border-b ui-border ui-surface px-4 py-3 text-xs ui-muted">
          Creative image unavailable · Read the source record below
        </div>
      ) : null}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-2 text-[11px] ui-muted">
          <span className="rounded-md border ui-border px-1.5 py-0.5 capitalize">{evidenceLabel}</span>
          <span>{activity}</span>
        </div>
        {ad.advertiser_relationship === 'unverified_third_party' && (
          <p className="rounded-lg border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10 p-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            Third-party advertiser · Relationship to the brand is unverified. This record is excluded from brand-owned campaign patterns.
          </p>
        )}
        <p className="text-[11px] uppercase tracking-wide ui-muted">
          {[ad.platform, ad.format].filter(Boolean).join(' · ')}
        </p>
        {dates && <p className="text-xs ui-muted">{dates}</p>}
        {ad.headline && <p className="text-sm font-semibold ui-text">{ad.headline}</p>}
        {ad.body && <p className="text-sm ui-body whitespace-pre-line flex-1">{ad.body}</p>}
        {ad.verification_note && <p className="text-xs leading-relaxed ui-muted">{ad.verification_note}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs ui-muted pt-1">
          {ad.advertiser && <span>{ad.advertiser}</span>}
          {ad.cta && <span>CTA: {ad.cta}</span>}
          {ad.observed_at && <span>Checked {ad.observed_at.slice(0, 10)}</span>}
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="ui-link underline underline-offset-2">
              Source record ↗
            </a>
          )}
          {landingUrl && (
            <a href={landingUrl} target="_blank" rel="noreferrer" className="ui-link underline underline-offset-2">
              Landing page ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
