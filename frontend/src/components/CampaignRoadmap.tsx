import './CampaignRoadmap.css'

const STEPS = [
  { id: 'launch', when: 'Now', title: 'First campaign', body: 'Your first campaign is live and reaching your audience. Let the learning begin.', tag: 'Campaign launched' },
  { id: 'test', when: 'This week', title: '10 new ads', body: 'Explore fresh hooks, new visuals, and different reasons to say yes.', tag: 'Find your angle' },
  { id: 'scale', when: 'Week 3', title: 'Scale the winners', body: 'Let the results lead. Put more behind the ideas that earn it.', tag: 'Build on what works' },
  { id: 'evolve', when: 'Every week', title: 'Keep evolving', body: 'Refresh the creative. Keep testing. Make every round a little smarter.', tag: 'Learn. Repeat.' },
] as const

function StageArt({ stage }: { stage: typeof STEPS[number]['id'] }) {
  return (
    <svg className="campaign-roadmap-art" viewBox="0 0 240 160" fill="none" aria-hidden="true" focusable="false">
      <ellipse className="roadmap-art-ground" cx="120" cy="141" rx="74" ry="9" />
      {stage === 'launch' && <>
        <circle className="roadmap-art-orbit" cx="121" cy="81" r="61" strokeDasharray="3 7" />
        <path className="roadmap-art-trail" d="M49 129c-5-28 23-33 33-14 12 23 1 28-4 18-7-14 18-40 40-42" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 5" />
        <g className="roadmap-art-float">
          <path className="roadmap-plane-shadow" d="m77 70 105-36-35 100-24-36-46-28Z" />
          <path className="roadmap-art-paper" d="m69 62 105-36-35 100-24-36-46-28Z" strokeWidth="1.5" strokeLinejoin="round" />
          <path className="roadmap-art-fill" d="m115 90 59-64-35 100-24-36Z" />
          <path className="roadmap-art-fold" d="m115 90-3 27 16-10-13-17Z" />
          <path d="m115 90 59-64" stroke="white" strokeOpacity=".75" strokeWidth="1.5" />
          <path className="roadmap-art-ink" d="m141 16 2-7m43 44 8 1M56 63l-7-3" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle className="roadmap-art-fill" cx="59" cy="104" r="3" opacity=".5" />
        <path className="roadmap-art-ink" d="M185 98v10m-5-5h10" strokeWidth="2" strokeLinecap="round" />
      </>}
      {stage === 'test' && <>
        <g transform="rotate(-14 85 85)">
          <rect className="roadmap-art-back-card" x="36" y="39" width="85" height="102" rx="11" />
          <rect x="45" y="49" width="67" height="51" rx="6" fill="#b6a1f1" />
          <circle cx="79" cy="74" r="15" fill="#dfd4ff" />
          <path d="m70 80 10-18 12 21" stroke="#8b64d0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="rotate(13 168 88)">
          <rect className="roadmap-art-back-card" x="127" y="40" width="80" height="101" rx="11" />
          <rect x="135" y="49" width="64" height="51" rx="6" fill="#f2bb91" />
          <path d="m146 80 15-20 9 12 10-9 9 19" stroke="#fff4e2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="roadmap-art-float">
          <rect className="roadmap-art-paper" x="80" y="20" width="86" height="113" rx="12" strokeWidth="1.5" />
          <rect x="89" y="29" width="68" height="65" rx="7" fill="#b8cfff" />
          <circle cx="124" cy="62" r="22" fill="#e8efff" />
          <path d="m124 46 4 11 12 5-12 4-4 12-4-12-12-4 12-5 4-11Z" fill="#628cf1" />
          <path className="roadmap-art-line" d="M92 106h47m-47 9h30" strokeWidth="4" strokeLinecap="round" />
          <circle className="roadmap-art-fill" cx="159" cy="26" r="14" />
          <path d="M159 20v12m-6-6h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </g>
        <path className="roadmap-art-ink" d="M48 23v8m-4-4h8m151 76v8m-4-4h8" strokeWidth="1.5" strokeLinecap="round" />
      </>}
      {stage === 'scale' && <>
        <rect className="roadmap-art-paper" x="42" y="30" width="158" height="107" rx="13" strokeWidth="1.5" />
        <path className="roadmap-art-grid" d="M57 58h128M57 82h128M57 106h128" strokeDasharray="3 4" />
        <rect className="roadmap-art-fill" x="62" y="100" width="20" height="24" rx="4" opacity=".22" />
        <rect className="roadmap-art-fill" x="94" y="86" width="20" height="38" rx="4" opacity=".4" />
        <rect className="roadmap-art-fill" x="126" y="75" width="20" height="49" rx="4" opacity=".62" />
        <rect className="roadmap-art-fill" x="158" y="54" width="20" height="70" rx="4" opacity=".85" />
        <g className="roadmap-art-float">
          <path className="roadmap-art-ink" d="m63 89 40-27 28 7 44-40m-19 0h19v19" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="roadmap-art-paper" cx="192" cy="30" r="20" strokeWidth="1.5" />
          <path className="roadmap-art-fill" d="m192 18 3.5 7 8 1-6 5.5 1.5 8-7-4-7 4 1.5-8-6-5.5 8-1 3.5-7Z" />
        </g>
        <path className="roadmap-art-ink" d="M30 72v8m-4-4h8" strokeWidth="1.5" strokeLinecap="round" />
      </>}
      {stage === 'evolve' && <>
        <circle className="roadmap-art-orbit" cx="120" cy="79" r="59" strokeDasharray="3 6" />
        <path className="roadmap-art-ink" d="M76 63a46 46 0 0 1 83-10m-1-14 3 16-16-1M164 96a46 46 0 0 1-83 10m1 14-3-16 16 1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g className="roadmap-art-float">
          <rect className="roadmap-art-paper" x="91" y="48" width="58" height="61" rx="19" strokeWidth="1.5" />
          <path className="roadmap-art-fill" d="m120 58 5 14 14 6-14 5-5 15-5-15-14-5 14-6 5-14Z" />
        </g>
        <circle className="roadmap-art-back-card" cx="66" cy="98" r="13" />
        <path className="roadmap-art-ink" d="m61 98 3 3 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="roadmap-art-back-card" cx="174" cy="62" r="13" />
        <path className="roadmap-art-ink" d="m169 62 3 3 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="roadmap-art-fill" cx="174" cy="121" r="3" opacity=".5" />
        <path className="roadmap-art-ink" d="M49 34v8m-4-4h8" strokeWidth="1.5" strokeLinecap="round" />
      </>}
    </svg>
  )
}

export function CampaignRoadmap({ deferred = false }: { deferred?: boolean }) {
  const steps = deferred ? STEPS.map(step => step.id === 'launch' ? {
    ...step, when: 'When you’re ready', body: 'Your campaign draft is saved. Connect your account and submit when you’re ready.', tag: 'Campaign saved',
  } : step) : STEPS
  return (
    <section className="campaign-roadmap" aria-labelledby="campaign-roadmap-heading">
      <header className="campaign-roadmap-header">
        <div>
          <p className="campaign-roadmap-eyebrow">The road ahead</p>
          <h3 id="campaign-roadmap-heading">Your next moves<span>.</span></h3>
          <p className="campaign-roadmap-description">A little curiosity. A lot of possibility.</p>
        </div>
        <span className="campaign-roadmap-loop">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M16 7a6 6 0 0 0-10-2L3 8m0-4v4h4m-3 5a6 6 0 0 0 10 2l3-3m0 4v-4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Test. Learn. Repeat.
        </span>
      </header>
      <ol className="campaign-roadmap-steps">
        {steps.map((step, index) => (
          <li key={step.id} className={`campaign-roadmap-step campaign-roadmap-step--${step.id}`}>
            <div className="campaign-roadmap-step-top">
              <span className="campaign-roadmap-number">0{index + 1}</span>
              <span className="campaign-roadmap-when">{step.when}</span>
              {index === 0 && <span className="campaign-roadmap-start">{deferred ? 'Saved' : 'Live now'}</span>}
            </div>
            <StageArt stage={step.id} />
            <div className="campaign-roadmap-step-copy">
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </div>
            <div className="campaign-roadmap-step-footer">
              <span>{step.tag}</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                {index === 3 ? <path d="M15.5 6a6 6 0 1 0 .3 7M16 2.5V7h-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
              </svg>
            </div>
          </li>
        ))}
      </ol>
      <p className="campaign-roadmap-note"><span aria-hidden="true">✦</span> A suggested rhythm. Let your campaign’s results set the pace.</p>
    </section>
  )
}
