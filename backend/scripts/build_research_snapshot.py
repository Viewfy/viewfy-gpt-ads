"""Rebuild the reviewed public research fixture without making network calls.

Inputs in docs/research retain source IDs, observed dates and extraction notes.
Raw scraper responses are evidence, not trusted normalized ads: match domains,
resolve dynamic cards, discard unknown advertisers, and preserve unknown metrics.
"""
from __future__ import annotations
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from meta_library import flatten_ads, keep_ad, library_search_url, parse_kept

STAMP = '2026-09-08'
VERSION = '2026-09-08.2'
RESEARCH = ROOT / 'docs/research'
FIXTURES = ROOT / 'fixtures/superagent'

PRICE = {
 'retellai.com': '$0.07–$0.31 per voice minute depending on configuration; $10 trial credit. Telephony and optional features affect total cost; enterprise custom.',
 'synthflow.ai': 'Enterprise contracts from $30,000 annually; final price depends on volume, telephony, integrations and launch support.',
 'bland.ai': 'Start $0/month + $0.14/min; Build $299/month + $0.12/min; Scale $499/month + $0.11/min. Telephony and transfer charges can apply.',
 'answerconnect.com': 'Entry $350/month for 200 minutes + $49.99 setup; Growth $395 for 300 minutes with no setup fee. Overage, rounding and after-call handling apply.',
 'patlive.com': '$49/month includes no minutes, then $2.99/min. $99 includes 50 minutes; $189 includes 100. Taxes and fees extra; 14-day trial.',
}
META_NAMES = {
 'getsuperagent.com': {'SUPERAGENT', 'SUPERAGENT AI'}, 'sonant.ai': {'Sonant AI'},
 'smith.ai': {'Smith.ai Receptionists'}, 'ruby.com': {'Ruby'}, 'goodcall.com': {'Goodcall'},
 'myaifrontdesk.com': {'My AI Front Desk', 'AI Front Desk', 'Frontdesk'}, 'heyrosie.com': {'Rosie'},
 'retellai.com': {'Retell AI'}, 'synthflow.ai': {'Synthflow', 'Synthflow AI'},
 'bland.ai': {'Bland AI'}, 'answerconnect.com': {'AnswerConnect', 'AnswerConnect Canada'},
 'patlive.com': {'PATLive 24/7 Virtual Receptionists & Live Web Chats'},
}

def read(name):
 return json.loads((RESEARCH / name).read_text())

def write(path, data):
 path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

def as_text(value):
 return '; '.join(value) if isinstance(value, list) else value or ''

def normalize_subject(s):
 p = s['profile']
 profile = {
  'category':p.get('category',''), 'summary':p.get('summary') or p.get('positioning',''),
  'audience':as_text(p.get('audience')), 'positioning':p.get('positioning',''),
  'offer':p.get('offer') or p.get('free_offer') or p.get('primary_cta',''),
  'pricing':PRICE.get(s['domain']) or p.get('pricing_summary') or p.get('pricing',''),
  'cta':p.get('cta') or p.get('primary_cta') or 'See website',
  'differentiators':p.get('differentiators') or p.get('features',[]),
  'limitations':p.get('limitations') or ['Product and outcome claims are advertiser statements; independent ad performance is unavailable.'],
  'source_ids':p.get('source_ids',[]),
 }
 s['pricing_details'] = p.get('pricing') if isinstance(p.get('pricing'),dict) else None
 s['profile'] = profile
 s['kind'] = 'self' if s['domain']=='getsuperagent.com' else 'competitor'
 s['findings'] = [x if isinstance(x,str) else (x.get('finding') or x.get('observation',''))+' '+x.get('implication','') for x in s.get('insights',[])]
 s['other_ads'] = []
 for platform in ['meta','google']:
  checked_url = next((check['url'] for check in s.get('ad_checks',[]) if check.get('platform') == platform and check.get('url')), None)
  s[platform] = {'platform':platform,'status':'unknown','error':None,'ads':[], 'source_url':checked_url or (library_search_url(s['domain']) if platform=='meta' else f"https://adstransparency.google.com/?region=anywhere&domain={s['domain']}")}
 for ad in s.pop('ads',[]):
  ad['platform']=ad['platform'].lower()
  ad['is_active'] = ad.get('is_active')
  ad['status']='active' if ad['is_active'] is True else 'inactive' if ad['is_active'] is False else 'unknown'
  note = ad.get('verification_note') or ' '.join(ad.get('notes') or [])
  if ad.get('body_text_type') == 'paraphrase_of_observed_creative':
   note = 'Body is a researcher summary of the observed creative, not a verbatim transcription. '+note
  elif ad.get('copy_is_excerpt'):
   note = 'Copy is an excerpt of the visible creative. '+note
  if ad.get('advertiser_relationship')=='unverified_third_party':
   note = 'Third-party advertiser; relationship to the brand is unverified. Excluded from brand-owned campaign claims. '+note
  if ad.get('link_url_kind')=='display_url':
   note += ' Landing URL transcribed from display text; final click destination unverified.'
  ad['verification_note']=note.strip()
  dest = s[ad['platform']]['ads'] if ad['platform'] in ('meta','google') else s['other_ads']
  dest.append(ad)
 for c in s.get('campaign_evidence',[]):
  src=next(x for x in s['sources'] if x['id']==c['source_id'])
  s['other_ads'].append(dict(id=c['id'],platform=c['platform'],advertiser=c['advertiser'],headline=None,body='Historical creator-led Spark Ads campaign for business-owner signups. TikTok supplies the embedded creative; exact ad ID and full script are unavailable.',video_url=c.get('creative_video_url'),format='video',is_active=None,started_at=None,ended_at=None,observed_at=STAMP,source_url=src['url'],source_id=src['id'],evidence_type='publisher_confirmed_campaign',verification_note='Platform case study confirms paid distribution. Campaign-level historical outcomes are not metrics for this individual creative.'))
 return s

def main():
 subjects=[normalize_subject(s) for name in ['superagent-sonant.json','receptionists.json','voice-answering.json'] for s in read(name)['subjects']]
 by_domain={s['domain']:s for s in subjects}
 rejected=[]
 for batch in read('meta-scrape.json'):
  domain=batch['domain']; s=by_domain.get(domain)
  if not s: continue
  added=[]
  for raw in flatten_ads(batch.get('raw',[])):
   a=parse_kept(raw)
   if not a:continue
   if not keep_ad(raw,domain) or a.page_name not in META_NAMES[domain]:
    rejected.append({'query_domain':domain,'id':a.archive_id,'advertiser':a.page_name,'reason':'Destination or exact advertiser identity did not match.'});continue
   existing=next((x for x in s['meta']['ads'] if x['id']==a.archive_id),None)
   # A compact exact excerpt, with the full source reachable through its ad ID.
   head=a.headline or ''
   allowance=max(0,25-len(head.split())-len((a.cta or '').split()))
   words=(a.body or '').split()
   excerpt=' '.join(words[:allowance])+('…' if len(words)>allowance else '')
   source_id=(existing or {}).get('source_id') or 'meta-'+a.archive_id
   summary='Ad retrieved directly from Meta Ad Library via Apify; outgoing destination and advertiser matched. '
   if domain=='sonant.ai':summary+='Targets P&C agency receptionist hiring and protecting CSR time.'
   elif domain=='smith.ai':summary+='Promotes legal intake or recovering marketing investment from missed calls.'
   elif domain=='heyrosie.com':summary+='Promotes rapid setup, answering coverage, trial or calendar booking.'
   elif domain=='bland.ai':summary+='Uses customer examples and scale claims to sell enterprise voice automation; figures are advertiser claims.'
   elif domain=='answerconnect.com':summary+='Emphasizes live human answering; Canada advertiser records retain their regional identity.'
   elif domain=='patlive.com':summary+='Promotes trial, service continuity and US-based human coverage.'
   row=dict(id=a.archive_id,platform='meta',advertiser=a.page_name,headline=a.headline,body=excerpt,cta=a.cta,image_url=a.image_url,video_url=a.video_url,link_url=a.link_url,format=a.display_format,started_at=a.started_at,ended_at=a.ended_at,last_shown_at=a.last_shown_at,is_active=a.is_active,status='active' if a.is_active is True else 'inactive' if a.is_active is False else 'unknown',source_url=a.library_url,source_id=source_id,page_id=a.page_id,publisher_platforms=a.platforms,evidence_type='ad_library',observed_at=STAMP,impressions=None,spend=None,clicks=None,ctr=None,conversions=None,verification_note='Exact copy excerpt; open the source for complete copy. '+summary,copy_is_excerpt=True,creative_fingerprint=hashlib.sha256(((a.headline or '')+' '+(a.body or '')).encode()).hexdigest()[:16],variant_count=len((a.extra or {}).get('variants') or []) or 1)
   if existing: existing.update(row)
   else:s['meta']['ads'].append(row)
   added.append(a.archive_id)
   if not any(x['id']==source_id for x in s['sources']):
    s['sources'].append(dict(id=source_id,url=a.library_url,title=f"{s['name']} · Meta ad {a.archive_id}",kind='ad_library',observed_at=STAMP,summary=summary,quotes=[]))
  s['ad_checks'].append(dict(platform='meta',url=library_search_url(domain),status='ads_observed' if added else 'no_verified_matches' if batch['status']!='error' else 'error',checked_at=STAMP,note=f"Apify keyword sample, all countries / all statuses: {len(added)} advertiser-matched records retained. Name collisions and unrelated destinations excluded. This sample cannot establish zero advertising."))
 for s in subjects:
  for side in ['meta','google']:
   block=s[side]
   block['ads']=list({a['id']:a for a in block['ads']}.values())
   block['status']='ok' if block['ads'] else 'unknown'
  s['ad_checks']=[{**c,'checked_at':c.get('checked_at',STAMP)} for c in s.get('ad_checks',[])]
  # Research observations remain separate from generated ad concepts.
  s.pop('insights',None)
 all_ads=[a for s in subjects for a in s['meta']['ads']+s['google']['ads']+s['other_ads']]
 stats={'subjects':len(subjects),'competitors':len(subjects)-1,'ad_records':len(all_ads),'by_platform':dict(Counter(a['platform'] for a in all_ads)),'sources':sum(len(s['sources']) for s in subjects),'brand_matched_meta_records':sum(len(s['meta']['ads']) for s in subjects),'meta_unique_copy_fingerprints':len({a['creative_fingerprint'] for a in all_ads if a.get('creative_fingerprint')}),'rejected_meta_matches':len(rejected)}
 library=dict(status='ready',error=None,source='public_snapshot',research_version=VERSION,researched_at=STAMP,methodology='Public research captured 8 September 2026. Meta was sampled using Apify and advertiser-page inspection; Google creatives were read in Ads Transparency Center. Website, pricing, publisher campaign evidence and independent ChatGPT ad captures retain separate source types. Ad counts are saved records, including repeated messages and historical ads; they are not campaign totals. Missing fields remain unknown. No private spend, CTR, conversions or ROI were obtained.',coverage=[f"{stats['subjects']} brands · {stats['ad_records']} saved ad/campaign records · {stats['sources']} source records",'Worldwide source scope; advertiser region, activity and dates are recorded where available.'],analysis_stats=stats,subjects=subjects)
 write(FIXTURES/'library.json',library)
 write(RESEARCH/'excluded-matches.json',{'observed_at':STAMP,'records':rejected})
 print(json.dumps(stats))

if __name__=='__main__':main()
