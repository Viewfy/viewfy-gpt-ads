import { CHANNELS, COMPETITORS, type Comp } from './market'
import type { Ad, MapNode, PublicChannelItem, PublicChannelSnapshot, Run, Side, Subject } from './types'
import researchLibrary from '../../../fixtures/superagent/library.json'
import publicChannels from '../../../fixtures/superagent/channels.json'

export type MapChannel = {
  id: string
  label: string
  icon: string
  ads: Ad[]
  content?: PublicChannelItem[]
  kind?: 'owned' | 'social' | 'earned'
  status: 'ready' | 'empty' | 'unavailable' | 'unresearched'
  sourceUrl?: string
  description: string
  evidence: 'research' | 'unverified' | 'listed'
  checkedAt?: string
  checkNote?: string
}

export function safeExternalUrl(value?: string | null): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

function normalizeDomain(value?: string): string {
  if (!value?.trim()) return ''
  const input = value.trim()
  const url = safeExternalUrl(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`)
  if (!url) return ''
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
  return host === 'callruby.com' ? 'ruby.com' : host
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function getMapCompetitors(nodes: MapNode[], _domain: string): Comp[] {
  const listed = nodes.filter((node) => node.branch === 'competitors')
  return listed.map((node) => {
    const host = normalizeDomain(node.domain)
    // A domain is stronger evidence than a familiar name or a reused node ID.
    const known = host
      ? COMPETITORS.find((competitor) => normalizeDomain(competitor.domain) === host)
      : COMPETITORS.find((competitor) => competitor.id === node.id || normalizeName(competitor.name) === normalizeName(node.text))
    return {
      ...known,
      id: node.id,
      name: node.text || known?.name || host,
      domain: host || known?.domain || '',
      lane: known?.lane || 'desk',
      price: known?.price || '',
      tag: known?.tag || node.text,
      vs: known?.vs || '',
      channels: known ? [...known.channels] : [],
      hooks: known ? [...known.hooks] : [],
      profile: known?.profile,
    }
  })
}

export function researchContext(run: Run): { subjects: Subject[]; source?: string } {
  const savedSubjects = run.ads.subjects || []
  // The confirmation screen can explore the saved public snapshot before research starts.
  // Never replace a completed/failed check or any populated research.
  const useSnapshot = run.source === 'fixture' && run.ads.status === 'idle' && !savedSubjects.length
  return {
    subjects: useSnapshot ? researchLibrary.subjects : savedSubjects,
    source: useSnapshot ? researchLibrary.source : run.ads.source || run.source,
  }
}

function findSubject(availableSubjects: Subject[], competitor: Comp): Subject | undefined {
  const subjects = availableSubjects.filter((subject) => subject.kind !== 'self')
  const domain = normalizeDomain(competitor.domain)
  if (domain) {
    const byDomain = subjects.find((subject) => normalizeDomain(subject.domain) === domain)
    if (byDomain) return byDomain
  }
  const name = normalizeName(competitor.name)
  if (!name) return undefined
  const byName = subjects.filter((subject) => {
    const subjectDomain = normalizeDomain(subject.domain)
    return normalizeName(subject.name) === name && (!domain || !subjectDomain || subjectDomain === domain)
  })
  // A name-only match must be unambiguous, and must never override a conflicting domain.
  return byName.length === 1 ? byName[0] : undefined
}

export function getResearchRun(run: Run): Run {
  const useSnapshot = run.source === 'fixture' && run.ads.status === 'idle' && !run.ads.subjects.length
  return useSnapshot ? { ...run, ads: researchLibrary as Run['ads'] } : run
}

export function getCompetitorSubject(run: Run, competitor: Comp): Subject | undefined {
  return findSubject(researchContext(run).subjects, competitor)
}

export function getSelfSubject(run: Run): Subject | undefined {
  return researchContext(run).subjects.find(subject => subject.kind === 'self' && normalizeDomain(subject.domain) === normalizeDomain(run.domain))
}

function channelAppearance(id: string): { label: string; icon: string } {
  return CHANNELS[id] || {
    label: id === 'chatgpt' ? 'ChatGPT ads' : id === 'tiktok' ? 'TikTok ads' : id.charAt(0).toUpperCase() + id.slice(1),
    icon: id === 'chatgpt' ? 'chatgpt' : id === 'tiktok' ? 'tiktok' : 'bubble',
  }
}

function researchChannel(run: Run, id: string, side: Side | undefined, source?: string): MapChannel {
  const channel = channelAppearance(id)
  const unverified = source === 'fixture'
  const ads = unverified ? [] : side?.ads || []
  const status = side?.status?.toLowerCase() || ''
  const sourceUrl = safeExternalUrl(side?.source_url) || ads.map((ad) => safeExternalUrl(ad.source_url)).find(Boolean)
  const result: MapChannel = {
    id,
    label: channel.label,
    icon: channel.icon,
    ads,
    status: 'unresearched',
    sourceUrl,
    description: 'This channel has not been researched for this business yet.',
    evidence: unverified ? 'unverified' : 'research',
  }

  if (unverified) {
    result.description = 'No verified ad records are available for this channel. Run ad research to collect source-backed records.'
    return result
  }
  if (ads.length) {
    result.status = 'ready'
    result.description = `${ads.length} saved ${ads.length === 1 ? 'ad' : 'ads'} from this channel. Current activity may have changed.`
    if (side?.error || ['error', 'failed', 'unavailable', 'blocked'].includes(status)) {
      result.description += ' The latest source check was unavailable; saved ads are still shown.'
    }
  } else if (side?.error || ['error', 'failed', 'unavailable', 'blocked', 'unknown', 'identity_unresolved'].includes(status) || (!side && run.ads.status === 'error')) {
    result.status = 'unavailable'
    result.description = 'Ad activity could not be verified from this source. No ads were saved.'
  } else if (['ok', 'ready', 'empty', 'success', 'no_verified_matches', 'no_results_in_checked_scope'].includes(status)) {
    result.status = 'empty'
    result.description = 'No matching ads were found in the last check. This does not confirm that the business runs no ads.'
  } else if (['running', 'pending', 'loading'].includes(status) || (!side && run.ads.status === 'running')) {
    result.description = 'Ad research is in progress. Ads will appear when results are available.'
  }
  return result
}

export function getCompetitorChannels(run: Run, competitor: Comp): MapChannel[] {
  const context = researchContext(run)
  const subject = findSubject(context.subjects, competitor)
  return subjectChannels(run, subject, context.source, competitor.channels)
}

export function getSelfChannels(run: Run): MapChannel[] {
  const context = researchContext(run)
  const subjects = context.subjects.filter(subject => subject.kind === 'self')
  const domain = normalizeDomain(run.domain)
  const subject = domain
    ? subjects.find(subject => normalizeDomain(subject.domain) === domain)
    : subjects.length === 1 ? subjects[0] : undefined
  const paidChannels = subjectChannels(run, subject, context.source)
  const saved = run.public_channels
  const snapshot = saved && normalizeDomain(saved.domain) === domain
    ? saved
    : normalizeDomain(publicChannels.domain) === domain
      ? publicChannels as PublicChannelSnapshot
      : undefined
  const contentChannels: MapChannel[] = (snapshot?.channels || []).flatMap(channel => {
    const sourceUrl = safeExternalUrl(channel.url)
    if (!sourceUrl) return []
    const seen = new Set<string>()
    const content = channel.items.filter(item => {
      const url = safeExternalUrl(item.url)
      if (!url || !item.title?.trim() || seen.has(url)) return false
      seen.add(url)
      return true
    })
    return [{
      id: `public:${channel.id}`, label: channel.label, icon: CHANNELS[channel.id]?.icon || channel.icon,
      kind: channel.kind, content, ads: [], sourceUrl,
      status: content.length ? 'ready' : 'empty',
      description: channel.description, evidence: 'research',
      checkedAt: snapshot?.observed_at,
    }]
  })
  return [...contentChannels, ...paidChannels]
}

function subjectChannels(run: Run, subject: Subject | undefined, source?: string, listedChannels: string[] = []): MapChannel[] {
  const sides = new Map<string, Side>()
  if (subject) {
    // Research may contain additional platform Side objects as well as other_ads.
    for (const [key, value] of Object.entries(subject)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && 'ads' in value && Array.isArray(value.ads)) {
        sides.set(key.toLowerCase(), value as Side)
      }
    }
    for (const ad of subject.other_ads || []) {
      const id = ad.platform.trim().toLowerCase()
      if (!id) continue
      const side = sides.get(id) || { platform: id, status: 'ok', ads: [] }
      if (!side.ads.some(existing => existing.id === ad.id)) sides.set(id, { ...side, ads: [...side.ads, ad] })
    }
    for (const check of subject.ad_checks || []) {
      const id = check.platform.trim().toLowerCase()
      if (id && !sides.has(id)) sides.set(id, { platform: id, status: check.status, source_url: check.url, ads: [] })
    }
  }
  return [...new Set(['meta', 'google', ...sides.keys(), ...listedChannels])].map(id => {
    if (sides.has(id) || id === 'meta' || id === 'google') {
      const channel = researchChannel(run, id, sides.get(id), source)
      const check = source === 'fixture' ? undefined : subject?.ad_checks?.find(check => check.platform.trim().toLowerCase() === id)
      return { ...channel, sourceUrl: channel.sourceUrl || safeExternalUrl(check?.url), checkedAt: check?.checked_at, checkNote: check?.note }
    }
    const channel = channelAppearance(id)
    return {
      id,
      label: channel.label,
      icon: channel.icon,
      ads: [],
      status: 'unresearched',
      description: 'Listed as a marketing channel in this map. Paid ad activity has not been verified and no ads have been collected.',
      evidence: 'listed',
    }
  })
}
