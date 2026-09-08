import { useEffect, useState } from 'react'
import { applyTheme, readTheme, type Theme } from '../lib/theme'

export function ThemeToggle() {
  const [mode, setMode] = useState<Theme>('dark')

  useEffect(() => {
    setMode(readTheme())
  }, [])

  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setMode(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-xs font-semibold text-neutral-700 dark:text-[#f4efe6] hover:bg-black/5 dark:hover:bg-white/10"
      aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {mode === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
