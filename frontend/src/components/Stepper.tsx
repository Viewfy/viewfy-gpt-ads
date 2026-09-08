import { STEPS } from '../lib/types'

function indexOf(step: string) {
  const i = STEPS.findIndex((s) => (s.match as readonly string[]).includes(step))
  return Math.max(0, i)
}

export function Stepper({ step, onJump }: { step: string; onJump?: (id: string) => void }) {
  const cur = indexOf(step)
  return (
    <ol className="wizard-steps">
      {STEPS.map((s, i) => {
        const done = i < cur
        const here = i === cur
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump?.(s.id)}
              className="wizard-step"
              aria-current={here ? 'step' : undefined}
              data-complete={done || undefined}
            >
              {i + 1}. {s.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
