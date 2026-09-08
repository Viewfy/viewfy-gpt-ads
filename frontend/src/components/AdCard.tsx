import type { Ad, Side } from '../lib/types'

const SHOTS = [
  '1551836022-d5d88e9218df',
  '1556742049-0cfed4f6a45d',
  '1521737604893-d14cc237f11d',
  '1553877522-43269d4ea984',
  '1542744173-8e7e53415bb0',
  '1516321318423-f06f85e504b3',
  '1552664730-d307ca884978',
  '1573497019940-1c28c88b4f3e',
  '1522071820081-009f0129c71c',
  '1486312338219-ce68d2c6f44d',
]

function photoFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const shot = SHOTS[h % SHOTS.length]
  return `https://images.unsplash.com/photo-${shot}?auto=format&fit=crop&w=800&h=500&q=60`
}

export function StatusNote({ side }: { side: Side }) {
  if (side.status === 'error') {
    return (
      <p className="text-sm text-red-600">
        Source unavailable. {side.error || ''}{' '}
        {side.source_url && (
          <a href={side.source_url} className="underline" target="_blank" rel="noreferrer">
            Open source
          </a>
        )}
      </p>
    )
  }
  if (side.status === 'empty' || !side.ads?.length) {
    return (
      <p className="text-sm text-neutral-500">
        No matching ads found.{' '}
        {side.source_url && (
          <a href={side.source_url} className="underline" target="_blank" rel="noreferrer">
            Check the library
          </a>
        )}
      </p>
    )
  }
  return null
}

export function AdCard({ ad }: { ad: Ad }) {
  const dates = [ad.started_at?.slice(0, 10), ad.ended_at?.slice(0, 10)].filter(Boolean).join(' – ')
  const src = ad.image_url || photoFor(ad.id)
  return (
    <article className="h-full flex flex-col rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1a1816]">
      <div className="relative aspect-[16/10] bg-neutral-100 dark:bg-white/5">
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="p-3 space-y-1 flex-1 flex flex-col">
        <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-[#6b6560]">
          {[ad.platform, ad.format, ad.status, dates, ad.impressions && `${ad.impressions} reach`].filter(Boolean).join(' · ')}
        </p>
        {ad.headline && <p className="text-sm font-semibold text-neutral-900 dark:text-[#f4efe6] line-clamp-2">{ad.headline}</p>}
        {ad.body && <p className="text-sm text-neutral-600 dark:text-[#a39c92] line-clamp-2 flex-1">{ad.body}</p>}
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-[#a39c92] pt-1">
          {ad.advertiser && <span>{ad.advertiser}</span>}
          {ad.cta && <span>{ad.cta}</span>}
          {ad.source_url && (
            <a href={ad.source_url} target="_blank" rel="noreferrer" className="text-accent-700 underline">
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
