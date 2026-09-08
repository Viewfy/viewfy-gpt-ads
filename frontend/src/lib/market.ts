export type Lane = { id: string; label: string; color: string; note: string }
export type Channel = { label: string; color: string; ink: string; icon: string }
export type Comp = {
  id: string
  name: string
  domain: string
  lane: string
  price: string
  tag: string
  vs: string
  channels: string[]
  hooks: string[]
}
export type Venue = { id: string; label: string; color: string; icon: string; standing: string; filed: number }
export type Thread = { venue: string; title: string; author: string; age: string; snippet: string; score: number; status: string; intent: string }
export type Prompt = {
  id: string
  text: string
  intent: string
  results: { engine: string; named: boolean; brands: string[]; excerpt: string }[]
}
export type Insight = { kind: 'act' | 'gap' | 'risk' | 'win'; score: number; title: string; why: string; go: string }

export const LANES: Lane[] = [
  { id: 'desk', label: 'AI receptionist', color: '#7eb8e8', note: 'Closest job. Answers the desk phone. Generic, not insurance.' },
  { id: 'voice', label: 'Voice AI', color: '#b39dfa', note: 'A model on a number. You still wire the agency book.' },
  { id: 'answering', label: 'Answering service', color: '#9ad0c2', note: 'Humans on a script. The vendor the owner already tried.' },
]

export const CHANNELS: Record<string, Channel> = {
  meta: { label: 'Meta ads', color: '#3d7bff', ink: '#ffffff', icon: 'meta' },
  google: { label: 'Google ads', color: '#5bc27a', ink: '#0c0b0a', icon: 'google' },
  linkedin: { label: 'LinkedIn', color: '#4c9be8', ink: '#0c0b0a', icon: 'linkedin' },
  x: { label: 'X', color: '#e7e5e4', ink: '#0c0b0a', icon: 'x' },
  youtube: { label: 'YouTube', color: '#ff5252', ink: '#ffffff', icon: 'play' },
  blog: { label: 'Blog / SEO', color: '#c9b58a', ink: '#0c0b0a', icon: 'pen' },
  reddit: { label: 'Reddit', color: '#ff6a3d', ink: '#0c0b0a', icon: 'reddit' },
}

export const SECTIONS = [
  { id: 'buyers', label: 'Buyers asking', short: 'Buyers', color: '#5eead4', icon: 'bubble', side: 'right' as const, note: 'Rooms where an agency owner is mid-missed-call. Click a venue.' },
  { id: 'answers', label: 'AI answers', short: 'AI answers', color: '#f0abfc', icon: 'sparkle', side: 'right' as const, note: 'Who ChatGPT, Claude, and Perplexity name for the buying questions.' },
  { id: 'you', label: 'Your channels', short: 'You', color: '#e8c36a', icon: 'flag', side: 'right' as const, note: 'Where SUPERAGENT already shows up. Dashed means a gap.' },
  { id: 'competitors', label: 'Competitors', short: 'Competitors', color: '#7eb8e8', icon: 'target', side: 'left' as const, note: 'Who sells into the same inbound-phone job, grouped by lane.' },
]

export const COMPETITORS: Comp[] = [
  {
    id: 'smith',
    name: 'Smith.ai',
    domain: 'smith.ai',
    lane: 'desk',
    price: 'from $140/mo',
    tag: 'AI + human receptionists for every inbound call',
    vs: 'Closest desk-phone job. Sells every vertical. Does not keep the insurance book on the owner.',
    channels: ['meta', 'google', 'linkedin', 'youtube', 'blog'],
    hooks: ['Never miss another call', 'AI answers, humans take over', 'Receptionists for growing teams'],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    domain: 'callruby.com',
    lane: 'desk',
    price: 'from $289/mo',
    tag: 'Live US receptionists who sound like your front desk',
    vs: 'Human-only. The vendor an agency already tried before looking at AI.',
    channels: ['meta', 'google', 'linkedin', 'blog'],
    hooks: ['A real person, every time', 'Your brand on the first ring', 'Stop sending callers to voicemail'],
  },
  {
    id: 'goodcall',
    name: 'Goodcall',
    domain: 'goodcall.com',
    lane: 'desk',
    price: 'from $79/mo',
    tag: 'AI phone assistant that books the appointment',
    vs: 'Same “answer and book” motion. Horizontal SMB, not a 1-to-10 producer shop.',
    channels: ['meta', 'google', 'linkedin', 'x'],
    hooks: ['Your AI receptionist is ready', 'Book while you are with a client', 'Missed calls become appointments'],
  },
  {
    id: 'frontdesk',
    name: 'My AI Front Desk',
    domain: 'myaifrontdesk.com',
    lane: 'desk',
    price: 'from $49/mo',
    tag: '24/7 AI front desk for local businesses',
    vs: 'Home services and clinics first. Insurance book-of-business is not the pitch.',
    channels: ['meta', 'google', 'youtube'],
    hooks: ['Answer every call after hours', 'Trained on your FAQs', 'No more missed leads'],
  },
  {
    id: 'rosie',
    name: 'Rosie',
    domain: 'heyrosie.com',
    lane: 'desk',
    price: 'from $99/mo',
    tag: 'AI answering for home-service phones',
    vs: 'Plumbers and HVAC. Different buyer, same missed-call fear.',
    channels: ['meta', 'google', 'x'],
    hooks: ['Rosie picks up when you cannot', 'Built for trades', 'Every missed call costs a job'],
  },
  {
    id: 'retell',
    name: 'Retell',
    domain: 'retellai.com',
    lane: 'voice',
    price: 'usage',
    tag: 'Voice agents you build and deploy on any number',
    vs: 'A platform. The agency still has to wire the book, the hours, and the offer.',
    channels: ['google', 'linkedin', 'x', 'youtube'],
    hooks: ['Human-sounding voice agents', 'Ship a phone agent this week', 'Latency under a second'],
  },
  {
    id: 'synthflow',
    name: 'Synthflow',
    domain: 'synthflow.ai',
    lane: 'voice',
    price: 'usage',
    tag: 'No-code voice AI for inbound and outbound',
    vs: 'Builder tool. Not a receptionist an owner can put on the desk today.',
    channels: ['google', 'linkedin', 'x'],
    hooks: ['No-code voice agents', 'Inbound, outbound, transfer', 'Go live without engineers'],
  },
  {
    id: 'bland',
    name: 'Bland',
    domain: 'bland.ai',
    lane: 'voice',
    price: 'usage',
    tag: 'The most human AI phone calls',
    vs: 'Outbound-heavy platform. Opposite motion from covering the inbound book.',
    channels: ['linkedin', 'x', 'youtube'],
    hooks: ['AI that people talk to', 'Scale phone calls', 'Sound like a person'],
  },
  {
    id: 'answerconnect',
    name: 'AnswerConnect',
    domain: 'answerconnect.com',
    lane: 'answering',
    price: 'custom',
    tag: '24/7 live answering for professional offices',
    vs: 'Scripted humans. The overflow vendor agencies already pay.',
    channels: ['meta', 'google', 'linkedin'],
    hooks: ['Always a live voice', 'Your calls, our front desk', 'After-hours without hiring'],
  },
  {
    id: 'patlive',
    name: 'PATLive',
    domain: 'patlive.com',
    lane: 'answering',
    price: 'from $99/mo',
    tag: 'US-based answering for small businesses',
    vs: 'Same overflow job. No insurance book, no AI on the desk phone.',
    channels: ['meta', 'google'],
    hooks: ['US-based receptionists', 'Overflow and after hours', 'Sound like you hired someone'],
  },
]

export const VENUES: Venue[] = [
  { id: 'ia', label: 'r/InsuranceAgent', color: '#ff6a3d', icon: 'reddit', standing: 'good', filed: 4 },
  { id: 'bigi', label: 'Big I / IA groups', color: '#7eb8e8', icon: 'bubble', standing: 'warming', filed: 3 },
  { id: 'maps', label: 'Google reviews', color: '#5bc27a', icon: 'google', standing: 'good', filed: 6 },
  { id: 'hire', label: 'CSR hiring posts', color: '#e8c36a', icon: 'flag', standing: 'good', filed: 2 },
]

export const THREADS: Thread[] = [
  { venue: 'ia', title: 'Anyone using an AI receptionist that does not sound drunk to a 68-year-old client?', author: 'u/midwest_pc', age: '3h', snippet: 'Ruby is $300. Smith wants us on a package. I just need the phone answered when I am on a house call.', score: 92, status: 'draft', intent: 'buying' },
  { venue: 'ia', title: 'Missed 4 quote calls Friday because both CSRs were on claims', author: 'u/captive_sf', age: '9h', snippet: 'Farmers shop, 3 producers. The leads already paid for themselves and then went to voicemail.', score: 88, status: 'draft', intent: 'buying' },
  { venue: 'maps', title: 'Called twice for a quote, apology, never called back', author: 'Jayne B.', age: '2d', snippet: 'Public 1★ on an independent. The owner is the buyer. The reviewer is not.', score: 84, status: 'draft', intent: 'hook' },
  { venue: 'hire', title: 'CSR / receptionist, must answer on the first ring', author: 'Damita King Agency', age: '5d', snippet: 'The job ad is the product sentence. Phone outgrew the desk.', score: 80, status: 'approved', intent: 'hiring' },
  { venue: 'bigi', title: 'Answering service reads a script and loses the book', author: 'IAOA thread', age: '1w', snippet: 'Owners already tried overflow. They want the conversation to stay in the agency.', score: 76, status: 'posted', intent: 'buying' },
]

export const ENGINES = {
  chatgpt: { label: 'ChatGPT', color: '#10a37f', ink: '#0c0b0a' },
  claude: { label: 'Claude', color: '#d4a27f', ink: '#0c0b0a' },
  perplexity: { label: 'Perplexity', color: '#20808d', ink: '#ffffff' },
}

export const PROMPTS: Prompt[] = [
  {
    id: 'q-recv',
    text: 'Best AI receptionist for a small insurance agency',
    intent: 'buying',
    results: [
      { engine: 'chatgpt', named: false, brands: ['Smith.ai', 'Ruby', 'Goodcall'], excerpt: 'For a small office, Smith.ai and Ruby are the usual starting points. Goodcall is the cheaper AI-only option.' },
      { engine: 'claude', named: false, brands: ['Smith.ai', 'AnswerConnect'], excerpt: 'Smith.ai mixes AI with live agents. Agencies that already use an answering service often stay with AnswerConnect.' },
      { engine: 'perplexity', named: true, brands: ['Smith.ai', 'SUPERAGENT', 'Ruby'], excerpt: 'Smith.ai and Ruby cover general reception. SUPERAGENT is built for US insurance agencies that want the book to stay with a person.' },
    ],
  },
  {
    id: 'q-miss',
    text: 'How do small insurance agencies stop losing leads to missed calls after hours?',
    intent: 'problem',
    results: [
      { engine: 'chatgpt', named: false, brands: ['Ruby', 'PATLive'], excerpt: 'Most agencies add an answering service after 5. Ruby and PATLive are named more than any AI product.' },
      { engine: 'claude', named: true, brands: ['SUPERAGENT', 'Smith.ai'], excerpt: 'If the lead already called the agency number, an insurance-specific agent like SUPERAGENT keeps the conversation in the book. Smith.ai is the generic alternative.' },
      { engine: 'perplexity', named: false, brands: ['Smith.ai', 'Goodcall'], excerpt: 'AI receptionists (Smith.ai, Goodcall) cover after hours. No source names a product that keeps the producer on the book.' },
    ],
  },
  {
    id: 'q-vs',
    text: 'Smith.ai vs an AI agent on the agency desk phone',
    intent: 'compare',
    results: [
      { engine: 'chatgpt', named: false, brands: ['Smith.ai'], excerpt: 'Smith.ai is an AI + human receptionist for any SMB. A desk-phone agent is a narrower setup you host on the number you already have.' },
      { engine: 'claude', named: true, brands: ['Smith.ai', 'SUPERAGENT'], excerpt: 'Smith.ai is horizontal. SUPERAGENT is the insurance-agency version: inbound only, owner keeps the book.' },
      { engine: 'perplexity', named: false, brands: ['Smith.ai', 'Ruby'], excerpt: 'Comparison pages pit Smith.ai against Ruby and generic AI receptionists. No insurance-specific card is cited.' },
    ],
  },
]

export const YOU: { id: string; gap?: boolean; sub: string }[] = [
  { id: 'blog', sub: 'getsuperagent.com · the site the engines can quote' },
  { id: 'linkedin', sub: 'founder posts · sparse' },
  { id: 'meta', gap: true, sub: 'not running · 6 competitors are' },
  { id: 'google', gap: true, sub: 'not running · 8 competitors are' },
]

export const INSIGHTS: Insight[] = [
  { kind: 'gap', score: 88, title: 'None of these competitors run ChatGPT ads', why: 'Smith, Ruby, Goodcall, and Retell spend on Meta and Google. The ChatGPT card is still empty. That is the first campaign.', go: 's:you' },
  { kind: 'act', score: 84, title: 'The buyer is already on a 1★ review, not in a B2B database', why: 'Maps reviews and CSR job ads are the live rooms. Outbound meeting bots are the wrong half of the map.', go: 'v:maps' },
  { kind: 'gap', score: 80, title: 'Smith and Ruby sell a receptionist. Nobody sells the book.', why: 'Their ads say never miss a call. They do not say the producer still owns the conversation. That sentence is SUPERAGENT.', go: 'smith' },
  { kind: 'win', score: 72, title: 'Claude already names SUPERAGENT on the missed-call question', why: 'One engine quotes the insurance-agency claim. ChatGPT and Perplexity still name Smith and Ruby. The card should say the same sentence Claude found.', go: 'q-miss' },
]

export const BRIEF_COMPETITORS = COMPETITORS.map((c) => ({
  id: c.id,
  branch: 'competitors' as const,
  text: c.name,
  source_url: `https://${c.domain}`,
  provenance: 'confirmed' as const,
  domain: c.domain,
}))
