import type { Run } from './types'

export type BuyerQuestion = {
  id: string
  topic: string
  title: string
  snippet: string
  intent: string
  sourceLabel?: string
  sourceTitle?: string
  sourceUrl?: string
  publishedAt?: string
  evidence: 'public_discussion' | 'sample'
}
export type BuyerTopic = { id: string; label: string; icon: string }
export const BUYER_TOPICS: BuyerTopic[] = [
  { id: 'insurance-fit', label: 'Agency fit', icon: 'headphones' },
  { id: 'missed-calls', label: 'Missed calls & bookings', icon: 'phone' },
  { id: 'human-vs-ai', label: 'Human vs. AI', icon: 'users' },
  { id: 'pricing-roi', label: 'Pricing & value', icon: 'target' },
]
export const BUYER_RESEARCH_DATE = '2026-09-08'
export const BUYER_QUESTIONS: BuyerQuestion[] = [
  {
    id: 'agency-receptionist', topic: 'insurance-fit',
    title: 'Which virtual receptionist works for a small independent agency?',
    snippet: 'An agency owner describes missed calls during lunch and time away from the office, and asks other agents about alternatives to Sonant.',
    intent: 'Compare insurance-specific receptionists', sourceLabel: 'Reddit · r/InsuranceAgent', sourceTitle: 'Virtual Receptionist',
    sourceUrl: 'https://www.reddit.com/r/InsuranceAgent/comments/1l7pwut/virtual_receptionist/', publishedAt: '2025-06-10', evidence: 'public_discussion',
  },
  {
    id: 'insurance-voice-ai', topic: 'insurance-fit',
    title: 'Has anyone used a voice AI receptionist in their insurance business?',
    snippet: 'An insurance forum member asks about Care Cycle, Regal AI, Medicare Vox, and Agent CRM while considering an AI receptionist.',
    intent: 'Evaluate insurance use cases', sourceLabel: 'Insurance Forums', sourceTitle: 'Voice AI Receptionist',
    sourceUrl: 'https://www.insurance-forums.com/community/threads/voice-ai-receptionist.117751/', publishedAt: '2026-06-08', evidence: 'public_discussion',
  },
  {
    id: 'front-desk-booking', topic: 'missed-calls',
    title: 'Can an AI receptionist book jobs correctly without constant checking?',
    snippet: 'A home-services owner asks whether AI can handle unanswered calls and bookings reliably without frustrating customers.',
    intent: 'Recover calls and automate bookings', sourceLabel: 'Reddit · r/smallbusiness', sourceTitle: 'Who has actually replaced front-desk tasks with an AI receptionist?',
    sourceUrl: 'https://www.reddit.com/r/smallbusiness/comments/1pqlni4/who_has_actually_replaced_frontdesk_tasks_with_an/', evidence: 'public_discussion',
  },
  {
    id: 'switch-human-ai', topic: 'human-vs-ai',
    title: 'Will customers hang up on AI, or is it better than a human answering service?',
    snippet: 'A service-business owner says a human service only took messages and asks whether AI would be better than hiring part-time help.',
    intent: 'Compare AI with human coverage', sourceLabel: 'Reddit · r/AiForSmallBusiness', sourceTitle: 'Anyone switched to an AI receptionist?',
    sourceUrl: 'https://www.reddit.com/r/AiForSmallBusiness/comments/1rmfih3/anyone_switched_to_an_ai_receptionist/', publishedAt: '2026-03-06', evidence: 'public_discussion',
  },
  {
    id: 'setup-maintenance', topic: 'human-vs-ai',
    title: 'Is AI practical for a small team, or will setup and routing become extra work?',
    snippet: 'A service-business operator worries about callers getting stuck in loops and asks whether AI is practical at their call volume.',
    intent: 'Assess reliability and maintenance', sourceLabel: 'Reddit · r/AIReceptionists', sourceTitle: 'Is an AI receptionist worth setting up or just another thing to maintain?',
    sourceUrl: 'https://www.reddit.com/r/AIReceptionists/comments/1rw7t37/is_an_ai_receptionist_for_small_business_actually/', publishedAt: '2026-03-17', evidence: 'public_discussion',
  },
  {
    id: 'answering-cost', topic: 'pricing-roi',
    title: 'What does an answering service cost, and what work is included?',
    snippet: 'A business serving contractors asks what providers charge, whether they only answer or forward calls, and whether the service is worth buying.',
    intent: 'Understand pricing and service scope', sourceLabel: 'Reddit · r/smallbusiness', sourceTitle: 'How much does an answering service cost for your business?',
    sourceUrl: 'https://www.reddit.com/r/smallbusiness/comments/1cnbbhw/how_much_does_an_answering_service_cost_for_your/', publishedAt: '2024-05-08', evidence: 'public_discussion',
  },
  {
    id: 'ruby-answerconnect', topic: 'pricing-roi',
    title: 'Ruby or AnswerConnect: which gives better service for the price?',
    snippet: 'An accounting-firm operator compares Ruby and AnswerConnect on reliability, support, integrations, and value.',
    intent: 'Shortlist human answering services', sourceLabel: 'Reddit · r/smallbusiness', sourceTitle: 'Phone answering service',
    sourceUrl: 'https://www.reddit.com/r/smallbusiness/comments/1dobpxi/phone_answering_service/', publishedAt: '2024-06-25', evidence: 'public_discussion',
  },
  {
    id: 'startup-roi', topic: 'pricing-roi',
    title: 'Does an AI receptionist convert leads, or just answer the phone?',
    snippet: 'Someone preparing to launch a business asks about customer reactions, hidden costs, setup effort, and whether AI reception produces useful leads.',
    intent: 'Evaluate return on investment', sourceLabel: 'Reddit · r/AiForSmallBusiness', sourceTitle: 'Is an AI receptionist worth it for a small business?',
    sourceUrl: 'https://www.reddit.com/r/AiForSmallBusiness/comments/1ry0bdc/is_an_ai_receptionist_worth_it_for_a_small/', publishedAt: '2026-03-19', evidence: 'public_discussion',
  },
]

export function hasReceptionistResearch(run: Run) {
  return /^(getsuperagent\.(com|me)|superagent\.ai)$/i.test(run.domain.replace(/^www\./, ''))
    || /insurance|receptionist|answering service/i.test(`${run.brand.category || ''} ${run.brand.one_liner || ''}`)
}

export function getBuyerResearch(run: Run): { topics: BuyerTopic[]; questions: BuyerQuestion[]; note: string } {
  if (hasReceptionistResearch(run)) return {
    topics: BUYER_TOPICS, questions: BUYER_QUESTIONS,
    note: 'Public insurance and small-business discussions. Questions are paraphrased; identities and experiences are self-reported. Collected Sep 8, 2026.',
  }
  const name = run.brand.name || run.domain
  return {
    topics: [{ id: 'product-fit', label: 'Product fit', icon: 'users' }, { id: 'pricing-roi', label: 'Pricing & value', icon: 'target' }],
    questions: [
      { id: 'sample-fit', topic: 'product-fit', title: `Would ${name} work for a small team?`, snippet: 'An example question to guide customer research for this business.', intent: 'Evaluate fit', evidence: 'sample' },
      { id: 'sample-switch', topic: 'product-fit', title: `What should I compare before switching to ${name}?`, snippet: 'An example question about alternatives, setup, and switching effort.', intent: 'Compare alternatives', evidence: 'sample' },
      { id: 'sample-value', topic: 'pricing-roi', title: `What does ${name} cost, and when is it worth it?`, snippet: 'An example question about total cost and expected value.', intent: 'Understand value', evidence: 'sample' },
    ],
    note: 'Sample buyer questions tailored to this business. These are research prompts, not collected conversations.',
  }
}
