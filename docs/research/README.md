# Public competitor research — 8 September 2026

Replaced the illustrative Superagent ad library with **79 sourced ad/campaign records across 12 brands**, supported by **104 source records**. Campaign launch requires a verified Ads Manager account and successful Ads API submission. These research records are captured public observations, not a live performance feed.

The requested “Sonnant” was interpreted as **Sonant (sonant.ai)**, the insurance AI receptionist. [Sonnant (sonnant.com)](https://sonnant.com/) is a separate audio advertising marketplace and was excluded from the insurance comparison. The records retain the identity note.

## Coverage

| Brand | Meta ads | Google ads | Other evidence |
|---|---:|---:|---|
| SUPERAGENT | 0 | 4 | Website, product, integration and pricing pages |
| Sonant | 8 | 2 | Insurance workflows and AMS integrations |
| Smith.ai | 7 | 0 | 2 independent ChatGPT ad captures |
| Ruby | 0 | 2 | Live receptionist plans |
| Goodcall | 0 | 2 | 1 TikTok-confirmed paid campaign with original video |
| My AI Front Desk | 0 | 1 | Voice-plan eligibility and overage terms |
| Rosie | 12 | 0 | Trial, appointment and plan-gating evidence |
| Retell AI | 0 | 3 | Component-based voice pricing |
| Synthflow | 0 | 3 | Enterprise contracts and competitor comparison creative |
| Bland | 12 | 3 | 2 publisher-confirmed historical newsletter ads |
| AnswerConnect | 6 | 3 | Human answering and minute-billing terms |
| PATLive | 3 | 3 | Trial, included minutes and overage terms |

Zero means **no verified record saved for that channel**, not no advertising. Google was checked worldwide, with any-time filters. Meta used all-country keyword samples and exact advertiser-page inspection. Some records are historical. The 48 saved Meta records include repeated messages; 47 scraper-enriched records have 29 distinct exact-copy fingerprints. These are neither campaign totals nor 79 distinct strategies.

## Findings that changed the brief

- **Insurance reception is contested.** [Sonant's Meta ad](https://www.facebook.com/ads/library/?id=922158907633073) speaks directly to P&C agency hiring and protecting CSR time. Superagent should test a concrete insurance workflow rather than claim nobody serves that buyer.
- **The paid-lead-loss angle already exists.** [Smith.ai's Meta creative](https://www.facebook.com/ads/library/?id=1423368539639995) addresses wasted marketing investment when calls go unanswered. Specific workflow proof is a better test than an unsupported uniqueness claim.
- **Superagent already promotes outbound.** Its [Google image creative](https://adstransparency.google.com/advertiser/AR03298006370422358017/creative/CR11501690773921857537?region=anywhere) promotes outbound automation. Test quote follow-up through the producer handoff against the generic missed-call message.
- **Human reassurance is a competing proposition.** [AnswerConnect's named-receptionist creative](https://adstransparency.google.com/advertiser/AR16276437828492066817/creative/CR08714765316787273729?region=anywhere) makes human service tangible. A call example and clear escalation path are useful test directions.
- **Price comparisons need a workload.** [PATLive's $49 plan](https://www.patlive.com/pricing/) includes zero minutes; [Goodcall](https://www.goodcall.com/pricing) bills distinct callers; [Rosie](https://www.heyrosie.com/pricing) gates direct booking above its entry tier. Base subscription prices cannot establish savings.
- **Fix Superagent's public pricing discrepancy.** The [pricing page](https://getsuperagent.com/pricing) lists restricted Starter at $299 while the [inbound FAQ](https://getsuperagent.com/inbound-ai-agent) says $249. This snapshot does not determine the actual checkout charge.
- **Comparison intent is being advertised against.** [Synthflow's Retell review ad](https://adstransparency.google.com/advertiser/AR02529980481760395265/creative/CR10933541917207560193?region=anywhere) supports testing a sourced Superagent/Sonant workflow comparison.
- **ChatGPT cannot be called empty.** [Two](https://www.chatgptadlibrary.com/ad/13532) [Smith.ai captures](https://www.chatgptadlibrary.com/ad/187158) appear in an independent archive. These are third-party observations and do not establish current delivery or complete market coverage.

The app includes nine evidence-linked findings, including the repeated-message analysis. Recommendations are proposed tests, not demonstrated performance results.

## Provenance and limitations

Every normalized ad has an exact source link, evidence type, observed date and source identifier. Unknown spend, impressions, clicks, CTR and conversions remain null. Advertiser claims in creative copy are not measured outcomes. Google “last shown” is separate from first-seen date, campaign end and current activity. Meta dynamic cards retain actual available copy and media instead of product-template placeholders. Exact excerpts and researcher paraphrases are labeled; the source links expose full originals.

Goodcall's two Google ads are registered to Digital Funda and Creation Place Development Limited. They match the product domain but their brand relationship is unverified; they are labeled and excluded from brand-owned pattern analysis. AnswerConnect Canada retains its regional advertiser identity. Ruby's old callruby.com domain redirects to ruby.com and remains an alias for saved briefs. Frontdesk remains at myaifrontdesk.com; frontdesk.com is unrelated. Nineteen irrelevant Meta matches were excluded, including an influencer mentioning Synthflow.

Meta image/video CDN URLs can expire. Missing media renders an explicit unavailable state rather than stock imagery. The source link remains available. Publisher-confirmed campaigns, independent ad captures and website intelligence are displayed separately from library creatives.

**Superagent Meta follow-up:** the user reported seeing ads in Meta Ad Library. On rechecking, the website-linked `@getsuperagent` advertiser (page `677644648769982`) returned no records in the worldwide browser check and US scraper check. The exact reported ad remains unresolved. Meta stays visible as unverified, with the checked advertiser link; zero collected records must not be presented as proof of zero advertising. The Your channels inspector now renders the actual saved creative cards, including the four Google records that previously appeared only as a count.

## Rebuild and verification

### Your channels

The separate public-channel snapshot contains **21 records across five channels**: ten articles from [The Insurance SUPERAGENT](https://news.getsuperagent.com/), three LinkedIn posts/event invitations, two YouTube links (a channel profile and launch keynote), three website resources, and three company-issued press releases. Every record includes a direct source URL and observation date. Publication dates appear only when verified. These records complement the saved Google ads and Meta source check; they do not count as paid ad records.

The [3.0 product page](https://getsuperagent.com/3-0) links the YouTube keynote. The company's [Business Wire release](https://www.businesswire.com/news/home/20260811522053/en/SUPERAGENT-AI-3.0-Launches-the-AI-Business-Partner-for-Insurance-Agencies-Available-to-the-Public-Today) identifies its YouTube channel. Direct YouTube playback was not verified. Company press releases and case-study results are labeled as company-published material, not independent editorial coverage or measured advertising outcomes. No social reach, traffic, spend, or conversion totals were inferred.

Reviewed inputs are `superagent-blog-channels.json` and `superagent-other-channels.json`. Rebuild with `.venv/bin/python backend/scripts/build_public_channels.py`; this writes `fixtures/superagent/channels.json` without network calls. The app adds the snapshot to matching Superagent runs, preserving paid research, edited creatives, campaign settings, and custom channel evidence. Other businesses never inherit these records. Re-research the sources and increment the snapshot version when refreshing the data; this is not an automatic recrawl.

Reviewed inputs:

- `superagent-sonant.json`, `receptionists.json`, `voice-answering.json`: browser and website findings.
- `meta-scrape.json`: original Apify responses, including dynamic creative cards.
- `superagent-meta-page.json`: exact official Facebook-page check, no creatives returned.
- `superagent-meta-recheck.json`: follow-up US advertiser-page scraper response, no creatives returned.
- `excluded-matches.json`: rejected advertiser/destination matches.

From the repository root:

```sh
.venv/bin/python backend/scripts/build_research_snapshot.py
.venv/bin/python backend/scripts/build_public_channels.py
PYTHONPATH=backend pytest backend/tests -q
node --test frontend/tests/mindmap-data.test.mjs
npm --prefix frontend run build
```

Rebuilding normalizes the reviewed inputs into `fixtures/superagent/library.json` without external calls. `fixtures/superagent/run.json` holds the separately reviewed business map, cited insights and proposed concepts. Refresh the observed dates and both artifacts when doing new research. It is not an automatic recrawl or recurring monitor.

Saved research snapshots upgrade on read. The complete legacy default competitor set gains Sonant; custom selections and live research are preserved. Ruby aliases remain selected, and generation/launch state and edited creative copy are retained.

### Buyer questions

`frontend/src/lib/buyer-research.ts` contains eight public discussion records collected on 8 September 2026. Two discuss insurance agencies directly; the rest cover adjacent small-business reception, booking, pricing, and service comparisons. Each record links to the original Reddit or Insurance Forums post. Titles and summaries are paraphrased, and experiences and identities are self-reported. Topic counts represent saved questions, not demand volume or verified buyers. Unrelated businesses receive explicitly labeled sample questions instead of this industry-specific evidence.

The product map now includes all company research and insights. “Research & insights” opens the full evidence within Your product. The separate competitor wizard step is retired; existing research runs resume in the product map. AI Answers uses expandable topics, questions, and engine checks; an uncollected response remains “Not checked.”
