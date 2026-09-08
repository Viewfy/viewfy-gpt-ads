import { useState } from 'react'
import { creativeVariantPatch, type CreativeVariant, type CreativeVariantGroup } from '../lib/creative-variants'
import type { Creative } from '../lib/types'
import './CreativeVariantPicker.css'

export function CreativeVariantPicker({
  groups,
  ads,
  onSave,
}: {
  groups: CreativeVariantGroup[]
  ads: Creative[]
  onSave?: (patch: Partial<Creative>) => Promise<void> | void
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<{ groupId: string; message: string } | null>(null)

  async function choose(ad: Creative, group: CreativeVariantGroup, variant: CreativeVariant) {
    if (!onSave || saving) return
    const patch = creativeVariantPatch(ad, group, variant)
    if (!patch) return
    setSaving(variant.id)
    setError(null)
    try {
      await onSave(patch)
    } catch (reason) {
      setError({
        groupId: group.creative_id,
        message: reason instanceof Error ? reason.message : `Could not save ${variant.label}. Please try again.`,
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="creative-variants" aria-labelledby="creative-variants-title">
      <div className="creative-variants-intro">
        <h3 id="creative-variants-title" className="font-display font-extrabold text-xl">Choose your artwork</h3>
        <p className="text-sm ui-muted">Three directions for each ad. Open any image for a closer look, then choose your favorite.</p>
      </div>
      {groups.map((group) => {
        const ad = ads.find((item) => item.id === group.creative_id && item.concept_id === group.concept_id)
        if (!ad) return null
        const selected = group.variants.find((variant) => variant.image_url === ad.image_url)
        const headingId = `variants-${group.creative_id}`
        return (
          <section className="creative-variant-group" key={group.creative_id} aria-labelledby={headingId}>
            <header className="creative-variant-heading">
              <div>
                <p className="creative-variant-eyebrow">Ad {group.concept_id.toUpperCase()}</p>
                <h4 id={headingId} className="font-display font-bold text-lg">{ad.title}</h4>
              </div>
              <p className="creative-variant-current" aria-live="polite">
                {selected ? `${selected.label} selected` : 'Current artwork kept until you choose'}
              </p>
            </header>
            <div className="creative-variant-grid">
              {group.variants.map((variant) => {
                const active = selected?.id === variant.id
                const pending = saving === variant.id
                return (
                  <article className="creative-variant-card ui-card" data-selected={active || undefined} key={variant.id}>
                    <a
                      className="creative-variant-artwork"
                      href={variant.image_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open full-size ${variant.label}: ${variant.name}`}
                    >
                      <img src={variant.image_url} alt={variant.description} width={1536} height={1024} loading="lazy" />
                      <span className="creative-variant-image-label">{variant.label}</span>
                    </a>
                    <div className="creative-variant-content">
                      <h5 className="font-display font-bold">{variant.name}</h5>
                      <p className="creative-variant-description">{variant.description}</p>
                      <a className="creative-variant-full ui-link" href={variant.image_url} target="_blank" rel="noreferrer" aria-label={`View ${variant.label} full size`}>
                        View full size ↗
                      </a>
                      <button
                        className={active ? 'btn-accent creative-variant-choice' : 'ui-secondary creative-variant-choice'}
                        type="button"
                        aria-pressed={active}
                        aria-busy={pending || undefined}
                        disabled={!onSave || saving !== null || active}
                        onClick={() => void choose(ad, group, variant)}
                      >
                        {pending ? `Saving ${variant.label}…` : active ? `${variant.label} selected ✓` : `Use ${variant.label}`}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
            {error?.groupId === group.creative_id && <p className="creative-variant-error" role="alert">{error.message}</p>}
          </section>
        )
      })}
    </section>
  )
}
