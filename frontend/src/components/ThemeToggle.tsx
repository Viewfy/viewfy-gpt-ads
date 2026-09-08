import { useState } from 'react'
import { applyTheme, readTheme, type Theme } from '../lib/theme'

export function ThemeToggle() {
  const [mode, setMode] = useState<Theme>(readTheme)

  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setMode(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {mode === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
