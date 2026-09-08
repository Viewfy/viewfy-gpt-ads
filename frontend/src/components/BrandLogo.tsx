import './BrandLogo.css'

const LOGOS: Record<string, string> = {
  chatgpt: '/logos/chatgpt.webp',
  claude: '/logos/claude.png',
  perplexity: '/logos/perplexity.svg',
  google: '/logos/google.png',
  meta: '/logos/meta.jpg',
  linkedin: '/logos/linkedin.png',
  x: '/logos/x.png',
  youtube: '/logos/youtube.png',
  reddit: '/logos/reddit.png',
  tiktok: '/logos/tiktok.png',
}

export function hasBrandLogo(name: string) {
  return Object.prototype.hasOwnProperty.call(LOGOS, name)
}

export function BrandLogo({ brand, size = 24, className = '' }: { brand: string; size?: number; className?: string }) {
  const src = LOGOS[brand]
  if (!src) return null
  return <span className={`brand-logo ${className}`} data-brand={brand} style={{ width: size, height: size }} aria-hidden="true">
    <img src={src} alt="" width={size} height={size} draggable={false} />
  </span>
}
