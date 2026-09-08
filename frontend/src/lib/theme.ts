export type Theme = 'dark' | 'light'

const KEY = 'gpt-ads-theme'

export function readTheme(): Theme {
  const stored = localStorage.getItem(KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export function applyTheme(mode: Theme) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
  localStorage.setItem(KEY, mode)
}

export function initTheme() {
  applyTheme(readTheme())
}
