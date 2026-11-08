"""Independent CTO exact arithmetic on synthetic JSON only. Not product/QA test execution."""
import json
from fractions import Fraction as F
from pathlib import Path
P=Path('/workspace/kitne-ka/cto/evidence')
vs=json.loads((P/'qa-v1.1-reviewed-input.json').read_text())
def q(a,p):
 a=sorted(a);h=(len(a)-1)*p;i=h.numerator//h.denominator
 return a[i] if i==len(a)-1 else a[i]+(h-i)*(a[i+1]-a[i])
checks=[];conflicts=[]
for v in vs:
 i,e=v['input'],v['expected'];id=v['id'];r={'id':id,'review':'semantic/contract review; not executed against engine'}
 if id.startswith(('RNG','INS','VER','OUT','BND')) or id=='CLS-04':
  obs=i.get('observations',[])
  if obs and all('amount_minor' in o for o in obs):
   a=[F(o['amount_minor']) for o in obs];n0=len(a)
   if n0>=8:
    q1,q3=q(a,F(1,4)),q(a,F(3,4));iqr=q3-q1
    if iqr:a=[x for x in a if q1-F(3,2)*iqr<=x<=q3+F(3,2)*iqr]
   if len(a)>=3:
    m=q(a,F(1,2));span=(max(a)-min(a))/m
    if span<=F(3,5):
     lo,hi=(min(a),max(a)) if len(a)<5 else (q(a,F(1,10)),q(a,F(9,10)))
     got={'median_minor':round(m),'range_low_minor':round(lo),'range_high_minor':round(hi),'fair_band_low_minor':round(m*F(85,100)),'fair_band_high_minor':round(m*F(110,100))}
     A=i.get('asking_price_minor')
     if A is not None and A>0:
      d=(A-m)/m;got['verdict']='FAIR' if F(-15,100)<=d<=F(1,10) else 'HIGH' if d>F(1,10) else 'UNUSUALLY_LOW'
     r={'id':id,'review':'independent rational spot-check','calculated':got}
     for k,value in got.items():
      if k in e and isinstance(e[k],(int,float,str)) and e[k]!=value:conflicts.append({'id':id,'field':k,'expected':e[k],'correct':value})
 if id.startswith('CON') and 'C_raw_exact' in e:
  raw=F(e['C_raw_exact']);score=round(raw)
  n=i.get('n_effective',0);d=i.get('independent_sources',0)
  if n<5 or d<2:score=min(score,49)
  if any(F(x)<1 for x in i.get('match_quality',[])):score=min(score,79)
  if 'P10' in i and (F(i['P90'])-F(i['P10']))/F(i['M'])>F(3,10):score=min(score,79)
  r={'id':id,'review':'independent exact score rounding/caps','calculated_score':score}
  if isinstance(e.get('score'),int) and e['score']!=score:conflicts.append({'id':id,'field':'score','expected':e['score'],'correct':score})
 if id.startswith('GEO'):
  a=[F(str(o['price_pkr'])) for o in i['observations']];groups={}
  for o in i['observations']:
   if o.get('city'):groups.setdefault(o['city'],[]).append(F(str(o['price_pkr'])))
  cms=[q(a,F(1,2)) for a in groups.values() if len(a)>=2]
  ratio=(max(cms)-min(cms))/q(a,F(1,2)) if len(cms)>=2 else None
  r={'id':id,'review':'independent city medians; all included overall median','ratio':str(ratio),'fires':ratio is not None and ratio>F(15,100)}
 if id in ['NRM-25','NRM-40','NRM-41','NRM-42']:
  s=i['raw_text'].strip();mult=100000 if s.endswith('lac') else 1000
  s=s.removesuffix('lac').removesuffix('k').strip();amt=round(F(s)*mult*100)
  r={'id':id,'review':'independent decimal-string rational conversion','amount_minor':amt}
  if e.get('amount_minor')!=amt:conflicts.append({'id':id,'field':'amount_minor','expected':e.get('amount_minor'),'correct':amt})
 checks.append(r)
(P/'qa-v1.1-arithmetic-review.json').write_text(json.dumps({'scope':'120 synthetic vectors inventoried; independent spot arithmetic, no engine execution','reviews':checks,'numeric_conflicts':conflicts},indent=2))
print('Vectors inventoried:',len(checks));print('Numeric spot-check discrepancies:',json.dumps(conflicts,indent=2))
print('NRM-34 digit value in paisa:',int('9999999999999')*100,'< MAX_SAFE_INTEGER',2**53-1)
