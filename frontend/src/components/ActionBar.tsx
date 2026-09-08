import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

// Some mobile browsers shrink only the visual viewport when the keyboard opens.
export function useVisualViewportBottom() {
  const [bottom, setBottom] = useState(0)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setBottom(viewport.scale === 1
      ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
      : 0)
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return bottom
}

export function ActionBar({ children, title, description }: {
  children: ReactNode
  title?: string
  description?: string
}) {
  const bottom = useVisualViewportBottom()
  return (
    <div className="action-bar" role="region" aria-label="Page action" style={{ '--action-bar-lift': `${bottom}px` } as CSSProperties}>
      <div className="action-bar-inner">
        {(title || description) && <div className="action-bar-copy">
          {title && <p className="action-bar-title">{title}</p>}
          {description && <p className="action-bar-description">{description}</p>}
        </div>}
        {children}
      </div>
    </div>
  )
}
