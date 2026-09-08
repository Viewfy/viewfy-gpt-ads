import { STEPS } from '../lib/types'

function indexOf(step: string) {
  const i = STEPS.findIndex((s) => (s.match as readonly string[]).includes(step))
  return Math.max(0, i)
}

export function Stepper({ step, onJump }: { step: string; onJump?: (id: string) => void }) {
  const cur = indexOf(step)
  return (
    <ol className="flex flex-wrap gap-2 text-sm font-semibold">
      {STEPS.map((s, i) => {
        const done = i < cur
        const here = i === cur
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump?.(s.id)}
              className={`rounded-full px-3 py-1 border ${
                here
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white'
                  : done
                    ? 'bg-white text-neutral-800 border-neutral-300 dark:bg-white/10 dark:text-[#f4efe6] dark:border-white/20'
                    : 'bg-transparent text-neutral-400 border-neutral-200 dark:text-neutral-500 dark:border-white/10'
              }`}
            >
              {i + 1}. {s.label}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
