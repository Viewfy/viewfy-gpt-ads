/* Mock data for the "<company> demo" competitor map.
 * Everything here is static. Sources are named per channel so the wiring
 * (Meta Ad Library API, Google Ads Transparency, Bright Data for X /
 * LinkedIn / Reddit / YouTube, Product Hunt API) can replace it 1:1. */
window.DEMO = (() => {
  const brain = {
    brand: {
      name: 'Viewfy',
      domain: 'viewfy.ai',
      one_liner: 'He gets you users while you ship.',
      category: 'AI growth agent for founders',
    },
    audience: {
      icp: 'Solo and small-team founders who want users from Reddit and AI answers without running ads.',
      jobs: ['find buyers mid-question', 'get named by ChatGPT', 'ship a blog without writing it'],
    },
    voice: {
      tone: 'direct, lowercase, a founder writing Slack at 7am',
      banned: ['delve', 'leverage', 'unlock', 'seamless', 'game-changing', 'effortless'],
    },
    prices: 'Trial $0 · part time $49/mo · full time $199/mo',
    built: '2026-09-02',
  }

  const lanes = [
    { id: 'reply', label: 'Community reply', color: '#7eb8e8', note: 'Closest job. Monitor, score, draft, you post.' },
    { id: 'copilot', label: 'Chrome copilots', color: '#6ee7b7', note: 'Same surface as the Scout extension. Nobody finds threads.' },
    { id: 'linkedin', label: 'LinkedIn comment', color: '#b39dfa', note: 'Crowded surface, empty job.' },
    { id: 'sdr', label: 'AI SDR', color: '#f07167', note: 'The reputation to avoid. Outbound, annual, sales-led.' },
    { id: 'geo', label: 'GEO monitors', color: '#f5a3c7', note: 'Monitoring as the whole product. Converging down-market.' },
    { id: 'blog', label: 'Blog bots', color: '#e8b84a', note: 'Volume at the $49 price point.' },
    { id: 'ads', label: 'Managed ads', color: '#9a9288', note: 'Stage 4 only. Never the entry point.' },
  ]

  const channels = {
    x: { label: 'X', color: '#e7e5e4', ink: '#0c0b0a', glyph: 'X', source: 'Bright Data · X posts' },
    linkedin: { label: 'LinkedIn', color: '#4c9be8', ink: '#0c0b0a', glyph: 'in', source: 'Bright Data · LinkedIn company posts' },
    founders: { label: 'Founders', color: '#e8c36a', ink: '#0c0b0a', glyph: 'F', source: 'Bright Data · people profiles' },
    meta: { label: 'Meta ads', color: '#3d7bff', ink: '#ffffff', glyph: 'M', source: 'Meta Ad Library API' },
    google: { label: 'Google ads', color: '#5bc27a', ink: '#0c0b0a', glyph: 'G', source: 'Google Ads Transparency Center' },
    reddit: { label: 'Reddit', color: '#ff6a3d', ink: '#0c0b0a', glyph: 'R', source: 'Bright Data · Reddit' },
    ph: { label: 'Product Hunt', color: '#ff8a70', ink: '#0c0b0a', glyph: 'P', source: 'Product Hunt API' },
    youtube: { label: 'YouTube', color: '#ff5252', ink: '#ffffff', glyph: '▶', source: 'Bright Data · YouTube' },
    blog: { label: 'Blog / SEO', color: '#c9b58a', ink: '#0c0b0a', glyph: 'B', source: 'Sitemap crawl + Ahrefs' },
    newsletter: { label: 'Newsletter', color: '#d9a5ff', ink: '#0c0b0a', glyph: 'N', source: 'Inbox seat' },
    affiliates: { label: 'Affiliates', color: '#9ad0c2', ink: '#0c0b0a', glyph: 'A', source: 'Affiliate page crawl' },
    dev: { label: 'DEV', color: '#e7e5e4', ink: '#0c0b0a', glyph: 'DEV', source: 'DEV API' },
    threads: { label: 'Threads', color: '#e7e5e4', ink: '#0c0b0a', glyph: '@', source: 'Bright Data · Threads' },
  }

  // size 1..5 drives every mocked count. Hooks and proofs are the copy the
  // templates below are built from, so each competitor's creatives read
  // like that competitor.
  const competitors = [
    {
      id: 'okara', name: 'Okara', domain: 'okara.ai', lane: 'reply', size: 3,
      signal: { google: { display: 'okara.ai/vs-viewfy', keywords: ['viewfy alternative', 'viewfy pricing'], n: 3, first: '2026-08-19' } },
      price: 'from $99/mo', tag: 'Your AI CMO that finds buyers on Reddit daily',
      vs: 'Closest job. Copy-paste, not paste-into-the-box. No Chrome surface. Bundled into a full CMO.',
      colors: ['#1f1b4d', '#6c5ce7'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@okara_ai', mock: true }],
      hooks: ['Your buyers are asking on Reddit right now. Who is answering?', 'Stop paying $8k/mo for a CMO who posts once a week.', '34 threads a day where someone needs what you built.'],
      proofs: ['On-brand drafts every morning', 'You approve before anything posts', 'Search + engage from one inbox'],
      subs: ['r/SaaS', 'r/startups', 'r/marketing'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'reddit', 'ph', 'blog'],
    },
    {
      id: 'mediafast', name: 'MediaFast', domain: 'mediafa.st', lane: 'reply', size: 3,
      signal: { x: { hook: 0, views: 12 } },
      price: '$32–49/mo · $131 lifetime', tag: 'Get recommended by AI tools through Reddit',
      vs: 'Closest packaging of Reddit + GEO. Sells a calendar and "get cited", not a live buyer-thread inbox. No artifacts.',
      colors: ['#7a2e0e', '#ff6a3d'],
      founders: [{ name: 'Arthur Yuzbashev', role: 'Solo founder', handle: '@mediafast', mock: true }],
      hooks: ['Invisible on Google. Banned on Reddit. No traction. Pick zero.', '40% of ChatGPT citations come from Reddit. Are you there?', 'Your daily Reddit roadmap. 10 minutes a day.'],
      proofs: ['4,200+ subreddits ranked for you', 'Ban-risk score on every draft', 'One payment, lifetime'],
      subs: ['r/SaaS', 'r/indiehackers', 'r/SideProject'],
      channels: ['x', 'founders', 'meta', 'google', 'reddit', 'ph', 'blog', 'newsletter', 'affiliates'],
    },
    {
      id: 'replyguy', name: 'ReplyGuy', domain: 'replyguy.com', lane: 'reply', size: 4,
      price: '$10–199/mo', tag: 'Mention your product on Reddit and X when people ask',
      vs: 'Category warning. Auto-reply and purchased accounts got it banned. The reason Viewfy never autoposts.',
      colors: ['#0f3d2e', '#2ecc71'],
      founders: [{ name: 'Operator (post-sale)', role: 'Owner', handle: '@replyguy', mock: true }],
      hooks: ['Someone just asked for a tool like yours. Reply in 60 seconds.', 'Find the conversations. Post the reply. Get the customer.', 'Keyword alerts are free. Replies that convert are not.'],
      proofs: ['Intent scoring on every thread', 'Reddit + X in one feed', 'Auto-reply option'],
      subs: ['r/Entrepreneur', 'r/SaaS', 'r/smallbusiness'],
      channels: ['x', 'linkedin', 'meta', 'google', 'reddit', 'ph', 'youtube', 'blog', 'affiliates'],
    },
    {
      id: 'redreach', name: 'Redreach', domain: 'redreach.ai', lane: 'reply', size: 2,
      price: 'from $19/mo', tag: 'Reddit lead generation on autopilot',
      vs: 'Inbound is job-adjacent. The outbound DM extension is the opposite of Scout.',
      colors: ['#4a1010', '#ff4500'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@redreach_ai', mock: true }],
      hooks: ["Your competitors' unhappy users are on Reddit. Meet them.", 'Reddit leads for $19. Cheaper than one ad click.', 'DM the people who already want you.'],
      proofs: ['Competitor discovery', 'Outbound Chrome extension', 'AI-guided replies'],
      subs: ['r/SaaS', 'r/marketing', 'r/Entrepreneur'],
      channels: ['x', 'meta', 'google', 'reddit', 'ph', 'blog', 'youtube'],
    },
    {
      id: 'replymer', name: 'Replymer', domain: 'replymer.com', lane: 'reply', size: 2,
      price: 'subscription · ~45 customers', tag: 'Reddit marketing done for you by humans',
      vs: 'Agency-shaped. Human writers, capped volume. No founder-in-the-box surface.',
      colors: ['#1a2a3a', '#7eb8e8'],
      founders: [{ name: 'ReplyGuy original founder', role: 'Founder', handle: '@replymer', mock: true }],
      hooks: ['AI replies get banned. Ours are written by people.', '$8.3k MRR. Every comment hand-written.', 'You ship. We handle Reddit.'],
      proofs: ['Human writers, capped volume', 'Built after selling ReplyGuy'],
      subs: ['r/SaaS', 'r/startups'],
      channels: ['x', 'founders', 'linkedin', 'reddit', 'blog'],
    },
    {
      id: 'leadmore', name: 'Leadmore', domain: 'leadmore.ai', lane: 'reply', size: 2,
      price: '$3–4/comment · $7/post', tag: 'Pay per live Reddit comment',
      vs: 'Autopost from managed aged accounts. Do not rhyme with this.',
      colors: ['#2b1d0e', '#e8b84a'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@leadmore', mock: true }],
      hooks: ['Aged accounts. High karma. Your product mentioned by tomorrow.', '$3 a comment. No subscription.', 'We post. You get traffic.'],
      proofs: ['Managed aged accounts', 'Pay per live comment'],
      subs: ['r/SaaS', 'r/marketing'],
      channels: ['x', 'meta', 'google', 'reddit', 'affiliates', 'youtube'],
    },
    {
      id: 'replyagent', name: 'ReplyAgent', domain: 'replyagent.ai', lane: 'reply', size: 3,
      price: '$79/mo + per comment', tag: 'Reddit marketing agent that finds, writes, and posts',
      vs: 'Same avoid lane as Leadmore. Managed high-karma accounts post for you.',
      colors: ['#0e2b2b', '#2dd4bf'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@replyagent', mock: true }],
      hooks: ['Fully automated Reddit marketing. Really.', 'High-karma accounts post for you. Wake up to traffic.', 'Reddit is the new SEO. Be there without being there.'],
      proofs: ['Managed high-karma accounts', 'Find + draft + post'],
      subs: ['r/SaaS', 'r/Entrepreneur', 'r/indiehackers'],
      channels: ['x', 'linkedin', 'meta', 'google', 'reddit', 'ph', 'youtube', 'blog'],
    },
    {
      id: 'karmafarm', name: 'Karma Farm', domain: 'webmatrices.com', lane: 'copilot', size: 1,
      price: '$9.99 once · BYO key', tag: 'Reddit reply assistant for founders',
      vs: 'Closest Reddit surface. Drafts into the composer. Generic LLM, no product brain. 11 users.',
      colors: ['#2a1d0a', '#f0a13a'],
      founders: [{ name: 'Webmatrices', role: 'Indie dev', handle: '@webmatrices', mock: true }],
      hooks: ['Drafts in the Reddit composer. $9.99 once.', 'Karma threshold tracker so you post where you can.', 'Bring your own key. Pay nothing monthly.'],
      proofs: ['Old + new Reddit', '11 users (Jun 2026)'],
      subs: ['r/SideProject', 'r/chrome_extensions'],
      channels: ['x', 'reddit', 'ph', 'blog'],
    },
    {
      id: 'replix', name: 'Replix', domain: 'replix.social', lane: 'copilot', size: 2,
      price: 'Free', tag: 'AI reply button for Reddit, X, Instagram, Quora',
      vs: 'Free in-box button. Three suggestions in a generic Redditor voice.',
      colors: ['#1e1b3a', '#8b5cf6'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@replix', mock: true }],
      hooks: ['3 replies. One click. Sounds like a Redditor.', 'Free forever AI Reply button.'],
      proofs: ['Reddit, X, Instagram, Quora'],
      subs: ['r/chrome_extensions'],
      channels: ['x', 'ph', 'youtube', 'blog', 'google'],
    },
    {
      id: 'replya', name: 'Replya', domain: 'chrome.google.com', lane: 'linkedin', size: 1,
      price: 'Free', tag: 'R button inside the LinkedIn comment box',
      vs: 'Closest LinkedIn UI. Persona is your job title, not a product brain.',
      colors: ['#0a2a4a', '#4c9be8'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@replya', mock: true }],
      hooks: ['5 comment suggestions before you finish reading the post.', 'Comment like a leader in your industry.'],
      proofs: ['Job title + company as persona'],
      subs: [],
      channels: ['linkedin', 'ph', 'blog', 'youtube'],
    },
    {
      id: 'engageai', name: 'Engage AI', domain: 'engage-ai.co', lane: 'linkedin', size: 4,
      signal: { meta: { since: '2026-06-01', hook: 1, reach: 1.8 } },
      price: 'Free · $12.90–80/mo', tag: 'AI comments that turn LinkedIn into a sales channel',
      vs: 'Most established LinkedIn comment extension. Prospect monitoring is sales warming, not a buyer conversation.',
      colors: ['#0b2545', '#13a4ec'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@engageai', mock: true }],
      hooks: ["Comment on your prospects' posts before your competitor does.", 'Unlimited free comments. Custom tones on Pro.', 'Sales visibility, 10 minutes a day.'],
      proofs: ['Prospect monitoring', 'Custom tones', 'Free unlimited tier'],
      subs: ['r/sales', 'r/linkedin'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'blog', 'newsletter', 'affiliates'],
    },
    {
      id: 'taplio', name: 'Taplio', domain: 'taplio.com', lane: 'linkedin', size: 4,
      price: 'from $39/mo', tag: 'Grow your personal brand on LinkedIn',
      vs: 'Creator suite. AI comments in your voice plus a lead CRM. Personal brand, not product voice.',
      colors: ['#1a1240', '#7c5cff'],
      founders: [{ name: 'Founder (unresolved)', role: 'GM', handle: '@taplio', mock: true }],
      hooks: ['10 posts a month is not a strategy. Try 10 a week.', 'Comment in your voice on 20 creators a day.', 'Personal brand + lead CRM in one tab.'],
      proofs: ['AI comments in your voice', 'Chrome companion', 'Scheduling + analytics'],
      subs: ['r/linkedin', 'r/marketing'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'blog', 'newsletter', 'affiliates'],
    },
    {
      id: 'extrovert', name: 'Extrovert', domain: 'goextrovert.com', lane: 'linkedin', size: 2,
      price: '$29–75 / seat', tag: 'Warm up prospects on LinkedIn with playbook comments',
      vs: 'Playbook-voiced comments + DMs on tracked prospects. AI-SDR warming. Avoid.',
      colors: ['#3a0f2a', '#f472b6'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@goextrovert', mock: true }],
      hooks: ['Cold outreach is dead. Warm comments first.', 'Your SDRs comment on 50 prospects before lunch.'],
      proofs: ['Playbook-voiced comments + DMs', 'Tracked prospects'],
      subs: ['r/sales'],
      channels: ['linkedin', 'founders', 'meta', 'google', 'youtube', 'blog'],
    },
    {
      id: 'elevenx', name: '11x (Alice)', domain: '11x.ai', lane: 'sdr', size: 5,
      price: '~$5,000/mo · annual', tag: 'Alice, the AI SDR',
      vs: 'Reputation to avoid. 75% reported 3-month churn. Relaunched as Alice 2.0 under a new CEO.',
      colors: ['#0a0a0a', '#ffffff'],
      founders: [{ name: 'New CEO (unresolved)', role: 'CEO', handle: '@11x_ai', mock: true }, { name: 'Founder (unresolved)', role: 'Founder', handle: '@11x_ai', mock: true }],
      hooks: ['Alice books meetings while your team sleeps.', 'Replace 3 SDRs with one hire that never churns.', 'AI SDR 2.0. Rebuilt from the ground up.'],
      proofs: ['Enterprise pipeline', 'Alice 2.0 relaunch', 'Series B'],
      subs: ['r/sales', 'r/SaaS'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'reddit', 'blog', 'newsletter'],
    },
    {
      id: 'artisan', name: 'Artisan (Ava)', domain: 'artisan.co', lane: 'sdr', size: 5,
      price: '$1,500–2,500/mo · annual', tag: 'Stop hiring humans. Hire Ava.',
      vs: '"Stop hiring humans" is the brand. Bundles a 300M-contact database. Thin retention disclosure.',
      colors: ['#1b0f2e', '#c084fc'],
      founders: [{ name: 'Jaspar Carmichael-Jack', role: 'CEO · co-founder', handle: '@jaspar_cj', mock: true }],
      hooks: ['Stop hiring humans.', 'Ava works 24/7 and never asks for a raise.', '300M contacts. One AI employee.'],
      proofs: ['300M-contact database', 'Multi-channel outbound', 'Billboard campaign'],
      subs: ['r/sales', 'r/SaaS', 'r/sanfrancisco'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'reddit', 'blog', 'newsletter'],
    },
    {
      id: 'aisdr', name: 'AiSDR', domain: 'aisdr.com', lane: 'sdr', size: 3,
      price: '$250–900/mo · quarterly', tag: 'AI SDR that books meetings for you',
      vs: 'Closest to self-serve in the lane. $0.75 per message stacks up.',
      colors: ['#0f2a1c', '#5fd39a'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@aisdr', mock: true }],
      hooks: ['Book 10 meetings a month for $900. No SDR salary.', '$0.75 a message. Cancel quarterly.', 'Your first SDR that reads every reply.'],
      proofs: ['Closest to self-serve in lane', 'Quarterly commitment'],
      subs: ['r/sales'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'blog', 'affiliates'],
    },
    {
      id: 'profound', name: 'Profound', domain: 'tryprofound.com', lane: 'geo', size: 5,
      signal: { meta: { since: '2026-07-15', format: 'Video', platforms: ['Instagram'], hook: 1, reach: 2.4 } },
      price: '$99 (1 engine) · $399 Growth', tag: 'Get your brand cited by AI answers',
      vs: 'Enterprise monitor moving down-market. $155M+ raised. Agents now draft the fix. Wins the GEO ask in citation runs.',
      colors: ['#0a0f2a', '#6d8cff'],
      founders: [{ name: 'James Cadwallader', role: 'CEO · co-founder', handle: '@jamescad', mock: true }, { name: 'Dylan Babbs', role: 'CTO · co-founder', handle: '@dylanbabbs', mock: true }],
      hooks: ['Your buyers ask ChatGPT. Do you know what it says about you?', '1.3B real prompts. See where you rank inside AI.', 'Monitoring was step one. Now the agents write the fix.'],
      proofs: ['$155M+ raised', 'Anthropic connector', 'FactCheck'],
      subs: ['r/SEO', 'r/marketing', 'r/bigseo'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'blog', 'newsletter', 'ph'],
    },
    {
      id: 'peec', name: 'Peec AI', domain: 'peec.ai', lane: 'geo', size: 4,
      signal: { linkedin: { type: 'Case study', boost: 4 } },
      price: '$80–95/mo', tag: 'AI search visibility for marketing teams',
      vs: 'Self-serve monitor, EU/GDPR. $10M ARR, 3,000 customers. No execution yet.',
      colors: ['#1a1a1a', '#ff9f43'],
      founders: [{ name: 'Marius Meiners', role: 'CEO · co-founder', handle: '@mariusmeiners', mock: true }, { name: 'Daniel Drabo', role: 'Co-founder', handle: '@danieldrabo', mock: true }, { name: 'Tobias Rohrbach', role: 'Co-founder', handle: '@tobirohrbach', mock: true }],
      hooks: ['3,000 teams track their AI visibility here.', 'Which prompts mention your competitors and not you?', 'GDPR-native GEO. Built in Berlin.'],
      proofs: ['$10M ARR', 'EU / GDPR', '3,000 customers'],
      subs: ['r/SEO', 'r/marketing'],
      channels: ['x', 'linkedin', 'founders', 'meta', 'google', 'youtube', 'blog', 'newsletter'],
    },
    {
      id: 'otterly', name: 'Otterly.ai', domain: 'otterly.ai', lane: 'geo', size: 2,
      price: '$29/mo', tag: 'AI search monitoring for SEOs',
      vs: 'Lightweight monitor with a GEO audit. No execution.',
      colors: ['#0f2a2e', '#38bdf8'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@otterlyai', mock: true }],
      hooks: ['Is ChatGPT recommending you? Find out for $29.', 'GEO audit in 2 minutes.', 'Track 10 prompts. See who wins them.'],
      proofs: ['Lightweight monitor', 'GEO audit'],
      subs: ['r/SEO'],
      channels: ['x', 'linkedin', 'founders', 'google', 'youtube', 'blog', 'newsletter', 'affiliates'],
    },
    {
      id: 'athenahq', name: 'AthenaHQ', domain: 'athenahq.ai', lane: 'geo', size: 3,
      price: 'quote', tag: 'AI visibility plus a citation engine',
      vs: 'Monitor + ACE citation engine. Athena agent shipped. Execution from above.',
      colors: ['#2a1a0a', '#fbbf24'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@athenahq', mock: true }],
      hooks: ['Monitor AI answers. Then fix them with ACE.', 'Your Athena agent rewrites what the models read.'],
      proofs: ['Athena AI agent shipped', 'Citation Engine (ACE)'],
      subs: ['r/SEO'],
      channels: ['x', 'linkedin', 'founders', 'google', 'blog', 'ph'],
    },
    {
      id: 'scrunch', name: 'Scrunch AI', domain: 'scrunch.ai', lane: 'geo', size: 3,
      price: '$250/mo', tag: 'AI search visibility, SOC 2',
      vs: 'Enterprise GEO with hallucination detection. Partial execution (Signals).',
      colors: ['#101828', '#a5b4fc'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@scrunchai', mock: true }],
      hooks: ['What AI says about you, with hallucination detection.', 'Enterprise GEO with a paper trail.'],
      proofs: ['SOC 2', 'Hallucination detection'],
      subs: [],
      channels: ['linkedin', 'founders', 'google', 'youtube', 'blog', 'newsletter'],
    },
    {
      id: 'seobot', name: 'SEObot', domain: 'seobotai.com', lane: 'blog', size: 4,
      signal: { founders: { cadence: 'daily', views: 20 } },
      price: '$49/mo', tag: 'Fully autonomous SEO robot',
      vs: 'Head-on collision with the blog tier and the indie-founder ICP. Owns the $49 mindshare.',
      colors: ['#0a1f0a', '#4ade80'],
      founders: [{ name: 'John Rush', role: 'Founder', handle: '@johnrushx', mock: true }],
      hooks: ['200,000 articles shipped. Zero writers.', 'SEO on autopilot for $49. Founders only.', 'Ship product. SEObot ships articles.'],
      proofs: ['200k+ articles', '4–8 articles/mo autopilot', 'Built in public'],
      subs: ['r/SaaS', 'r/SEO', 'r/indiehackers'],
      channels: ['x', 'founders', 'reddit', 'ph', 'google', 'blog', 'affiliates', 'youtube'],
    },
    {
      id: 'outrank', name: 'Outrank', domain: 'outrank.so', lane: 'blog', size: 4,
      price: '$99/mo flat', tag: '30 SEO articles a month, plus backlinks',
      vs: 'Volume plus a backlink exchange. API/CLI for coding agents. Distribution from below.',
      colors: ['#1a0a2a', '#e879f9'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@outrank', mock: true }],
      hooks: ['30 articles a month. 150 languages. $99 flat.', 'Backlinks included. Your coding agent can call the API.', 'Rank without a content team.'],
      proofs: ['Backlink exchange', 'API / CLI for coding agents', '150+ languages'],
      subs: ['r/SEO', 'r/SaaS'],
      channels: ['x', 'linkedin', 'meta', 'google', 'reddit', 'ph', 'youtube', 'blog', 'affiliates'],
    },
    {
      id: 'journalistai', name: 'Journalist AI', domain: 'tryjournalist.com', lane: 'blog', size: 3,
      price: '$19–99/mo', tag: 'AI writer that publishes to your CMS',
      vs: '25 to 250 articles a month into WordPress. Volume with no distribution.',
      colors: ['#2a2a0a', '#facc15'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@tryjournalist', mock: true }],
      hooks: ['25 to 250 articles a month straight into WordPress.', 'The cheapest content team you will ever hire.'],
      proofs: ['CMS publishing', 'Auto-scheduling'],
      subs: ['r/SEO'],
      channels: ['x', 'meta', 'google', 'youtube', 'blog', 'affiliates'],
    },
    {
      id: 'nyra', name: 'Nyra', domain: 'nyra.ai', lane: 'ads', size: 2,
      price: 'quote', tag: 'AI media buyer for Meta ads',
      vs: 'Ads-era. Matters only inside managed Meta ads.',
      colors: ['#1a1a1a', '#e5e7eb'],
      founders: [{ name: 'Founder (unresolved)', role: 'CEO', handle: '@nyra', mock: true }],
      hooks: ['Your Meta ads, run by an AI media buyer.', 'Creative testing while you sleep.'],
      proofs: ['Autonomous budget shifts'],
      subs: [],
      channels: ['linkedin', 'meta', 'google', 'founders', 'youtube'],
    },
    {
      id: 'adamigo', name: 'Adamigo', domain: 'adamigo.ai', lane: 'ads', size: 2,
      price: 'from $29/mo', tag: 'AI marketing sidekick for small business ads',
      vs: 'Ads-era. Stage 4 only.',
      colors: ['#0a2a2a', '#2dd4bf'],
      founders: [{ name: 'Founder (unresolved)', role: 'Founder', handle: '@adamigo', mock: true }],
      hooks: ['Ads for people who hate ads managers.', 'Launch a Meta campaign in 4 minutes.'],
      proofs: ['Guided campaign builder'],
      subs: ['r/smallbusiness'],
      channels: ['meta', 'google', 'linkedin', 'youtube'],
    },
  ]

  // ---- deterministic mock generation -------------------------------------
  function rng(seed) {
    let h = 2166136261
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
    return () => {
      h += 0x6d2b79f5
      let t = Math.imul(h ^ (h >>> 15), 1 | h)
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
  const between = (r, a, b) => Math.round(a + r() * (b - a))
  const fmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n))
  const date = (r, from = '2026-03-01', to = '2026-09-02') => {
    const a = Date.parse(from), b = Date.parse(to)
    return new Date(a + r() * (b - a)).toISOString().slice(0, 10)
  }
  const ago = (iso) => {
    const d = Math.max(0, Math.round((Date.parse('2026-09-03') - Date.parse(iso)) / 864e5))
    return d === 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? d + 'd ago' : d < 365 ? Math.round(d / 30) + 'mo ago' : Math.round(d / 365) + 'y ago'
  }

  const CTA = ['Sign up', 'Learn more', 'Start free trial', 'Book a demo', 'Get offer', 'Try it free']
  const PLATFORMS = [['Facebook', 'Instagram'], ['Facebook', 'Instagram', 'Audience Network'], ['Instagram'], ['Facebook', 'Instagram', 'Messenger', 'Audience Network']]
  const FORMATS = ['Image', 'Image', 'Video', 'Carousel']

  function gen(c) {
    const r = rng(c.id)
    const s = c.size
    const out = {}
    const hook = () => pick(r, c.hooks)
    const proof = () => pick(r, c.proofs)
    const name = c.name.replace(/\s*\(.*\)/, '')

    for (const ch of c.channels) {
      const rr = rng(c.id + ':' + ch)
      if (ch === 'meta') {
        const n = between(rr, 2 + s, 3 + s * 4)
        const items = Array.from({ length: n }, (_, i) => {
          const started = date(rr)
          let format = pick(rr, FORMATS), platforms = pick(rr, PLATFORMS), h = pick(rr, c.hooks), reach = between(rr, 800 * s, 40000 * s)
          const sg = c.signal?.meta
          const hit = sg && started >= sg.since && rr() < 0.8
          if (hit) { if (sg.format) format = sg.format; if (sg.platforms) platforms = sg.platforms; if (sg.hook != null) h = c.hooks[sg.hook]; reach = Math.round(reach * sg.reach) }
          return {
            id: String(between(rr, 1e9, 9e9)) + String(i),
            status: hit ? 'Active' : rr() < 0.6 ? 'Active' : 'Inactive',
            started, since: ago(started),
            platforms, format,
            headline: pick(rr, c.proofs),
            primary: `${h}\n\n${name}: ${c.tag.toLowerCase()}. ${pick(rr, c.proofs)}. ${pick(rr, ['Try it this week.', 'No card needed.', 'Cancel anytime.', 'Book 15 minutes.', 'See it on your own site.'])}`,
            description: pick(rr, [c.price, 'Free trial', name + ' · ' + c.domain, pick(rr, c.proofs)]),
            cta: pick(rr, CTA),
            url: c.domain + pick(rr, ['/', '/pricing', '/?utm_source=fb', '/start', '/demo']),
            variants: between(rr, 1, 4),
            reach_eu: fmt(reach), reach_n: reach, signal: !!hit,
            bg: c.colors, hook: h,
          }
        })
        const active = items.filter((i) => i.status === 'Active').length
        out.meta = { stat: `${active} active · ${items.length} total`, items, sort: 'started' }
      } else if (ch === 'google') {
        const n = between(rr, 1 + s, 2 + s * 2)
        const items = Array.from({ length: n }, (_, i) => c.signal?.google && i < c.signal.google.n ? {
          headlines: [name + ' vs Viewfy: ' + pick(rr, c.proofs), 'Approve-first is table stakes. Get the whole CMO', c.price],
          descriptions: ['Compare ' + name + ' and Viewfy side by side. ' + c.tag + '.', 'Reddit engagement plus a full marketing plan. Book a demo.'],
          display: c.signal.google.display, format: 'Responsive search', first: c.signal.google.first, last: '2026-09-02', regions: ['US', 'UK', 'CA'], keywords: c.signal.google.keywords, signal: true,
        } : ({
          headlines: [name + ': ' + pick(rr, c.proofs), pick(rr, c.hooks).replace(/\.$/, ''), pick(rr, [c.price, 'Start free', 'Founders only', 'Trusted by ' + fmt(between(rr, 200 * s, 4000 * s)) + ' teams'])],
          descriptions: [c.tag + '. ' + pick(rr, c.proofs) + '.', pick(rr, c.hooks) + ' ' + pick(rr, ['Try it free today.', 'See pricing.', 'Book a demo.'])],
          display: c.domain + pick(rr, ['/', '/pricing', '/vs-' + pick(rr, ['viewfy', 'replyguy', 'okara', 'profound', 'seobot']), '/free-trial']),
          format: pick(rr, ['Text', 'Text', 'Responsive search', 'Performance Max']),
          first: date(rr, '2025-09-01'), last: date(rr, '2026-08-01'),
          regions: pick(rr, [['US'], ['US', 'UK', 'CA'], ['EU'], ['US', 'IN', 'AU']]),
          keywords: pick(rr, [['reddit marketing tool', 'ai reply bot'], ['ai sdr', 'outbound ai'], ['ai seo tool', 'chatgpt visibility'], ['linkedin comment ai'], ['blog automation', 'seo articles ai']]),
        }))
        out.google = { stat: `${items.length} ads · ${items[0].regions.join(' ')}`, items }
      } else if (ch === 'x' || ch === 'threads') {
        const followers = between(rr, 300 * s * s, 1800 * s * s)
        const n = between(rr, 4, 8)
        const items = Array.from({ length: n }, () => {
          const d = date(rr, '2026-07-01')
          const kind = pick(rr, ['ship', 'hook', 'proof', 'thread', 'dunk'])
          const text = kind === 'ship' ? `shipped: ${pick(rr, c.proofs).toLowerCase()}. ${pick(rr, ['live for everyone now.', 'rolling out today.', 'took 3 weeks. worth it.'])}`
            : kind === 'hook' ? pick(rr, c.hooks)
            : kind === 'proof' ? `${pick(rr, ['this week', 'last 30 days', 'since launch'])}: ${fmt(between(rr, 40 * s, 900 * s))} ${pick(rr, ['signups', 'threads found', 'articles published', 'meetings booked', 'prompts tracked'])}. ${pick(rr, ['no ads.', 'all organic.', 'one founder.', 'zero sales calls.'])}`
            : kind === 'thread' ? `how we got to $${fmt(between(rr, 2000 * s, 20000 * s))} MRR with ${name} (thread) 🧵`
            : `${pick(rr, ['hot take:', 'unpopular opinion:', 'ok real talk.'])} ${pick(rr, ['most "AI marketing" is a cron job with a logo.', 'if your reply tool autoposts you will get banned. ask me how i know.', 'GEO is SEO with a new invoice.', 'nobody wants another dashboard.'])}`
          let views = between(rr, 400 * s, 60000 * s), signal = false
          if (c.signal?.x && kind === 'hook' && ch === 'x') { views = Math.round(views * c.signal.x.views); signal = true }
          return { text: signal ? c.hooks[c.signal.x.hook] : text, date: d, ago: ago(d), likes: between(rr, 3 * s, 120 * s * s) * (signal ? 6 : 1), reposts: between(rr, 0, 20 * s), replies: between(rr, 0, 30 * s), views: fmt(views), views_n: views, kind, signal, handle: '@' + c.domain.split('.')[0] }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out[ch] = { stat: `${fmt(followers)} followers · ${between(rr, 2, 6 * s)} posts/wk`, followers, items }
      } else if (ch === 'linkedin' || ch === 'dev') {
        const followers = between(rr, 200 * s * s, 2500 * s * s)
        const n = between(rr, 3, 6) + (c.signal?.linkedin ? 2 : 0)
        const items = Array.from({ length: n }, (_, i) => {
          const d = date(rr, '2026-06-01')
          const type = c.signal?.linkedin && i % 2 ? c.signal.linkedin.type : pick(rr, ['Company post', 'Company post', 'Founder repost', 'Event', 'Case study'])
          const text = type === 'Case study' ? `How ${pick(rr, ['a 4-person SaaS', 'a Series A fintech', 'a solo founder', 'an agency with 12 clients'])} ${pick(rr, ['booked 31 meetings', 'ranked for 140 keywords', 'got cited by ChatGPT', 'doubled trial signups'])} with ${name}.\n\n${pick(rr, c.proofs)}. ${pick(rr, c.hooks)}`
            : type === 'Event' ? `Join us ${pick(rr, ['Thursday', 'next week', 'at SaaStr'])}: "${pick(rr, c.hooks).replace(/\.$/, '')}" · live with the founders. Link in comments.`
            : `${pick(rr, c.hooks)}\n\n${pick(rr, ['Here is what changed this month:', 'Three things we learned shipping this:', 'Why we built it:'])}\n• ${pick(rr, c.proofs)}\n• ${pick(rr, c.proofs)}\n• ${pick(rr, ['You approve every step.', 'No new dashboard.', 'Works with what you already use.'])}`
          const signal = !!(c.signal?.linkedin && type === c.signal.linkedin.type)
          return { type, text, date: d, ago: ago(d), reactions: between(rr, 5 * s, 80 * s * s) * (signal ? c.signal.linkedin.boost : 1), comments: between(rr, 0, 12 * s), reposts: between(rr, 0, 8 * s), signal }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out[ch] = { stat: `${fmt(followers)} followers · ${n} posts / 30d`, followers, items }
      } else if (ch === 'founders') {
        const items = c.founders.map((f, i) => {
          const fr = rng(c.id + ':f' + i)
          const d = date(fr, '2026-08-01')
          const followers = between(fr, 400 * s * s, 6000 * s * s)
          return {
            ...f, followers, followers_fmt: fmt(followers), platform: pick(fr, ['X', 'LinkedIn', 'X + LinkedIn']),
            cadence: c.signal?.founders?.cadence || pick(fr, ['daily', '3–4/wk', 'weekly', 'sporadic']),
            last: { date: d, ago: ago(d), text: pick(fr, [`building ${name} in public. ${pick(fr, c.hooks).toLowerCase()}`, `${pick(fr, c.proofs)}. ${pick(fr, ['shipped today.', 'more soon.', 'took longer than it should have.'])}`, `${pick(fr, ['AMA:', 'lesson:', 'stat:'])} ${pick(fr, c.hooks)}`]), likes: between(fr, 5 * s, 200 * s * s) },
            topics: pick(fr, [['build in public', 'MRR', 'hiring'], ['GEO', 'SEO', 'AI search'], ['sales', 'outbound', 'AI agents'], ['Reddit', 'community', 'founders']]),
          }
        })
        out.founders = { stat: `${items.length} ${items.length === 1 ? 'person' : 'people'} · ${items[0].cadence}`, items }
      } else if (ch === 'reddit') {
        const n = between(rr, 3, 7)
        const items = Array.from({ length: n }, () => {
          const d = date(rr, '2026-05-01')
          const sub = pick(rr, c.subs.length ? c.subs : ['r/SaaS'])
          const promo = rr() < 0.55
          const text = promo ? `${pick(rr, ['Full disclosure, I built', 'Biased, but I work on', 'Shameless plug:'])} ${name}. ${pick(rr, c.hooks)} ${pick(rr, ['Happy to answer questions.', 'Free tier if you want to poke at it.', 'DM me if you want a code.'])}`
            : `${pick(rr, ['What worked for us:', 'Honest answer:', 'Depends on stage.'])} ${pick(rr, c.proofs).toLowerCase()} beats ${pick(rr, ['cold email', 'paid ads', 'another dashboard', 'posting into the void'])} for a ${pick(rr, ['solo founder', 'pre-seed team', 'B2B SaaS'])}. ${pick(rr, ['We use ' + name + ' for that part.', 'Tools: ' + name + ' + Notion.', name + ' if you want it done for you.'])}`
          return { sub, thread: pick(rr, ['Best way to get first 100 users?', 'Is Reddit marketing worth it in 2026?', 'How are you tracking ChatGPT mentions?', 'Tools to automate SEO content?', 'AI SDR: anyone actually seeing ROI?', 'Which subreddits allow self-promo?']), text, date: d, ago: ago(d), score: between(rr, promo ? -3 : 2, promo ? 12 : 60 * s), promo, account: 'u/' + pick(rr, [c.domain.split('.')[0], 'founder_' + c.id, c.id + '_team', 'anon_' + between(rr, 100, 999)]) }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out.reddit = { stat: `${items.length} mentions · ${items.filter((i) => i.promo).length} self-promo`, items }
      } else if (ch === 'ph') {
        const launches = between(rr, 1, 3)
        const items = Array.from({ length: launches }, (_, i) => {
          const d = date(rr, '2025-01-01', '2026-08-15')
          return { name: i === 0 ? name : name + ' ' + pick(rr, ['2.0', 'for Chrome', 'API', 'Agent']), tagline: pick(rr, c.hooks).replace(/\.$/, ''), date: d, ago: ago(d), upvotes: between(rr, 60 * s, 400 * s), comments: between(rr, 10, 60 * s), rank: pick(rr, ['#1 of the day', '#2 of the day', '#4 of the day', '#3 of the week', 'top 10']), maker: c.founders[0].name }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out.ph = { stat: `${launches} launch${launches > 1 ? 'es' : ''} · best ${items.map((i) => i.rank).sort()[0]}`, items }
      } else if (ch === 'youtube') {
        const subs = between(rr, 80 * s * s, 900 * s * s)
        const n = between(rr, 3, 6)
        const items = Array.from({ length: n }, () => {
          const d = date(rr, '2026-01-01')
          const kind = pick(rr, ['Demo', 'Tutorial', 'Founder', 'Ad'])
          return { kind, title: kind === 'Demo' ? `${name} demo: ${pick(rr, c.proofs).toLowerCase()}` : kind === 'Tutorial' ? `How to ${pick(rr, ['get your first 100 users from Reddit', 'get cited by ChatGPT', 'book meetings with an AI SDR', 'automate your blog', 'comment on LinkedIn without sounding like a bot'])} with ${name}` : kind === 'Founder' ? `${pick(rr, ['Why we built', 'The story behind', 'What nobody tells you about'])} ${name}` : pick(rr, c.hooks).replace(/\.$/, ''), date: d, ago: ago(d), views: fmt(between(rr, 200 * s, 30000 * s * s)), duration: pick(rr, ['0:32', '1:14', '3:48', '8:21', '14:05', '0:15']), likes: between(rr, 5, 400 * s) }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out.youtube = { stat: `${fmt(subs)} subs · ${n} videos`, items }
      } else if (ch === 'blog') {
        const n = between(rr, 4, 8)
        const monthly = between(rr, 2 * s, 30 * s)
        const items = Array.from({ length: n }, () => {
          const d = date(rr, '2026-04-01')
          const kw = pick(rr, [['reddit marketing', 'reddit for saas'], ['ai sdr', 'ai sales agent'], ['generative engine optimization', 'ai search visibility'], ['ai blog writer', 'seo automation'], ['linkedin comments', 'linkedin engagement'], ['chatgpt recommendations', 'get cited by chatgpt']])
          const title = pick(rr, [`${pick(rr, ['Best', 'Top 12', 'The only'])} ${kw[0]} tools in 2026 (${pick(rr, ['ranked', 'tested', 'compared'])})`, `${name} vs ${pick(rr, ['ReplyGuy', 'Okara', 'Profound', 'SEObot', 'Taplio', 'Viewfy', '11x'])}: ${pick(rr, ['which one is right for you', 'honest comparison', 'pricing, features, verdict'])}`, `How to ${kw[1]} without ${pick(rr, ['getting banned', 'a marketing team', 'ads', 'writing anything'])}`, `${pick(rr, c.hooks).replace(/\.$/, '')}: the ${new Date(d).getFullYear()} playbook`])
          return { title, slug: '/' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60), date: d, ago: ago(d), keywords: kw, traffic: fmt(between(rr, 30 * s, 4000 * s * s)), words: between(rr, 900, 3200), ai: rr() < 0.6 }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out.blog = { stat: `${monthly}/mo · DR ${between(rr, 15 + s * 5, 30 + s * 12)}`, items }
      } else if (ch === 'newsletter') {
        const n = between(rr, 3, 6)
        const items = Array.from({ length: n }, () => {
          const d = date(rr, '2026-05-01')
          return { subject: pick(rr, [`${pick(rr, c.hooks).replace(/\.$/, '')} (issue #${between(rr, 4, 80)})`, `New: ${pick(rr, c.proofs).toLowerCase()}`, `${pick(rr, ['We looked at', 'Data from'])} ${fmt(between(rr, 200 * s, 9000 * s))} ${pick(rr, ['threads', 'prompts', 'articles', 'meetings'])}. Here is what we found.`, `${pick(rr, ['Last chance:', 'Price goes up Friday:', 'Founders deal:'])} ${c.price}`]), date: d, ago: ago(d), preview: pick(rr, c.hooks) + ' ' + pick(rr, c.proofs).toLowerCase() + '.', open: between(rr, 28, 54) + '%', list: fmt(between(rr, 300 * s * s, 5000 * s * s)) }
        }).sort((a, b) => (a.date < b.date ? 1 : -1))
        out.newsletter = { stat: `${items[0].list} list · ${pick(rr, ['weekly', 'biweekly', 'monthly'])}`, items }
      } else if (ch === 'affiliates') {
        const rate = pick(rr, ['20% recurring', '30% recurring', '25% first year', '$50 per paid', '40% first payment'])
        const items = [
          { k: 'Commission', v: rate }, { k: 'Cookie', v: pick(rr, ['30 days', '60 days', '90 days']) },
          { k: 'Platform', v: pick(rr, ['Rewardful', 'PartnerStack', 'Tolt', 'FirstPromoter', 'in-house']) },
          { k: 'Public affiliates', v: String(between(rr, 5 * s, 60 * s)) },
          { k: 'Top referrer', v: pick(rr, ['a "best tools" listicle', 'a YouTube tutorial', 'a founder newsletter', 'an AppSumo alumni site']) },
        ]
        out.affiliates = { stat: rate, items }
      }
    }
    return out
  }

  const data = competitors.map((c) => ({ ...c, data: gen(c) }))

  // ---- the other three sections: buyers asking, AI answers, your channels ----
  const venues = [
    { id: 'saasbuild', label: 'r/saasbuild', icon: 'reddit', color: '#ff6a3d', standing: 'good', filed: 19 },
    { id: 'micro', label: 'r/micro_saas', icon: 'reddit', color: '#ff6a3d', standing: 'good', filed: 14 },
    { id: 'aeo', label: 'r/Agentic_SEO', icon: 'reddit', color: '#ff6a3d', standing: 'warming', filed: 9 },
    { id: 'ih', label: 'r/indiehackers', icon: 'reddit', color: '#ff6a3d', standing: 'good', filed: 11 },
    { id: 'hn', label: 'Hacker News', icon: 'hn', color: '#ff7a1a', standing: 'good', filed: 6 },
    { id: 'dev', label: 'DEV', icon: 'dev', color: '#e7e5e4', standing: 'good', filed: 106 },
    { id: 'x', label: 'X', icon: 'x', color: '#e7e5e4', standing: 'good', filed: 290 },
    { id: 'threads', label: 'Threads', icon: 'threads', color: '#e7e5e4', standing: 'limited', filed: 42 },
  ]
  const T = (venue, title, author, age, snippet, intent, score, draft, status, why) => ({ venue, title, author, age, snippet, intent, score, draft, status, why })
  const threads = [
    T('saasbuild', 'How do you find people who actually need your tool?', 'u/bootstrapped_dan', '3h', 'Launched 2 weeks ago. 40 signups from PH, all dead. Where do people go to find actual buyers instead of other founders?', 'buying', 86,
      'the trick is to stop posting and start answering. search reddit for the exact sentence a buyer types before they know your category exists (for us it was "tool that finds reddit threads"). answer those, no link unless asked. most of our trials come from replies, not posts. happy to share the search list.', 'draft'),
    T('saasbuild', 'Anyone using AI to reply on Reddit without getting banned?', 'u/mkt_sarah', '9h', 'Tried ReplyGuy last year, account got shadowbanned in a week. Is there a version that lets me approve first?', 'buying', 92,
      'approve-first is the whole difference. anything that autoposts from your account eventually trips the spam filter, and karma-farmed accounts get nuked together. we built viewfy so he only drafts and you hit approve in the reddit box yourself. one caveat: it is slower, 5 to 10 a day, and that is the point.', 'approved'),
    T('saasbuild', 'Is a daily blog still worth it in 2026?', 'u/tomas_builds', '1d', 'Google spam update wiped 3 of my AI-written sites. Thinking of quitting content entirely.', 'advice', 61,
      'daily is fine, generic is what died. the posts that survived august for us answered one buyer question each and named real competitors. volume without a point is what got hit.', 'posted'),
    T('micro', 'What gets a product mentioned by ChatGPT?', 'u/jules_dev', '5h', 'Competitor gets named when I ask ChatGPT for tools in my niche. I do not. Same size company. What are they doing?', 'buying', 88,
      'run the exact question through perplexity and look at the sources. 9 times out of 10 the named product has a reddit thread or a comparison post that answers that question directly. that is what the model is quoting. write that page, then get it mentioned in one thread. we track this per question and it moved in 3 weeks.', 'draft'),
    T('micro', 'Solo founder, $0 marketing budget, what would you do first?', 'u/nina_ships', '14h', 'Product works. 12 paying users, all friends of friends. I have maybe 1 hour a day for marketing.', 'advice', 70,
      'one hour a day: 30 minutes answering questions where your buyers already ask (reddit, hn, dev), 30 minutes on one blog post a week that answers the question you got asked most. no ads, no cold email. that is the whole plan until 100 users.', 'draft'),
    T('micro', 'Best subreddits for B2B SaaS that allow self-promo?', 'u/growthguy22', '2d', 'Keep getting removed. Which subs are actually fine with a founder mentioning their product?', 'compare', 55,
      'the ones where you answered three questions before mentioning it. r/saasbuild, r/micro_saas and r/SideProject are fine if the mention is inside a real answer. rule 1 in most subs is "no link drops", not "no products".', 'posted'),
    T('aeo', 'Are AI visibility dashboards accurate?', 'u/seo_martin', '7h', 'Profound and Peec show different numbers for the same prompt. Which one is right?', 'compare', 74,
      'neither, and both. answers change per run, so a single sample is noise. what matters is direction over 20+ runs and whether the cited sources are ones you can influence. dashboard first is backwards. get one mention on the question first, then measure.', 'draft'),
    T('aeo', 'GEO agencies are quoting $5k/mo. Is there a self-serve way?', 'u/ecom_lena', '1d', 'We are a 3-person shop. Cannot justify agency retainers but ChatGPT never names us.', 'buying', 90,
      'self-serve exists at $50 to $100 for the monitoring part (peec, otterly). the part agencies charge for is earning the mention: a thread reply, a comparison page, a source the model can cite. viewfy does that half and you approve each piece. free tier if you want to test it on one question.', 'draft'),
    T('ih', 'Show IH: I built a tool that finds Reddit threads for you', 'u/hacker_pete', '4h', 'Keyword alerts plus GPT drafts. Free while in beta.', 'competitor', 30, '', 'skipped', 'their launch thread. never pitch inside one.'),
    T('ih', 'How I got 200 users from Reddit comments in 30 days', 'u/maya_indie', '20h', 'No posts, only comments. Sharing the exact process and the subs.', 'advice', 66,
      'this matches what we see: comments convert, posts get removed. the one thing i would add is tracking which question shapes convert, because 3 of them will carry 80% of signups.', 'approved'),
    T('hn', 'Ask HN: How do you do marketing when you hate marketing?', 'nprog', '6h', '142 points. Technical founder, product is good, zero users. I would rather ship than post.', 'buying', 81,
      'answer questions where they are being asked. hn, reddit, dev. replies, not posts. the founder still writes or approves the reply. we built exactly that and run it on ourselves: about 500 posted, 700 rejected by me, most trials come from replies.', 'approved'),
    T('hn', 'Show HN: Open-source Reddit keyword alerts', 'kwatch', '1d', 'A self-hosted F5Bot. Sends matches to Slack.', 'competitor', 35, '', 'skipped', 'alerts crowd, not a buyer. do not sell into a show hn.'),
    T('dev', 'I have no idea how to get my first users (help)', 'ana_codes', '8h', 'Built a CLI for API mocking. Posted on Twitter. Nothing. What now?', 'buying', 84,
      'dev tools get found in threads, not feeds. search "api mocking" on reddit and dev, sort by new, answer the last 10 questions with your actual experience. mention the cli only when it answers the question. that is where our first users came from.', 'posted'),
    T('dev', 'Stop writing AI blog posts nobody reads', 'marcus_w', '2d', 'A rant about the 200k-article mills. Is there a version of AI content that is not spam?', 'advice', 58,
      'the version that works is one post per buyer question, with a real comparison in it. slow and specific. the mills optimise for count, which is what google now penalises.', 'draft'),
    T('x', '@founder_amy: is there a tool that finds reddit threads where people ask for stuff like my product? not alerts, actual drafts', '@founder_amy', '2h', '4 replies, 2 of them competitors.', 'buying', 95,
      'yes, that is literally viewfy. he finds the thread, drafts the reply in your voice, you approve in the reddit box. free tier is 100 drafts, no card. dm me your site and i will run it.', 'draft'),
    T('x', '@saasjoe: 6 months in, 0 organic signups. every marketer i talk to says "content". what content.', '@saasjoe', '11h', '31 likes, 9 replies.', 'buying', 79,
      'the content is the answer to the question your buyer typed last week. find that thread first, then write the answer. one a day beats a calendar.', 'draft'),
    T('threads', '@builds.daily: anyone else getting nothing from product hunt anymore?', '@builds.daily', '1d', '18 replies, mostly agreement.', 'advice', 52,
      'ph is a launch-day spike, not a channel. the threads where people ask for your category are the channel. they exist every day.', 'draft'),
  ]

  const engines = {
    chatgpt: { label: 'ChatGPT', color: '#10a37f', ink: '#ffffff' },
    claude: { label: 'Claude', color: '#d97757', ink: '#ffffff' },
    perplexity: { label: 'Perplexity', color: '#22b8cf', ink: '#0c0b0a' },
  }
  const A = (engine, named, brands, excerpt, sources, position) => ({ engine, named, brands, excerpt, sources, position })
  const prompts = [
    { id: 'q-brand', text: 'is Viewfy worth it for a solo founder', intent: 'brand', results: [
      A('chatgpt', true, ['Viewfy'], 'Viewfy is worth it if you want Reddit and community replies drafted for you but still want to approve every post. It is less useful if you need paid ads managed.', ['viewfy.ai', 'reddit.com/r/saasbuild'], 1),
      A('claude', true, ['Viewfy', 'Okara'], 'For a solo founder Viewfy fits the "I ship, someone else finds the threads" job. Okara is the closest alternative at a higher price with a broader CMO scope.', ['viewfy.ai', 'okara.ai'], 1),
      A('perplexity', true, ['Viewfy'], 'Viewfy positions itself as a growth agent that drafts replies you approve. Reviews mention the free 100-draft tier and the approve-first flow.', ['viewfy.ai', 'producthunt.com'], 6),
    ] },
    { id: 'q-geo', text: 'are AI visibility dashboards accurate', intent: 'discovery', results: [
      A('chatgpt', false, ['Profound', 'Peec AI', 'Otterly.ai'], 'Dashboards like Profound, Peec and Otterly sample prompts repeatedly; single answers vary, so treat them as trend lines rather than exact scores.', ['tryprofound.com', 'peec.ai'], null),
      A('claude', false, ['Profound', 'Peec AI'], 'They are directionally useful. Profound uses a large real-prompt set; Peec is cheaper and EU-hosted. Neither fixes visibility on its own.', ['peec.ai', 'reddit.com/r/SEO'], null),
      A('perplexity', false, ['Profound', 'Peec AI', 'Otterly.ai', 'Scrunch AI'], 'Accuracy varies by engine and prompt volume. Profound, Peec, Otterly and Scrunch are the commonly compared tools.', ['otterly.ai', 'scrunch.ai'], null),
    ] },
    { id: 'q-reddit', text: 'how do I find people on Reddit already asking for my product', intent: 'discovery', results: [
      A('chatgpt', false, ['F5Bot', 'GummySearch', 'ReplyGuy'], 'Set keyword alerts with F5Bot, research subreddits with GummySearch, or use a tool like ReplyGuy that drafts replies for matching threads.', ['f5bot.com', 'replyguy.com'], null),
      A('claude', false, ['F5Bot', 'Syften'], 'Start with free alerts (F5Bot, Syften) on the phrases a buyer would type, then reply manually with real answers.', ['f5bot.com', 'syften.com'], null),
      A('perplexity', false, ['ReplyGuy', 'Redreach', 'MediaFast'], 'ReplyGuy, Redreach and MediaFast monitor Reddit for intent and suggest replies; check each subreddit rules before posting.', ['mediafa.st', 'redreach.ai'], null),
    ] },
    { id: 'q-cited', text: 'best tool to get my SaaS mentioned by ChatGPT', intent: 'discovery', results: [
      A('chatgpt', false, ['Profound', 'AthenaHQ', 'MediaFast'], 'Profound and AthenaHQ monitor and now draft fixes; MediaFast targets Reddit, which is a frequent citation source.', ['tryprofound.com', 'mediafa.st'], null),
      A('claude', false, ['Profound', 'Peec AI'], 'No tool guarantees a mention. Profound and Peec measure it; the mention itself comes from cited sources such as Reddit threads and comparison pages.', ['peec.ai'], null),
      A('perplexity', false, ['MediaFast', 'Profound', 'Peec AI', 'Otterly.ai'], 'Commonly recommended: MediaFast for Reddit-driven citations, Profound, Peec and Otterly for tracking.', ['mediafa.st', 'otterly.ai'], null),
    ] },
    { id: 'q-first', text: 'cheapest way to get the first 100 users for a B2B SaaS', intent: 'discovery', results: [
      A('chatgpt', false, [], 'Reply in communities where the buyers ask (Reddit, Indie Hackers, HN), do a small Product Hunt launch, and write comparison pages. No product named.', ['reddit.com', 'indiehackers.com'], null),
      A('claude', false, [], 'Direct conversations with 50 target users, community replies, and one launch. No tool recommended.', [], null),
      A('perplexity', false, ['Product Hunt'], 'Communities and a Product Hunt launch are the usual zero-budget path.', ['producthunt.com'], null),
    ] },
    { id: 'q-blog', text: 'AI tool that writes my blog daily', intent: 'discovery', results: [
      A('chatgpt', false, ['SEObot', 'Outrank', 'Journalist AI'], 'SEObot and Outrank publish articles on autopilot; Journalist AI pushes to WordPress. Watch for thin content after the August update.', ['seobotai.com', 'outrank.so'], null),
      A('claude', false, ['SEObot', 'Outrank'], 'SEObot ($49) and Outrank ($99) are the common picks; both are volume-first.', ['seobotai.com'], null),
      A('perplexity', false, ['Outrank', 'SEObot', 'Journalist AI'], 'Outrank, SEObot and Journalist AI are the most cited autonomous blog tools.', ['outrank.so', 'tryjournalist.com'], null),
    ] },
    { id: 'q-vs', text: 'Okara vs ReplyGuy vs Viewfy', intent: 'consideration', results: [
      A('chatgpt', true, ['Okara', 'ReplyGuy', 'Viewfy'], 'Okara is an AI CMO with Reddit engagement; ReplyGuy monitors and can auto-reply; Viewfy drafts replies you approve and adds a blog and outreach.', ['okara.ai', 'viewfy.ai'], 3),
      A('claude', true, ['Okara', 'ReplyGuy', 'Viewfy'], 'The main split is who posts: ReplyGuy can post for you (ban risk), Okara and Viewfy hand you the draft. Viewfy is the cheapest self-serve tier.', ['viewfy.ai', 'replyguy.com'], 3),
      A('perplexity', true, ['ReplyGuy', 'Okara', 'Viewfy'], 'ReplyGuy is the oldest; Okara bundles a full CMO; Viewfy focuses on approve-first replies and artifacts.', ['viewfy.ai/blog'], 3),
    ] },
    { id: 'q-alt', text: 'alternatives to ReplyGuy that do not autopost', intent: 'consideration', results: [
      A('chatgpt', false, ['Okara', 'MediaFast'], 'Okara and MediaFast both leave posting to you.', ['okara.ai', 'mediafa.st'], null),
      A('claude', true, ['Okara', 'Viewfy'], 'Okara and Viewfy are approve-first by design; Viewfy adds a Chrome extension that drafts inside the Reddit reply box.', ['viewfy.ai', 'okara.ai'], 2),
      A('perplexity', false, ['Redreach', 'Okara'], 'Redreach and Okara are usually listed; both require you to post.', ['redreach.ai'], null),
    ] },
  ]

  const you = {
    domain: brain.brand.domain,
    profile: {
      id: 'viewfy', name: 'Viewfy', domain: 'viewfy.ai', lane: 'you', size: 2, price: brain.prices, tag: brain.brand.one_liner,
      colors: ['#2a2210', '#e8c36a'],
      founders: [{ name: 'Mike Kovetskyi', role: 'Founder', handle: '@viewfy_ai' }],
      hooks: ['he gets you users while you ship.', '34 people asked for what you built. drafts are ready.', 'nothing posts without your approve.'],
      proofs: ['100 trial drafts, no card', 'approve-first on every channel', 'daily blog from your brief'],
      subs: ['r/saasbuild', 'r/micro_saas', 'r/indiehackers'],
      channels: ['x', 'reddit', 'dev', 'threads', 'blog', 'linkedin', 'founders', 'ph'],
    },
    stats: { x: '651 actions · 290 posted', reddit: '294 actions · 58 posted · 80 in queue', dev: '267 actions · 106 posted', threads: '144 actions · 102 rejected', blog: '18 posts · 1 keyword spent', linkedin: 'warming · 3 posts', founders: '1 person · daily', ph: 'launch planned' },
    gaps: ['meta', 'google', 'youtube', 'newsletter', 'affiliates'],
  }
  you.data = gen(you.profile)
  for (const k in you.stats) if (you.data[k]) you.data[k].stat = you.stats[k]

  // ---- what he made: blog, SEO fixes, links, social -------------------------
  const posts = [
    { title: 'Daily blog automation for SaaS: what survived the August update', date: '2026-09-02', keyword: 'daily blog automation', words: 1840, tone: 'ok', verdict: 'spent a brief keyword', note: 'The only post so far that spends one of the 12 commercial stems in the brief. This is the blog doing its job.' },
    { title: 'Viewfy vs ReplyGuy: approve-first vs autopost', date: '2026-08-28', keyword: 'replyguy alternative', words: 2210, tone: 'ok', verdict: 'aligned with the brief', note: 'The brief said write ReplyGuy, Okara, MediaFast. This one did. Scout cites it in r/saasbuild.' },
    { title: 'Show HN crawler audit: 156 launches, one pasted robots.txt', date: '2026-08-20', keyword: 'show hn seo', words: 2960, tone: 'ok', verdict: 'original research · 20 pitches cite it', note: 'Real data, nobody else has it. Linkbuilder offers this piece to editors. The artifact-to-outreach edge.' },
    { title: 'Why ChatGPT names your competitors and not you', date: '2026-08-25', keyword: 'get cited by chatgpt', words: 1720, tone: 'ok', verdict: 'matches a buyer question', note: 'Answers the same question the citation run asks. The page an engine can quote.' },
    { title: 'Viewfy vs Buffer', date: '2026-08-14', keyword: 'buffer alternative', words: 1500, tone: 'bad', verdict: 'brief forbids this', note: 'blog_brief: do not write vs Buffer, Hootsuite, Later. Wrong lane. The graph exists to catch this.' },
    { title: 'Viewfy vs Hootsuite', date: '2026-08-12', keyword: 'hootsuite alternative', words: 1480, tone: 'bad', verdict: 'brief forbids this', note: 'Same drift. Social scheduling is not the job.' },
    { title: 'Viewfy vs Later', date: '2026-08-10', keyword: 'later alternative', words: 1390, tone: 'bad', verdict: 'brief forbids this', note: 'Same drift.' },
  ]
  const prs = [
    { title: 'Add llms.txt and an AI-crawler sitemap', repo: 'viewfy/site', files: 3, status: 'merged', delta: '+6', date: '2026-08-19', note: 'GPTBot, ClaudeBot and PerplexityBot now get a plain index of every page and the brief summary.' },
    { title: 'Product JSON-LD and FAQ schema on /scout', repo: 'viewfy/site', files: 2, status: 'merged', delta: '+4', date: '2026-08-22', note: 'Structured data the engines quote when they compare tools.' },
    { title: 'Rewrite titles and descriptions on 12 pages', repo: 'viewfy/site', files: 12, status: 'open', delta: '+3 est.', date: '2026-08-30', note: 'Every title now carries one commercial stem from the brief. Waiting for your review.' },
    { title: 'robots.txt: allow AI crawlers, block the scrapers', repo: 'viewfy/site', files: 1, status: 'merged', delta: '+2', date: '2026-08-18', note: 'Was blocking GPTBot by accident. Found by the audit.' },
  ]
  const pitches = [
    { site: 'indiehackers.com', dr: 78, status: 'replied', artifact: 2, fee: 'free', note: 'Editor asked for a 900-word version with the raw table.' },
    { site: 'dev.to', dr: 82, status: 'won', artifact: 2, fee: 'free', note: 'Live. Canonical points at the post. First earned link from an artifact.' },
    { site: 'saastr.com', dr: 80, status: 'sent', artifact: 2, fee: 'unknown', note: 'Letter from your address, sent Aug 26. No reply yet.' },
    { site: 'failory.com', dr: 64, status: 'replied', artifact: 3, fee: 'free', note: 'Wants a quote from you for a "why AI names competitors" roundup.' },
    { site: 'growthmentor.com', dr: 71, status: 'quoted', artifact: 2, fee: '$120', note: 'Named a fee. Hidden from the desk until you decide. Under the 29% cap.' },
    { site: 'microconf.com', dr: 69, status: 'sent', artifact: 0, fee: 'unknown', note: 'Offered the August update piece to the newsletter editor.' },
  ]
  const social = [
    { channel: 'x', text: 'we crawled 156 show hn launches. 1 had a robots.txt worth copying. 41 blocked gptbot by accident. thread 🧵', when: 'Thu 9:00', status: 'queued', artifact: 2 },
    { channel: 'linkedin', text: 'Why does ChatGPT name your competitor and not you? We asked it 12 buyer questions and traced every source it quoted. Short version: the named product has a page that answers the question. Full write-up in the comments.', when: 'Tue 8:30', status: 'queued', artifact: 3 },
    { channel: 'x', text: 'approve-first vs autopost is not a feature debate. it is whether you keep your reddit account. wrote up the replyguy comparison.', when: 'Mon 9:00', status: 'posted', artifact: 1 },
    { channel: 'threads', text: 'daily blog is fine. generic is what died in august. one buyer question per post, name the rivals.', when: 'Wed 10:00', status: 'queued', artifact: 0 },
    { channel: 'dev', text: 'Crosspost: the Show HN crawler audit, with the raw CSV.', when: 'Fri 9:00', status: 'draft', artifact: 2 },
  ]
  const artifacts = [
    { id: 'blog', label: 'Blog', icon: 'pen', color: '#c9b58a', stat: `${posts.length} posts · 1 keyword spent · 3 off-brief`, note: 'One post per buyer question, on your domain, from the brief. Red means he drifted and the brief caught it.' },
    { id: 'seo', label: 'SEO fixes', icon: 'PR', color: '#93c5fd', stat: `score 84 · ${prs.filter((p) => p.status === 'merged').length} merged · 1 open`, note: 'Audit findings become pull requests into your repo. You merge. No vendor on the left ships code.' },
    { id: 'links', label: 'Earned links', icon: 'link', color: '#86efac', stat: `231 found · 119 pitched · ${pitches.filter((p) => p.status === 'replied' || p.status === 'won').length} replies · 1 live`, note: 'Sites that already rank get a letter from your address offering a real piece. Fees are shown only after an editor names one.' },
    { id: 'social', label: 'Social posts', icon: 'share', color: '#fda4af', stat: `${social.filter((s) => s.status === 'queued').length} queued · 1 posted`, note: 'Every artifact gets carried out: a thread on X, a LinkedIn post, a DEV crosspost. You approve the calendar.' },
  ]
  // cross-links: which artifact a thread reply or a pitch carries
  const links = [
    { from: 'ap:1', to: 't:1', label: 'scout reply cites' },
    { from: 'ap:2', to: 'al:0', label: 'pitch offers' }, { from: 'ap:2', to: 'al:1', label: 'live link' }, { from: 'ap:2', to: 'al:2', label: 'pitch offers' }, { from: 'ap:2', to: 'al:4', label: 'pitch offers' },
    { from: 'ap:3', to: 'al:3', label: 'pitch offers' }, { from: 'ap:3', to: 'q-cited', label: 'answers this question' },
    { from: 'ap:2', to: 'as:0', label: 'thread' }, { from: 'ap:3', to: 'as:1', label: 'post' }, { from: 'ap:1', to: 'as:2', label: 'post' }, { from: 'ap:2', to: 'as:4', label: 'crosspost' },
    { from: 'ap:0', to: 'you:blog', label: 'published' },
  ]

  // ---- per-channel policy, as set in product settings ------------------------
  const rungs = {
    advice: { label: 'Advice only', short: 'A', color: '#6ee7b7' },
    founder: { label: 'Soft mention', short: 'S', color: '#e8c36a' },
    promo: { label: 'Names the product', short: 'P', color: '#fbbf24' },
    link: { label: 'Includes a link', short: 'L', color: '#7eb8e8' },
  }
  const standing = { good: '#6ee7b7', warming: '#e8c36a', limited: '#f07167', blocked: '#f07167', unknown: '#6b6560' }
  const policy = {
    x: { identity: '@viewfy_ai · the brand', standing: 'good', rung: 'advice', auto: false, cap: 20, days: 'Mon–Fri', link: 'never', rooms: 'pinned query + Chrome extension' },
    reddit: { identity: 'pool persona · unnamed', standing: 'good', rung: 'promo', auto: false, cap: 5, days: 'every day', link: 'profile only', rooms: '20 rooms pinned · r/saasbuild, r/micro_saas, r/Agentic_SEO …' },
    dev: { identity: 'mike_viewfy · you', standing: 'good', rung: 'link', auto: false, cap: 10, days: 'Mon–Fri', link: 'allowed', rooms: 'tags: saas, marketing, indiehackers' },
    threads: { identity: '@viewfy_ai · the brand', standing: 'limited', rung: 'advice', auto: false, cap: 5, days: 'Mon–Fri', link: 'never', rooms: 'keyword hunt only' },
    blog: { identity: 'viewfy.ai/blog · Viewfy', standing: 'good', rung: 'link', auto: true, cap: 1, days: 'Mon–Fri', link: 'allowed', rooms: 'publishes after your attest' },
    linkedin: { identity: 'company page · the brand', standing: 'warming', rung: 'founder', auto: false, cap: 3, days: 'Mon–Fri', link: 'never', rooms: 'company posts only, no comment agent' },
    founders: { identity: 'Mike Kovetskyi · you', standing: 'good', rung: 'founder', auto: false, cap: 2, days: 'every day', link: 'profile only', rooms: 'drafts for your own X and LinkedIn' },
    ph: { identity: 'khadgar · branded persona', standing: 'unknown', rung: 'promo', auto: false, cap: 1, days: 'launch week', link: 'allowed', rooms: 'launch planned, see launches.md' },
  }
  you.policy = policy

  // ---- your site: a nested map of pages with the stats we collect on each ---
  const collect = [
    { k: 'Visits, sources, trials started', src: 'Viewfy tracker (first-party)', when: 'live' },
    { k: 'Impressions, clicks, position per query', src: 'Google Search Console API', when: 'daily' },
    { k: 'AI crawler hits per bot (GPTBot, ClaudeBot, PerplexityBot, Google-Extended)', src: 'server / CDN logs', when: 'daily' },
    { k: 'Pages the engines actually cite for the 12 buyer questions', src: 'citation runs', when: 'weekly' },
    { k: 'Indexed, last crawl, canonical, in sitemap and llms.txt', src: 'GSC inspection + our crawl', when: 'daily' },
    { k: 'Brief coverage: which commercial stems the page carries', src: 'brief × page text', when: 'on change' },
    { k: 'Title and meta length, schema present, word count, internal links in and out', src: 'SEO audit', when: 'on change' },
    { k: 'LCP, CLS, INP', src: 'CrUX + Lighthouse', when: 'weekly' },
    { k: 'Backlinks and referring domains', src: 'Ahrefs API', when: 'weekly' },
  ]
  const siteGroups = [
    { id: 'home', label: 'Home', icon: 'home', color: '#e8c36a', pages: [['/', 'He gets you users while you ship', 5, ['ai growth agent for founders']]] },
    { id: 'product', label: 'Product pages', icon: 'box', color: '#7eb8e8', pages: [
      ['/scout', 'Scout: he finds your users mid-question', 4, ['reddit marketing tool', 'find people on reddit asking']],
      ['/blogger', 'Daily blog from your brief', 3, ['daily blog automation for saas']],
      ['/seo-auditor', 'SEO and GEO audit', 3, ['seo geo audit']],
      ['/linkbuilder', 'Earned links from real articles', 2, ['link building for saas']],
      ['/chrome', 'Viewfy in Chrome', 3, ['reddit reply chrome extension']],
      ['/mini', 'Viewfy Mini', 2, []],
      ['/chatgpt', 'Viewfy inside ChatGPT', 2, ['chatgpt marketing plugin']],
      ['/claude', 'Viewfy inside Claude', 1, ['claude mcp marketing']],
      ['/ios', 'Viewfy for iOS', 1, []],
    ] },
    { id: 'blog', label: 'Blog', icon: 'pen', color: '#c9b58a', pages: [
      ['/blog', 'Blog index', 3, []],
      ...posts.map((p) => ['/blog/' + p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48), p.title, p.tone === 'bad' ? 1 : 3, [p.keyword]]),
    ] },
    { id: 'tools', label: 'Free tools', icon: 'check', color: '#6ee7b7', pages: [
      ['/check-seo-geo', 'Is your site retrievable by AI?', 5, ['ai visibility check', 'chatgpt seo check']],
      ['/standing', 'Account standing', 3, ['reddit account standing']],
      ['/standing/reddit', 'Reddit standing', 2, ['reddit shadowban check']],
      ['/standing/x', 'X standing', 2, []],
      ['/standing/threads', 'Threads standing', 1, []],
      ['/llm-txt', 'llms.txt generator', 3, ['llms.txt generator']],
      ['/floor', 'The floor', 2, []],
      ['/rules', 'Subreddit rules', 2, ['subreddit self promotion rules']],
    ] },
    { id: 'buy', label: 'Pricing and start', icon: '$', color: '#fdba74', pages: [
      ['/pricing', 'Pricing', 4, ['viewfy pricing']],
      ['/start', 'Start: he reads your site', 4, []],
      ['/faq', 'FAQ', 2, ['is viewfy worth it']],
      ['/connect', 'Connect accounts', 1, []],
    ] },
    { id: 'trust', label: 'Trust and legal', icon: 'shield', color: '#b39dfa', pages: [
      ['/ai-transparency', 'AI content transparency', 2, []],
      ['/content-policy', 'Content policy', 1, []],
      ['/terms', 'Terms', 1, []],
      ['/privacy', 'Privacy', 1, []],
      ['/data-deletion', 'Data deletion', 1, []],
    ] },
  ]
  const BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']
  function pageStats(path, w, kws) {
    const r = rng('pg' + path)
    const base = [40, 120, 400, 1100, 3200, 6800][w] * (0.7 + r() * 0.6)
    const trend = Array.from({ length: 12 }, (_, i) => Math.round((base / 4.3) * (0.6 + r() * 0.5 + i * 0.03)))
    const visits = trend.slice(-4).reduce((a, b) => a + b, 0)
    let src = [r() * 5 + 2, r() * 2 + (w > 2 ? 1 : 0.2), r() * 3 + 1, r() * 2 + 1, r() * 1.5]
    const tot = src.reduce((a, b) => a + b, 0); src = src.map((x) => Math.round((x / tot) * 100))
    const impressions = Math.round(visits * (3 + r() * 9)), clicks = Math.round(impressions * (0.02 + r() * 0.06))
    const bots = Object.fromEntries(BOTS.map((b) => [b, Math.round(r() * 30 * (w + 1))]))
    const indexed = r() > 0.08, schema = r() > 0.45, llms = r() > 0.3, titleLen = between(r, 28, 74), metaLen = between(r, 60, 190), words = between(r, 180, 2900), linksIn = between(r, 0, 14), lcp = +(1.2 + r() * 2.6).toFixed(1)
    const cited = kws.length ? between(r, 0, kws.length > 1 ? 3 : 2) : 0
    const issues = []
    if (!indexed) issues.push('not indexed')
    if (!schema) issues.push('no schema')
    if (!llms) issues.push('missing from llms.txt')
    if (titleLen > 60) issues.push(`title ${titleLen} chars`)
    if (metaLen > 160) issues.push('meta too long')
    if (words < 350) issues.push(`thin · ${words} words`)
    if (linksIn < 2) issues.push(`${linksIn} internal links in`)
    if (lcp > 2.5) issues.push(`LCP ${lcp}s`)
    if (bots.GPTBot === 0 && w > 1) issues.push('GPTBot never fetched it')
    const tone = issues.length === 0 ? 'ok' : issues.length <= 2 ? 'warn' : 'bad'
    return { visits, trend, src: { search: src[0], ai: src[1], reddit: src[2], direct: src[3], social: src[4] }, gsc: { impressions, clicks, pos: +(2 + r() * 30).toFixed(1) }, bots, indexed, schema, llms, titleLen, metaLen, words, linksIn, linksOut: between(r, 2, 30), lcp, cited, kws: kws.map((k) => ({ k, pos: between(r, 1, 40) })), trials: Math.round(visits * (w > 2 ? 0.01 + r() * 0.03 : r() * 0.008)), changed: date(r, '2026-06-01'), backlinks: between(r, 0, 12 * w), issues, tone }
  }
  const site = {
    domain: brain.brand.domain, collect,
    groups: siteGroups.map((g) => ({ ...g, pages: g.pages.map(([path, title, w, kws]) => ({ path, title, w, ...pageStats(path, w, kws) })) })),
  }
  const allPages = site.groups.flatMap((g) => g.pages)
  site.total = { visits: allPages.reduce((a, p) => a + p.visits, 0), indexed: allPages.filter((p) => p.indexed).length, pages: allPages.length, bots: allPages.reduce((a, p) => a + Object.values(p.bots).reduce((x, y) => x + y, 0), 0), trials: allPages.reduce((a, p) => a + p.trials, 0), issues: allPages.reduce((a, p) => a + p.issues.length, 0) }
  // the blog post pages are the same objects as the artifacts
  posts.forEach((p, i) => links.push({ from: 'ap:' + i, to: 'pg:' + allPages.findIndex((x) => x.title === p.title), label: 'the page' }))
  links.push({ from: 'pg:0', to: 'q-brand', label: 'cited as source' }, { from: 'pg:' + allPages.findIndex((x) => x.path === '/check-seo-geo'), to: 'v:aeo', label: 'reply links here' })

  // ---- intel: niche, sourced, each with a draft in your voice ----------------
  const intel = [
    { id: 'profound-reels', kind: 'gap', score: 92, hl: 'profound:meta', comp: 'profound', chan: 'meta',
      title: 'Profound moved its Instagram ads to 15-second founder-face Reels three weeks ago, and they are gaining traction',
      why: 'The format is the signal, not the stat. One founder on camera saying one number. You have the number: 512 posted, 693 rejected.',
      evidence: [['new creatives since Jul 15', 'Video · Instagram only'], ['reach vs their image ads', '2.4x'], ['the one line in all of them', '“1.3B real prompts”']], source: 'Meta Ad Library · 21 days',
      draft: { channel: 'meta', format: 'Video', platforms: ['Instagram'], hook: '693 times I said no to my own marketing agent.', primary: '693 times i said no to my own marketing agent. 512 times yes.\n\nthat is the product. he finds the thread where your buyer is asking, drafts the reply, and waits. you decide. 15 seconds, my face, one number.', headline: 'You approve. He posts.', description: '100 trial drafts · no card', cta: 'Start free' } },
    { id: 'okara-brand-bid', kind: 'risk', score: 90, hl: 'okara:google', comp: 'okara', chan: 'google',
      title: 'Okara started bidding on your brand: 3 Google ads send “viewfy alternative” to okara.ai/vs-viewfy',
      why: 'You have no Okara comparison page, so their ad wins both the click and the framing. A page with the price gap beats a bid.',
      evidence: [['first seen', 'Aug 19'], ['queries', 'viewfy alternative · viewfy pricing'], ['regions', 'US · UK · CA'], ['your comparison page', 'none']], source: 'Google Ads Transparency Center',
      draft: { channel: 'blog', title: 'Viewfy vs Okara: $49 approve-first vs a $99 AI CMO', keywords: ['okara alternative', 'viewfy vs okara'], outline: ['who posts (you, in both) and where the draft lands (reply box vs copy-paste)', 'what comes with the reply: blog, PRs, links vs a marketing plan', 'price: $49 part time vs $99 CMO, what you get per dollar', 'when Okara is the better buy'] } },
    { id: 'mediafast-triad', kind: 'gap', score: 86, hl: 'mediafast:x', comp: 'mediafast', chan: 'x',
      title: 'MediaFast’s “invisible, banned, no traction” posts are the only ones that break 100k views',
      why: 'Three fears in one line, no product in it. Same buyer as yours, with one more fear you can name: a reply you did not write going out under your name.',
      evidence: [['posts over 100k views, last 30d', '3 of 8 · all use the triad'], ['product posts, median', '9k views'], ['reply rate on the triad posts', '4x']], source: 'Bright Data · X',
      draft: { channel: 'x', text: 'invisible on google. banned on reddit. or a bot posted something under your name you never read.\n\npick zero. viewfy drafts, you approve, in the reply box. 100 drafts free.' } },
    { id: 'r-seo-room', kind: 'act', score: 84, hl: 'q-geo:perplexity',
      title: 'Perplexity cites r/SEO for “are AI visibility dashboards accurate”, and you have no room pinned there',
      why: 'The engine is telling you which room it reads for that question. Profound, Peec and Otterly are named because someone answered there. Nobody from you has commented in r/SEO in 30 days.',
      evidence: [['cited source', 'reddit.com/r/SEO'], ['your comments there, 30d', '0'], ['named instead', 'Profound · Peec · Otterly']], source: 'citation run · Sep 2',
      ctas: [['act', 'Pin r/SEO as a room'], ['go', 't:6', 'Reply in r/Agentic_SEO'], ['go', 'q-geo:perplexity', 'See the answer']] },
    { id: 'rush-tuesday', kind: 'gap', score: 80, hl: 'seobot:founders', comp: 'seobot', chan: 'founders',
      title: 'John Rush posts a build-in-public MRR thread every week; it pulls 20x the views of SEObot’s company account',
      why: 'Same ICP reads both accounts. Your founder handle posts sporadically and never with the numbers. The rejected drafts are the number nobody else can post.',
      evidence: [['founder cadence', 'daily'], ['founder vs company, median views', '14k vs 700'], ['topics', 'MRR · hiring · build in public']], source: 'Bright Data · X people profiles',
      draft: { channel: 'x', author: 'founder', text: 'viewfy, month 3, real numbers:\n\n512 replies posted. 693 i rejected. 7 trials from replies this week. $0 on ads.\n\nthe rejected ones are the product. thread 🧵' } },
    { id: 'peec-case-study', kind: 'gap', score: 78, hl: 'peec:linkedin', comp: 'peec', chan: 'linkedin',
      title: 'Peec AI’s case-study posts get 4x the reactions of its product posts, one every Thursday',
      why: 'Customer size, one number, one line of how. You have the same shape of story sitting in the scout queue: 18 approved replies, 7 trials.',
      evidence: [['case studies vs product posts, reactions', '612 vs 140'], ['cadence', 'weekly · Thu'], ['shape', 'company size · one number · how']], source: 'Bright Data · LinkedIn',
      draft: { channel: 'linkedin', type: 'Case study', text: 'How a solo founder got 7 trials from 18 Reddit replies in a week, without posting once.\n\n• 34 threads found where buyers were asking\n• 18 drafts approved, 16 rejected\n• 12 of the askers replied\n• 7 started a trial\n\nEvery reply was written for him. Every reply was his call.' } },
    { id: 'outrank-agents', kind: 'gap', score: 74, hl: 'outrank:reddit', comp: 'outrank', chan: 'reddit',
      title: 'Outrank is pushing “blog automation for coding agents” in r/SEO and r/SaaS, and shipped an API/CLI page for it',
      why: 'That stem is missing from your brief, and your blogger already has an MCP a coding agent can call. They are naming the category you can own.',
      evidence: [['Reddit mentions, 30d', '4 · 3 self-promo'], ['hooks that mention the API/CLI', '2 of 5'], ['your brief', 'stem missing']], source: 'Bright Data · Reddit + sitemap crawl',
      draft: { channel: 'blog', title: 'Daily blog from Claude Code: the MCP your coding agent can call', keywords: ['blog automation for coding agents', 'mcp blog writer'], outline: ['the tool call, verbatim', 'what the brief adds that a prompt cannot', 'the human attest before publish', 'Outrank’s API vs an MCP, honestly'] } },
    { id: 'replyguy-ban-stories', kind: 'act', score: 72, hl: 't:1',
      title: 'ReplyGuy is named negatively in 2 of this week’s buying threads, and Claude already lists Viewfy as the non-autopost alternative',
      why: 'The category’s ban stories are your opening line. One engine agrees. The r/saasbuild thread asking “is there a version that lets me approve first” has a draft waiting.',
      evidence: [['threads naming ReplyGuy this week', '2 · both shadowban stories'], ['“alternatives to ReplyGuy that do not autopost”', 'Claude names Viewfy · ChatGPT, Perplexity do not'], ['draft waiting', 'r/saasbuild · score 92']], source: 'scout queue + citation run',
      ctas: [['go', 't:1', 'Approve the reply'], ['go', 'q-alt', 'See the answers'], ['go', 'ap:1', 'Refresh the comparison post']] },
    { id: 'engage-free', kind: 'gap', score: 66, hl: 'engageai:meta', comp: 'engageai', chan: 'meta',
      title: 'Engage AI’s highest-reach Meta ads all lead with “free unlimited”; its paid-tier ads are switched off',
      why: 'Free-tier-as-hook works on this buyer. Your 100 free drafts are the same offer and appear on the homepage only.',
      evidence: [['top 4 ads by reach', 'all say “free”'], ['paid-tier ads', 'inactive'], ['reach vs paid-tier ads', '1.8x']], source: 'Meta Ad Library',
      draft: { channel: 'x', text: '100 drafts free. no card.\n\nhe reads your site and starts finding threads in about 4 minutes. the paid tier is for when you want him every morning.' } },
  ]

  const sections = [
    { id: 'buyers', label: 'Buyers asking', short: 'Buyers', color: '#5eead4', icon: 'bubble', side: 'right', note: 'Live threads where a buyer is asking right now. He drafts, you approve. Nothing posts on its own.' },
    { id: 'answers', label: 'AI answers', short: 'AI answers', color: '#f0abfc', icon: 'sparkle', side: 'right', note: 'The questions a buyer types into ChatGPT, Claude and Perplexity, and who gets named.' },
    { id: 'artifacts', label: 'What he made', short: 'Artifacts', color: '#fdba74', icon: 'layers', side: 'right', note: 'What he shows up with: posts on your domain, pull requests into your repo, earned links, the social calendar. Artifacts keep the replies out of the spam bucket.' },
    { id: 'you', label: 'Your channels', short: 'You', color: '#e8c36a', icon: 'flag', side: 'right', note: 'Your own footprint on the same channel map as the competitors, with the policy you set per channel: identity, autonomy rung, cap, schedule, standing. Dashed means you are not there.' },
    { id: 'site', label: 'Your site', short: 'Site', color: '#a5b4fc', icon: 'globe', side: 'right', note: 'Every public page, nested by URL. Each one carries the stats we collect: visits and where they came from, search impressions, which AI crawlers fetched it, whether an engine cites it, brief coverage, and health.' },
    { id: 'competitors', label: 'Competitors', short: 'Competitors', color: '#7eb8e8', icon: 'target', side: 'left', note: 'Everyone selling into the same buyer, grouped by lane, with every channel they market on.' },
  ]

  return { brain, lanes, channels, competitors: data, sections, venues, threads, engines, prompts, you, artifacts, posts, prs, pitches, social, links, rungs, standing, site, intel }
})()
