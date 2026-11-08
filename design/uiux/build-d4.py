from pathlib import Path
import json,html
p=Path(__file__).parent
frames=[]
# Prices here are explicit static server-response fixtures from CTO §7; no thresholds inferred by UI.
F={'low':98800,'high':105200,'median':102000,'fairLow':86700,'fairHigh':112200}
def money(n):
 s=str(int(n));return 'Rs '+(s[:-5]+','+s[-5:-3]+','+s[-3:] if len(s)>5 else f'{int(n):,}')
def num(n):return '<bdi class="num">'+money(n)+'</bdi>'
def btn(t,c='',attrs=''):return f'<button class="{c}" {attrs}>{t}</button>'
def banner(t):return '<aside class="banner"><span class="info" aria-hidden="true">ⓘ</span>'+t+'</aside>'
def pricefield(label='Asking price · optional',id='asking'):
 return '<div><label for="'+id+'">'+label+'</label><div class="price-field"><span class="prefix" aria-hidden="true">Rs</span><input id="'+id+'" inputmode="decimal" placeholder="1,15,000" aria-label="'+label+', Pakistani rupees"></div></div>'
def rangebar(asking=115000,verdict='HIGH',f=F,split=False):
 lo,hi,med,fl,fh=[f[k] for k in ['low','high','median','fairLow','fairHigh']]
 minimum=min(lo,fl,*([asking] if asking is not None else []));maximum=max(hi,fh,*([asking] if asking is not None else []));padding=(maximum-minimum)*.05;start=minimum-padding;end=maximum+padding
 pos=lambda n:(n-start)/(end-start)*100
 v=None if asking is None else max(0,min(100,pos(asking)));outside='' if asking is None else 'above' if asking>hi else 'below' if asking<lo else 'inside'
 sr=f'Example. Most listings: {money(lo)} to {money(hi)}; dark segment. Market median {money(med)}; Median tick. Fair range {money(fl)} to {money(fh)}; tinted zone labelled Fair. Numeric axis left to right, uniform scale.'+(f' Asking {money(asking)}, {outside} the listings range, plotted at its true position.' if asking is not None else ' No asking price; no marker.')+(' No branch verdict before PTA selection.' if split else '')
 marker=''
 if v is not None:
  align='end' if v>70 else 'start' if v<25 else ''
  marker=f'<span class="ask-marker" style="inset-inline-start:{v:.3f}%" aria-hidden="true"></span><span class="ask-value {align}" style="inset-inline-start:{v:.3f}%" aria-hidden="true">{num(asking)}</span>'
 return '<div class="range-v2" dir="ltr" role="img" aria-label="'+html.escape(sr,quote=True)+'"><div class="range-axis" aria-hidden="true"><div class="fair-zone" style="inset-inline-start:'+f'{pos(fl):.3f}%;inline-size:{pos(fh)-pos(fl):.3f}%'+ '"><span class="fair-tag">Fair</span></div><div class="overflow-line"></div><div class="market-track" style="inset-inline-start:'+f'{pos(lo):.3f}%;inline-size:{pos(hi)-pos(lo):.3f}%'+ '"></div><span class="median-tick" style="inset-inline-start:'+f'{pos(med):.3f}%'+ '"><span class="median-label">Median</span></span>'+marker+'</div><p class="most-listings">Most listings: '+num(lo)+'–'+num(hi)+'</p><p class="range-caption">Market median '+num(med)+'</p><p class="range-caption">Fair range: '+num(fl)+'–'+num(fh)+'</p></div>'
header='<header><a class="wordmark" href="home.html" aria-label="Kitne Ka home">Kitne Ka</a><span class="example-badge">Example</span><button class="chip" aria-label="Language: English">EN</button></header>'
product='<div><h1>Example: iPhone 13 128GB</h1><p class="muted">New (sealed) · PTA approved</p></div>'
notes_base=['Static example fixture only; not a live market assessment. The minimal Example badge remains in clean exports.','Identity and PTA/condition/price defaults are assumptions awaiting Founder ratification.','Framework-agnostic HTML/CSS. Proposed React/Vite + Hono (TypeScript) awaits Founder approval.']
def save(folder,name,body,width=360,share=False,rtl=False,extra_notes=None,classes=''):
 path=p/folder/(name+'.html');path.parent.mkdir(exist_ok=True,parents=True)
 if name=='confirm-option-b':body=body.replace('placeholder="1,15,000"','placeholder="115,000"')
 n=notes_base+(extra_notes or [])
 if name.startswith('results-pta-split'):n.append('Choosing PTA with asking_price null: passing branch -> No-price layout (range + Fair band + Add asking price); failed branch -> Insufficient data / NO_STORED_RANGE, never the other branch numbers. CTO v0.5 confirms both transitions; no new collection or other-branch substitution.')
 if 'range-v2' in body:n.append('C1: uniform axis domain includes server Fair bounds, listings range and asking, plus 5% padding. Most listings text replaces endpoint labels. Numeric axis stays LTR; validate with Urdu-reading users before Urdu launch.')
 if name.startswith('home') or name.startswith('confirm') or name.startswith('results'):n.append('Accessibility implementation: see a11y/README.md for focus order, roles, live regions, 48px targets, range text equivalent and reduced motion. Design intent only, not an audit.')
 annotations='<aside class="annotations" aria-label="Design annotations"><h2>D4 review notes</h2><ol>'+''.join('<li>'+html.escape(x)+'</li>' for x in n)+'</ol><a href="../handoff/README.md">Handoff</a></aside>'
 script='''<script>document.querySelector('.annotation-toggle').onclick=()=>{const on=document.body.classList.toggle('annotated');document.querySelector('.annotation-toggle').setAttribute('aria-expanded',on)};</script>'''
 if name.startswith('confirm'):
  from bs4 import BeautifulSoup
  parsed=BeautifulSoup(body,'html.parser')
  for a in list(parsed.select('a')):
   if a.get_text().strip() in ['Options A','Options B']:a.decompose()
  for el in list(parsed.select('p.muted')):
   if el.get_text().startswith('If Used:'):el.decompose()
  body=str(parsed)
 path.write_text('<!doctype html><html lang="en" dir="'+('rtl' if rtl else 'ltr')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(name)+'</title><link rel="stylesheet" href="../design-system/components.css"><body style="--frame-width:'+str(width)+'px"><main class="'+('share-card' if share else 'screen')+' '+classes+'"'+(' dir="rtl"' if rtl else '')+'>'+body+'</main><button class="annotation-toggle" aria-expanded="false">Design notes</button>'+annotations+script+'</body></html>')
 frames.append(dict(folder=folder,name=name,width=width,share=share,rtl=rtl))
entries='<div class="home-entries stack">'+''.join('<button class="entry"><span class="icon" aria-hidden="true">'+i+'</span><span><strong>'+a+'</strong><span class="desc">'+d+'</span></span></button>' for i,a,d in [('▧','Upload Screenshot','From a photo you can use'),('↗','Paste Product Link','Check a listing you found'),('⌕','Search Product','Find a model by name or specs')])+'</div>'
home=header+'<div><h1>Know the real market price.</h1><p class="muted">Before you buy or sell.</p></div>'+entries+'<section><h2>Recent checks</h2><div class="recent-row"><a class="recent-main" href="recent-snapshot.html"><strong>Example: iPhone 13 128GB</strong><br><span class="muted">Checked 3 days ago · stored snapshot</span></a>'+btn('Check again','text-button')+'</div>'+btn('Clear recent checks','text-button quiet')+'</section><a href="#privacy">Privacy</a><p id="privacy" class="muted">[Privacy line, pending Security policy]</p>'
def confirm(optionB=False):
 opts=['New','Used'] if optionB else ['New','Used','Refurbished','Kit / Open box']
 return header+'<h1>Confirm details</h1><div class="confirm-form stack"><section class="card summary"><h2>Example: iPhone 13</h2><div class="row"><p class="muted">Phones · Apple · 128GB<br>Detected</p>'+btn('Edit','text-button', 'aria-label="Edit product details"')+'</div><label for="model">Model · Please check</label><input id="model" value="Example: iPhone 13" aria-describedby="model-hint"><span class="sr" id="model-hint">Please check this detected field.</span></section><fieldset style="border:0;padding:0;margin:0"><legend>PTA status</legend><div class="segments" role="group" aria-label="PTA status">'+''.join(btn(t,'chip '+('segment-focus' if t=='PTA approved' else ''),'aria-pressed="'+('true' if t=='PTA approved' else 'false')+'"') for t in ['PTA approved','Non-PTA','Not sure'])+'</div></fieldset><section><div class="row"><h2>Condition</h2><a href="'+('confirm.html' if optionB else 'confirm-option-b.html')+'">'+('Options A' if optionB else 'Options B')+'</a></div><div class="segments" role="group" aria-label="Condition">'+''.join(btn(t,'chip','aria-pressed="'+('true' if t=='New' else 'false')+'"') for t in opts)+'</div>'+('<p class="muted">If Used: Like new / Good / Fair</p>' if optionB else '')+'</section>'+pricefield()+btn('+ Add city (optional)','text-button add-city')+'<div class="sticky"><p id="disabled-reason">Confirm the model marked Please check.</p>'+btn('Check price','primary','disabled aria-describedby="disabled-reason"')+'</div></div>'
def confidence(low=False,count=5):return '<section class="confidence"><strong>'+('Low' if low else 'High')+' confidence</strong><p>'+str(count)+' comparable listings · newest 8 Nov 2026, PKT</p><a href="confidence-info.html">How confidence works</a></section>'
def evidence(count=5):return '<section class="flat"><h2>Evidence · '+str(count)+' listings used</h2><div class="source"><a href="https://example.invalid">Example source ↗</a><p>'+num(102000)+' · 128GB · New (sealed)</p><p>Example city · observed 8 Nov 2026, PKT<br>Retrieved 9 Nov 2026, PKT</p></div>'+btn('Show all '+str(count)+' sources','text-button')+'<p class="muted">1 excluded: non-PTA variant.</p></section>'
newused='<section class="flat"><h2>New vs used</h2><p>New-market '+num(98800)+'–'+num(105200)+'</p><p>Used-market: unavailable</p><p>Verified retail: unavailable</p></section>'
sticky='<div class="sticky"><div class="row">'+btn('Share','primary')+btn('Check another')+'</div></div>'
def verdictblock(kind='HIGH',low=False,price=True,threshold=False):
 asking={'HIGH':115000,'FAIR':108000,'UNUSUALLY_LOW':85000}[kind];label={'HIGH':'↑ High','FAIR':'✓ Fair','UNUSUALLY_LOW':'↓ Unusually Low'}[kind];tone={'HIGH':'high','FAIR':'fair','UNUSUALLY_LOW':'low'}[kind]
 if not price:tone='insufficient'
 v='<span class="indicative-chip">Indicative</span>' if low and price else ''
 if price:v+='<h2 class="verdict-title">'+label+'</h2><p>Asking price</p><p class="hero">'+num(asking)+'</p>'
 else:v+='<h2>Market range</h2>'
 v+=rangebar(asking if price else None,kind, f={'low':98000,'high':106000,'median':102000,'fairLow':86700,'fairHigh':112200} if low else F)
 if price:
  diff= 'Rs 13,000 (12.7%) above the market median' if kind=='HIGH' else 'Rs 6,000 (5.9%) above the market median' if kind=='FAIR' else 'Rs 17,000 (16.7%) below the market median'
  if threshold:diff='just over 10% above the market median'
  v+='<p><strong>'+diff+'</strong></p>'
  if kind=='FAIR':v+='<p>Fair · above most listings found</p>'
  if kind=='UNUSUALLY_LOW':v+=banner('Verify condition, PTA/lock status and seller before paying')
 else:v+=pricefield('Add asking price for a verdict')+btn('Recheck verdict only','primary')
 return '<section class="card verdict-block '+tone+(' indicative' if low and price else '')+' stack" style="--verdict-color:var(--color-'+tone+')">'+v+'</section>'
def result(kind='HIGH',low=False,price=True,threshold=False):return header+product+'<div class="content"><div class="left-column">'+(banner('Low confidence: few comparable listings. Check the evidence before deciding.') if low else '')+verdictblock(kind,low,price,threshold)+confidence(low,3 if low else 5)+'<p>Estimate based on asking prices, not completed sales.</p>'+newused+'</div><div class="right-column">'+evidence(3 if low else 5)+'<p class="muted">Checked 9 Nov 2026, PKT. Estimate, not a guarantee.</p></div></div>'+sticky
save('hifi','home',home,extra_notes=['Entry glyphs 24px in 44px accent-soft tiles. Entire recent row opens dated stored snapshot; Check again is separate action.'])
for name,b in [('confirm',False),('confirm-option-b',True)]:save('hifi',name,confirm(b),extra_notes=['Condition A/B and number formatting remain swappable assumptions. Rs prefix, muted lakh placeholder shown here; Western alternative 115,000 + 1.15 lakh helper.','Selected and plum focus states shown; static focus preview is not automatic browser focus. Disabled only for uncertain required non-PTA field; skipped PTA normalises NOT_SURE per CTO, subject Founder/DD ratification.','City expands inline when implemented; model confirmation and live validation are not wired in this static frame.'])
for name,kind,low,price in [('results-full','HIGH',False,True),('results-full-low','HIGH',True,True),('results-no-price','HIGH',False,False),('results-no-price-low','HIGH',True,False),('results-fair','FAIR',False,True),('results-unusually-low','UNUSUALLY_LOW',False,True)]:save('hifi',name,result(kind,low,price),extra_notes=['Server fixture: P10 98,800; P90 105,200; market median 102,000; Fair band 86,700–112,200. Fair thresholds are never derived in UI.','High fixture: asking 115,000, diff_absolute_minor 1300000, diff_percent 0.127451; confidence 82; 5 included, 1 non-PTA exclusion. LOW modifiers use separately labelled illustrative 3-listing fixture.','Source URL is example.invalid; no live offers. Range method moves to confidence sheet. CTA classification is local stored evidence only; stale response requires explicit full check.'])
# Threshold example has a coherent own asking value and position, not the main High fixture.
th=result('HIGH',False,True,True).replace(num(115000),num(112241)).replace('Rs 1,15,000','Rs 1,12,241')
save('hifi','results-threshold-rounding',th,extra_notes=['Threshold fixture: asking 112241, median 102000, diff_percent 0.1004 (rounded for fixture display), server verdict HIGH. Intl display would round to 10.0%; UI instead says just over 10% above the market median. Geometry label/position adjusted to 112241.'])
# replace that frame's bar with an accurate geometry for this asking amount
f=p/'hifi/results-threshold-rounding.html';s=f.read_text();s=s.replace(rangebar().replace(num(115000),num(112241)).replace('Rs 1,15,000','Rs 1,12,241'),rangebar(112241));f.write_text(s)
def split(one=False):
 b='<section class="flat"><h2>PTA approved</h2>'+rangebar(None,split=True)+confidence(True,5)+'</section>'
 if one:b+='<section class="flat"><h2>Non-PTA</h2><p>Insufficient data for this branch: no fresh permitted evidence.</p><p>No range shown.</p></section>'
 else:
  f={'low':70000,'high':76000,'median':73000,'fairLow':62050,'fairHigh':80300}
  b+='<section class="flat"><h2>Non-PTA</h2>'+rangebar(None,f=f,split=True)+confidence(True,3)+'</section>'
 return header+'<h1>Example: iPhone 13 128GB</h1><p>New (sealed) · PTA not sure</p>'+banner('PTA unconfirmed. These are separate exploratory ranges, not one combined estimate.')+'<section class="flat"><h2>Confirm PTA status to get a verdict</h2><div class="segments">'+btn('PTA approved','chip')+btn('Non-PTA','chip')+'</div><p>Asking price '+num(115000)+'</p></section>'+b+sticky
save('hifi','results-pta-split',split(),extra_notes=['No global market median, combined range, price verdict or Indicative label. Fair bands informational only. Non-PTA values are clearly fictional UI branch fixtures, not CTO market facts.','Selecting PTA reclassifies that retained valid branch; missing branch returns NO_STORED_RANGE, never uses the other branch.'])
save('hifi','results-pta-split-one',split(True),extra_notes=['Only APPROVED branch passes. Missing branch explanation is shown without fabricated numbers.'])
save('hifi','results-insufficient',header+product+'<h2>Insufficient market data</h2>'+banner('Only 2 comparable listings met the checks. There is not enough evidence for an estimate.')+'<p class="muted">Confidence: unavailable · 2 comparable listings · newest 8 Nov 2026, PKT</p>'+btn('Edit details','primary')+btn('Try nearby variant')+'<a href="share-preview.html">Share “Not enough data”</a>',extra_notes=['No price numbers, headline range, retail anchor, verdict or confidence percentage. Diagnostic counts only. No Check again later.'])
save('hifi','results-error',header+product+'<h2>Could not complete this check</h2>'+banner('The service could not evaluate the evidence. Your inputs are kept.')+btn('Retry','primary')+btn('Back to Confirm')+'<p class="muted">Evidence summary unavailable because the check failed.</p>',extra_notes=['Error before all domain outcomes, outside verdict enum. No saved Recent entry or Share. Never invent confidence/count/newest date for a failed operation.'])
save('hifi','offline',header+'<h1>No connection</h1>'+banner('Your inputs are kept. We will try again when you are back online.')+btn('Retry','primary'),extra_notes=['CLIENT_OFFLINE local state; GET existing job first, then versioned advance with same idempotency key. One automatic retry per reconnect; respect backoff. Never replay policy/validation errors.'])
save('hifi','search-empty',header+'<h1>Search product</h1><label for="q">Brand, model or specs</label><input id="q" value="Example: unmatched model"><h2>No matches</h2><p>Check spelling. Try brand + model, e.g. iPhone 13 128GB.</p>'+btn('Browse categories')+btn('Edit query','text-button'),extra_notes=['GET/products returns 200 empty NO_MATCHES, not 404. Keep query and chips.'])
save('hifi','link-fallback',header+'<h1>Cannot read this link</h1><label for="url">Product URL</label><input id="url" value="https://example.invalid/item">'+banner('This source does not permit automated extraction.')+btn('Upload a screenshot','primary')+btn('Enter details manually'),extra_notes=['NOT_PERMITTED distinct from SOURCE_NOT_SUPPORTED/FETCH_FAILED. No prohibited fetch. Screenshot fallback requires policy/rights clearance; if uncleared disable route and offer manual facts.'])
save('hifi','recent-snapshot',header+'<h1>Stored snapshot</h1>'+product+banner('Checked 3 days ago. This is a stored result, not a current assessment.')+verdictblock()+btn('Check again','primary'),extra_notes=['Check again starts fresh assessment explicitly; not lightweight classify. Local record only, no image or capability secrets. Relative age is an example; production derives from stored checked_at.'])
save('hifi','share-failed',header+'<h1>Could not generate share image</h1>'+banner('Your public snapshot link is still available.')+btn('Copy link','primary')+'<p>https://example.invalid/s/example</p>',extra_notes=['POST/shares persists snapshot first, image_status FAILED with valid url. Download disabled. If snapshot itself fails there is no URL; show Retry instead. No share actually created by this design task.'])
save('hifi','confidence-info',header+'<h1>How confidence works</h1><section class="flat"><h2>Evidence quality, not a guarantee</h2><p>Based on comparable count, source independence, freshness and matching quality.</p><p>Market range uses P10–P90 for 5 or more listings; min–max for 3–4.</p><p>Fair band is a policy range around the market median, separate from the listings range. Verdicts use the server’s Fair band, never the range endpoints.</p></section>'+btn('Close'),extra_notes=['Confidence score is not a probability of correctness. Use versioned methodology strings.'])
save('hifi','share-preview',header+'<h1>Share assessment</h1><p>A public, dated snapshot will be created. Anyone with its link can read it.</p>'+banner('Screenshot, seller name, phone number and target listing URL are excluded by default.')+'<label><input type="checkbox" style="inline-size:24px;min-block-size:24px"> Include asking price</label>'+btn('Create public link','primary')+'<p>[Privacy line, pending Security policy]</p>',extra_notes=['Explicit confirm_public consent before POST/shares; native Web Share gesture only after URL exists. No external action implemented by this preview.'])
def share(low=False,compact=False):
 body='<header class="row"><span class="wordmark">Kitne Ka</span><span class="example-badge">Example</span></header><div><h1>Example: iPhone 13 128GB</h1><p>New (sealed) · PTA approved</p></div><section class="card verdict-block stack'+(' indicative' if low else '')+'" style="--verdict-color:var(--color-high)">'+('<span class="indicative-chip">Indicative</span>' if low else '')+'<h2 class="verdict-title">↑ High</h2>'+ (banner('Low confidence · few comparable listings') if low else '')+'<p class="price">'+num(115000)+'</p>'+rangebar(f={'low':98000,'high':106000,'median':102000,'fairLow':86700,'fairHigh':112200} if low else F)+'<p class="supporting-line">Rs 13,000 (12.7%) above the market median</p><p class="evidence-line">'+('3' if low else '5')+' comparable listings · '+('Low' if low else 'High')+' confidence<br>Newest 8 Nov 2026, PKT</p></section><footer><p>Checked 9 Nov 2026, PKT</p><p>kitneka URL [placeholder]</p><p>Estimate, not a guarantee.</p></footer>'
 return body
for name,low,compact in [('share-normal',False,False),('share-indicative',True,False),('share-normal-fallback',False,True),('share-indicative-fallback',True,True)]:save('hifi',name,share(low,compact),1080,True,extra_notes=['Asking price 120px; market track 28px; overflow marker 28px with white ring. Evidence inside verdict block; footer pinned to bottom.','Real mid-range Android + WhatsApp chat/Status check PENDING human evidence. Fallback compact crop drops supporting difference line, not product/verdict/price/date/disclaimer.','All numbers are fictional examples. Low variant has separate 3-listing modifier fixture, not a claim that the 82-score CTO example is Low.'],classes='compact-share' if compact else '')
for w in [768,1280]:
 for name,body in [('home',home),('confirm',confirm()),('results-full',result())]:save('responsive',name+'-'+str(w),body,w,extra_notes=['Responsive '+str(w)+'px review. Results uses verdict left and sources right; no new data or decisions.'],classes='responsive '+('home' if name=='home' else ''))
for name,body in [('confirm',confirm()),('results-full',result())]:save('rtl',name+'-rtl',body,rtl=True,extra_notes=['RTL LAYOUT CHECK ONLY — English placeholders, not translation. Numbers isolated LTR.','Numeric axis and numeric labels stay LTR inside the mirrored surrounding UI. To validate with Urdu-reading users before Urdu launch.'])
(p/'d4-frames.json').write_text(json.dumps(frames,indent=2)+'\n')
for folder in ['hifi','responsive','rtl']:
 items=[f for f in frames if f['folder']==folder];(p/folder/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>D4 '+folder+'</title><link rel="stylesheet" href="../design-system/components.css"><main class="board"><h1>D4 '+folder+'</h1>'+''.join('<a href="'+f['name']+'.html">'+f['name']+'</a>' for f in items)+'</main></html>')
# Replace obsolete range previews everywhere in the D3 component board.
from bs4 import BeautifulSoup
f=p/'design-system/components.html';soup=BeautifulSoup(f.read_text(),'html.parser')
for old in list(soup.select('section')):
 if old.find('h2') and old.find('h2').get_text()=='D4 range variants':old.decompose()
for el in list(soup.select('.range,.range-v2')):
 el.replace_with(BeautifulSoup(rangebar(),'html.parser'))
# All visible stale numerical examples replaced as a coherent token-only review catalogue.
for txt in soup.find_all(string=True):
 s=str(txt).replace('midpoint','market median').replace('Midpoint','Market median').replace('Rs 1,70,000','Rs 1,02,000').replace('Rs 1,85,000','Rs 1,15,000')
 if s!=str(txt):txt.replace_with(s)
section=soup.new_tag('section');section.append(BeautifulSoup('<h2>D4 range variants</h2><h3>Fair but above most listings found</h3>'+rangebar(108000,'FAIR')+'<h3>Unusually Low, below Fair band</h3>'+rangebar(85000,'UNUSUALLY_LOW')+'<h3>No asking price: Fair band, no marker</h3>'+rangebar(None)+'<p>Server Fair band only; geometry helper never computes verdict thresholds. Markers require --verdict-color matching server verdict. Below/inside variants in this board use semantic styles below.</p>','html.parser'));soup.main.append(section)
# range-specific per-variant inherited colors
for idx,el in enumerate(section.select('.range-v2')):el['style']='--verdict-color:var(--color-'+(['fair','low','high'][idx])+')'
f.write_text(str(soup))
# Postprocess English RTL placeholders for readable compound phrases; not translation.
for f in (p/'rtl').glob('*-rtl.html'):
 soup=BeautifulSoup(f.read_text(),'html.parser')
 for el in soup.select('main p, main .range-ends>span'):
  wrap=soup.new_tag('bdi',attrs={'dir':'ltr'})
  for ch in list(el.contents):wrap.append(ch.extract())
  el.append(wrap)
 f.write_text(str(soup))
for f in (p/'hifi').glob('results*low.html'):
 soup=BeautifulSoup(f.read_text(),'html.parser')
 for el in soup.select('.flat p'):
  if el.get_text().startswith('New-market'):
   for b in el.select('bdi'):b.string='Rs 98,000' if '98,800' in b.get_text() else 'Rs 1,06,000'
 f.write_text(str(soup))
f=p/'design-system/components.html';s=f.read_text().replace('Verify before paying.','Verify condition, PTA/lock status and seller before paying.');soup=BeautifulSoup(s,'html.parser')
for b in soup.select('.banner'):
 if not b.select_one('.info'):
  tag=soup.new_tag('span',attrs={'class':'info','aria-hidden':'true'});tag.string='ⓘ ';b.insert(0,tag)
f.write_text(str(soup))

# C2: share hero already states price; keep semantic marker but omit duplicate marker value.
for f in (p/'hifi').glob('share-*.html'):
 soup=BeautifulSoup(f.read_text(),'html.parser')
 if soup.select_one('.share-card'):
  for label in soup.select('.ask-value'):label.decompose()
 f.write_text(str(soup))
