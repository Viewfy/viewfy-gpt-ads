import { ThemeToggle } from './ThemeToggle'

export function SiteHeader({ onHome }: { onHome?: () => void }) {
  return (
    <header className="site-header">
      <button type="button" className="site-brand" onClick={onHome} aria-label="Viewfy home">
        <img src="/viewfy-mascot.png" alt="" className="site-brand-mark" />
        <span className="site-brand-name">Viewfy</span>
        <span className="site-brand-divider" aria-hidden="true" />
        <span className="site-brand-product">GPT Ads</span>
      </button>
      <div className="site-header-actions">
        <ThemeToggle />
      </div>
    </header>
  )
}
