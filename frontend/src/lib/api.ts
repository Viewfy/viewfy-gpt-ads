import type { Creative, MapNode, Run } from './types'

const base = ''

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text.slice(0, 240) || r.statusText)
  }
  return r.json()
}

export const api = {
  health: () => req<{ ads: { ok: boolean; mode: string; name?: string; error?: string } }>('/api/health'),
  create: (domain: string, fixture = true) =>
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
  refreshAds: (id: string) => req<Run>(`/api/runs/${id}/ads/refresh`, { method: 'POST' }),
  githubLogin: (id: string) => {
    window.location.href = `/api/github/login?run_id=${encodeURIComponent(id)}`
  },
  startTracking: (id: string, repo: string) =>
    req<Run>(`/api/runs/${id}/tracking`, { method: 'POST', body: JSON.stringify({ repo }) }),
  export: (id: string) => req<Record<string, unknown>>(`/api/runs/${id}/export`),
}
