import type { Creative, MapNode, Run } from './types'

const base = ''

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!r.ok) {
    const body = await r.text()
    let message = body
    try {
      const error = JSON.parse(body)
      if (typeof error.detail === 'string') message = error.detail
    } catch {
      // Some proxies return plain text instead of the API's JSON error response.
    }
    throw new Error(message.slice(0, 240) || r.statusText)
  }
  return r.json()
}

export const api = {
  health: () => req<{ mock: boolean; ads: { ok: boolean; mode: string; name?: string; error?: string } }>('/api/health'),
  create: (domain: string, fixture = false) =>
    req<Run>('/api/runs', { method: 'POST', body: JSON.stringify({ domain, fixture }) }),
  get: (id: string) => req<Run>(`/api/runs/${id}`),
  saveMap: (id: string, nodes: MapNode[], missing?: string[]) =>
    req<Run>(`/api/runs/${id}/map`, { method: 'PATCH', body: JSON.stringify({ nodes, missing }) }),
  confirm: (id: string, competitor_ids?: string[]) =>
    req<Run>(`/api/runs/${id}/confirm`, { method: 'POST', body: JSON.stringify({ competitor_ids }) }),
  concepts: (id: string) => req<Run>(`/api/runs/${id}/concepts`, { method: 'POST' }),
  select: (id: string, conceptId: string) =>
    req<Run>(`/api/runs/${id}/concepts/${conceptId}/select`, { method: 'POST' }),
  patchCreative: (id: string, patch: Partial<Creative>) =>
    req<Run>(`/api/runs/${id}/creative`, { method: 'PATCH', body: JSON.stringify(patch) }),
  saveCampaign: (id: string, budget_usd: number, geo: string[]) =>
    req<Run>(`/api/runs/${id}/campaign`, { method: 'PATCH', body: JSON.stringify({ budget_usd, geo }) }),
  connectAds: (id: string, key = '') =>
    req<Run>(`/api/runs/${id}/ads/connect`, { method: 'POST', body: JSON.stringify({ key }) }),
  launch: (id: string, budget_usd: number, geo: string[]) =>
    req<Run>(`/api/runs/${id}/launch`, { method: 'POST', body: JSON.stringify({ budget_usd, geo }) }),
  skipLaunch: (id: string) => req<Run>(`/api/runs/${id}/skip-launch`, { method: 'POST' }),
  refreshAds: (id: string) => req<Run>(`/api/runs/${id}/ads/refresh`, { method: 'POST' }),
  githubLogin: (id: string) => {
    window.location.href = `/api/github/login?run_id=${encodeURIComponent(id)}`
  },
  startTracking: (id: string, repo: string) =>
    req<Run>(`/api/runs/${id}/tracking`, { method: 'POST', body: JSON.stringify({ repo }) }),
  export: (id: string) => req<Record<string, unknown>>(`/api/runs/${id}/export`),
}
