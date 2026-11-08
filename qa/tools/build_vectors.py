"""Builds pricing-engine-test-vectors.json. Expected values were hand-derived from
02-pricing-methodology-v0.md and cross-checked with tools/oracle.py (QA reference, exact fractions).
SYNTHETIC DATA. Not real market prices."""
import json
from fractions import Fraction as F
from oracle import pool, verdict, conf
TBD='TBD - needs CTO decision'
def m(pkr):  # PKR -> minor units (paisa); keep exact
    v=F(pkr)*100
    return int(v) if v.denominator==1 else str(v)
def rng(vals,A=None,label=None):
    p=pool(vals); out={'result_state':'INSUFFICIENT_DATA' if p['state']!='RANGE' else 'RANGE_AVAILABLE','n_effective':p['n']}
    if p['state']!='RANGE':
        out.update(range_low=None,range_high=None,median=None,verdict='INSUFFICIENT_DATA',diff_percent=None,diff_absolute_minor=None,
                   insufficient_reasons=[p['reason']],confidence={'score':None,'level':'NONE'})
        return out
    v,d=verdict(A,p['median'])
    out.update(range_method=p['method'],range_low_minor=m(p['low']),range_high_minor=m(p['high']),median_minor=m(p['median']),
               verdict=v,diff_percent=None if d is None else str(d) if d.denominator!=1 else int(d),
               diff_percent_approx=None if d is None else round(float(d),6),
               diff_absolute_minor=None if A is None else m(F(A)-p['median']))
    if p['trimmed']: out['excluded_by_reason']=[{'code':'STATISTICAL_OUTLIER','count':len(p['trimmed'])}]
    return out
V=[]
def add(id,group,desc,inp,exp,notes='',tbd=None):
    V.append(dict(id=id,group=group,description=desc,input=inp,expected=exp if not tbd else {'status':TBD,'open_question':tbd,**(exp or {})},notes=notes))
std=dict(category_id='phones',condition='NEW_SEALED',pta_status='APPROVED',freshness_window_days=14)
P5=[98000,100000,102000,104000,106000]
P100=[96000,98000,100000,102000,104000]
def obs(prices): return [{'price_pkr':x,'amount_minor':x*100} for x in prices]
# --- range / median
add('RNG-01','range','CTO §7 worked example, n=5 -> P10-P90',{**std,'observations':obs(P5),'asking_price_minor':11500000},rng(P5,115000),'Matches methodology §7 and API example.')
add('RNG-02','range','n=3 -> MIN_MAX',{**std,'observations':obs([100000,110000,120000]),'asking_price_minor':None},rng([100000,110000,120000]))
add('RNG-03','range','n=4 even median = mean of middle two, MIN_MAX',{**std,'observations':obs([100000,104000,106000,110000]),'asking_price_minor':None},rng([100000,104000,106000,110000]))
add('RNG-04','range','n=6 even, P10-P90 interpolated',{**std,'observations':obs([90000,95000,100000,105000,110000,120000]),'asking_price_minor':None},rng([90000,95000,100000,105000,110000,120000]))
add('RNG-05','range','n=4 with odd-paisa middle values -> fractional-paisa median',{**std,'observations':[{'amount_minor':x} for x in (10000000,10000001,10000002,10000010)],'asking_price_minor':None},
    {'median_minor_exact':'20000003/2 (=10000001.5 paisa)','median_minor_stored':TBD},'Methodology says compare exact rationals, round only display; Money.amount_minor is integer.',
    tbd='Q2: how is a fractional-paisa median/percentile stored in Money (integer) — round half-up, banker’s, floor, or keep rational internally?')
# --- insufficient
for i,(vals,why) in enumerate([([],'n=0'),([100000],'n=1'),([100000,102000],'n=2 (PRD boundary n=2)')]):
    add(f'INS-0{i+1}','insufficient',f'{why} -> INSUFFICIENT_DATA',{**std,'observations':obs(vals),'asking_price_minor':10000000},rng(vals,100000))
add('INS-04','insufficient','n=2 and no asking price -> INSUFFICIENT_DATA overrides NO_ASKING_PRICE',{**std,'observations':obs([100000,102000]),'asking_price_minor':None},rng([100000,102000]))
add('INS-05','insufficient','n=3 boundary passes (contrast to INS-03)',{**std,'observations':obs([100000,101000,102000]),'asking_price_minor':10000000},{**rng([100000,101000,102000],100000),'confidence':{'level':'LOW','score_max':49}})
add('INS-06','insufficient','spread exactly 0.60 passes (<=0.60)',{**std,'observations':obs([70000,100000,130000]),'asking_price_minor':None},rng([70000,100000,130000]),'(130000-70000)/100000 = 0.60')
add('INS-07','insufficient','spread just above 0.60 -> INSUFFICIENT_DATA EXCESSIVE_SPREAD',{**std,'observations':obs([69999,100000,130000]),'asking_price_minor':None},rng([69999,100000,130000]),'60001/100000 = 0.60001 > 0.60')
add('INS-08','insufficient','n=7 with extreme value: no IQR trim (<8) -> spread gate fails',{**std,'observations':obs([100000,101000,102000,103000,104000,105000,200000]),'asking_price_minor':None},rng([100000,101000,102000,103000,104000,105000,200000]),'median 103000; (200000-100000)/103000 = 0.9709 > 0.60')
add('INS-09','insufficient','All observations stale (age 15d new) -> excluded STALE -> n=0',{**std,'observations':[{'price_pkr':x,'age_days':15} for x in P5],'asking_price_minor':None},
    {'result_state':'INSUFFICIENT_DATA','excluded_by_reason':[{'code':'STALE','count':5}],'insufficient_reasons':['TOO_FEW_COMPARABLES or NO_FRESH_EVIDENCE: '+TBD]},
    tbd='Q6: which insufficient_reasons code(s) when every observation is stale: NO_FRESH_EVIDENCE alone, or with TOO_FEW_COMPARABLES?')
# --- verdict thresholds (M=100000)
for id,A,why in [('VER-01',84999,'just below -15%'),('VER-02',85000,'exactly -15%'),('VER-03',85001,'just above -15%'),('VER-04',100000,'equal to median'),
                 ('VER-05',109999,'just below +10%'),('VER-06',110000,'exactly +10%'),('VER-07',110001,'just above +10%')]:
    add(id,'verdict',f'A={A} vs M=100000 ({why})',{**std,'observations':obs(P100),'asking_price_minor':A*100},rng(P100,A))
add('VER-08','verdict','paisa precision just below -15%: A=84,999.99',{**std,'observations':obs(P100),'asking_price_minor':8499999},rng(P100,F(8499999,100)))
add('VER-09','verdict','paisa precision just above +10%: A=110,000.01',{**std,'observations':obs(P100),'asking_price_minor':11000001},rng(P100,F(11000001,100)))
for id,A in [('VER-10',86700),('VER-11',86699),('VER-12',112200),('VER-13',112201)]:
    add(id,'verdict',f'CTO example median 102000, A={A} (band edge)',{**std,'observations':obs(P5),'asking_price_minor':A*100},rng(P5,A))
add('VER-14','verdict','Valid evidence, asking price null -> NO_ASKING_PRICE, diffs null',{**std,'observations':obs(P5),'asking_price_minor':None},{**rng(P5),'verdict_slot':'NO_ASKING_PRICE'})
add('VER-15','verdict','Asking price 0 is not "absent"',{**std,'observations':obs(P5),'asking_price_minor':0},{'http_status':'400 or 422 (classify requires positive amount)'},
    tbd='Q7: on POST /assessments, is asking_price amount_minor=0 rejected (which code) or treated as null? Methodology: "absence of a target price is not a zero price".')
add('VER-16','verdict','LOW-confidence price verdict sets indicative=true',{**std,'observations':obs([100000,101000,102000]),'asking_price_minor':11500000},{**rng([100000,101000,102000],115000),'indicative':True,'low_confidence_modifier':True})
# --- confidence
def C(id,desc,n,d,ages,W,Qs,extra=None,tbd=None,**kw):
    c=conf(n,d,ages,W,Qs,**kw)
    e={'S':str(c['S']),'D':str(c['D']),'R':str(c['R']),'Q':str(c['Q']),'C_raw_exact':str(c['raw']),'C_raw_approx':round(c['raw_float'],6),'score':c['score'],'level':c['level']}
    if extra: e.update(extra)
    add(id,'confidence',desc,{'n_effective':n,'independent_sources':d,'ages_days':ages,'freshness_window_days':W,'match_quality':[str(F(x)) for x in Qs],**({k:str(v) for k,v in kw.items()})},e,tbd=tbd)
C('CON-01','CTO §7 example',5,3,[1,2,3,4,5],14,[1]*5)
C('CON-02','single source owner d=1 -> cap 49',5,1,[1,2,3,4,5],14,[1]*5,{'reasons_include':['SINGLE_SOURCE']})
C('CON-03','n=3 -> cap 49',3,3,[1,2,3],14,[1]*3,{'reasons_include':['FEW_COMPARABLES']})
C('CON-04','n=4,d=2 -> cap 49',4,2,[0,0,0,0],14,[1]*4,{'reasons_include':['FEW_COMPARABLES']})
C('CON-05','one obs match_quality 0.9 -> cap 79',5,3,[1,2,3,4,5],14,[1,1,1,1,F(9,10)],{'reasons_include':['ATTRIBUTE_MATCH_NOT_SKU']})
C('CON-06','(P90-P10)/M exactly 0.30 -> no cap',5,3,[1,2,3,4,5],14,[1]*5,{'pool_prices':[81250,90625,100000,109375,118750]},P10=F(85000),P90=F(115000),M=F(100000))
C('CON-07','(P90-P10)/M = 0.300032 -> cap 79, WIDE_SPREAD',5,3,[1,2,3,4,5],14,[1]*5,{'pool_prices':[81248,90624,100000,109376,118752],'reasons_include':['WIDE_SPREAD']},P10=F(424992,5),P90=F(575008,5),M=F(100000))
C('CON-08','uncapped 79.96 -> 80 HIGH (band edge)',6,3,[9]*6,14,[1]*6)
C('CON-09','uncapped 79.07 -> 79 MEDIUM (band edge)',6,3,[10]*6,14,[1]*6)
C('CON-10','C_raw exactly 78.5 (rounding tie)',7,3,[14]*7,14,[1]*7,{'score':'79 if half-up (JS Math.round) / 78 if half-even: '+TBD},tbd='Q3: rounding rule for C_raw ties (.5) - half-up or half-even? Also use exact rationals, not floats.')
C('CON-11','used pool, 30-day window',6,2,[0,6,12,18,24,30],30,[1]*6)
C('CON-12','age exactly at window edge contributes R=0.5',5,3,[14]*5,14,[1]*5)
C('CON-13','n>10 saturates S at 1, d>3 saturates D',12,4,[0]*12,14,[1]*12)
add('CON-14','confidence','Level mapping function boundaries (pure)',{'scores':[0,49,50,79,80,100]},{'levels':['LOW','LOW','MEDIUM','MEDIUM','HIGH','HIGH']},
    'NOTE: with n>=5,d>=2,Q=1 the minimum uncapped C_raw is 64.17 (n=5,d=2,all ages=window), so score 49/50 is only reachable via caps; test mapping function directly.')
add('CON-15','confidence','Insufficient -> score null, level NONE (not 0)',{'n_effective':2},{'score':None,'level':'NONE','reasons':[]})
# --- PTA branching
add('PTA-01','pta','target NOT_SURE; APPROVED n=2, NON_PTA n=2 -> INSUFFICIENT (no 2+2 pooling)',{**std,'pta_status':'NOT_SURE','branches':{'APPROVED':obs([100000,102000]),'NON_PTA':obs([80000,82000])},'asking_price_minor':10000000},
    {'result_state':'INSUFFICIENT_DATA','data':None,'confidence':{'score':None,'level':'NONE'}})
add('PTA-02','pta','target NOT_SURE; APPROVED n=5 passes, NON_PTA n=2 fails',{**std,'pta_status':'NOT_SURE','branches':{'APPROVED':{'observations':obs(P5),'independent_sources':3,'ages_days':[1,2,3,4,5]},'NON_PTA':obs([80000,82000])},'asking_price_minor':11500000},
    {'result_state':'RANGE_AVAILABLE','mode':'PTA_SPLIT','selected_assessment':None,'verdict_slot':{'state':'PTA_SELECTION_REQUIRED','verdict':None},
     'pta_branches':[{'pta_status':'APPROVED','state':'RANGE_AVAILABLE','median_minor':10200000,'range_low_minor':9880000,'range_high_minor':10520000,'confidence':{'score':49,'level':'LOW','reasons_include':['PTA_UNCONFIRMED']}},
                     {'pta_status':'NON_PTA','state':'INSUFFICIENT_DATA','pool':None}],'low_confidence_modifier':True},'Uncapped APPROVED score would be 82 (CON-01) -> capped 49.')
add('PTA-03','pta','target NOT_SURE; both branches pass -> split summary = min of capped scores',{**std,'pta_status':'NOT_SURE','branches':{'APPROVED':{'observations':obs(P5),'independent_sources':3,'ages_days':[1,2,3,4,5]},'NON_PTA':{'observations':obs([80000,81000,82000]),'independent_sources':2,'ages_days':[1,1,1]}},'asking_price_minor':None},
    {'result_state':'RANGE_AVAILABLE','mode':'PTA_SPLIT','verdict_slot':{'state':'PTA_SELECTION_REQUIRED','verdict':None},'branch_scores':{'APPROVED':49,'NON_PTA':49},'confidence':{'score':49,'level':'LOW'},'no_merged_median':True},
    'Asking price absent: slot still PTA_SELECTION_REQUIRED per §9 ("with no price PTA selection still precedes price verdict").')
add('PTA-04','pta','target APPROVED; NON_PTA and unknown-PTA candidates present',{**std,'observations':obs(P5)+[{'price_pkr':85000,'pta_status':'NON_PTA'},{'price_pkr':90000,'pta_status':None}],'asking_price_minor':11500000},
    {**rng(P5,115000),'retrieved_count':7,'included_count':5,'excluded_count':2,'excluded_by_reason':[{'code':'VARIANT_MISMATCH','count':1},{'code':'UNKNOWN_CRITICAL_ATTRIBUTE','count':1}]},
    'Reason code for unknown-PTA candidate assumed UNKNOWN_CRITICAL_ATTRIBUTE (closest enum; confirm with CTO, Q8).')
add('PTA-05','pta','target NOT_SURE, neither branch has evidence -> INSUFFICIENT; not CONFIRMATION_REQUIRED',{**std,'pta_status':'NOT_SURE','branches':{'APPROVED':[],'NON_PTA':[]}},{'result_state':'INSUFFICIENT_DATA','http_status':'not 422'})
add('PTA-06','pta','classify after split with pta_status=APPROVED -> verdict vs APPROVED branch only, cap removed',{'stored':'PTA-02','classify':{'asking_price_minor':11500000,'pta_status':'APPROVED'}},
    {'result_state':'RANGE_AVAILABLE','mode':'SINGLE_POOL','verdict':'HIGH','diff_percent':'650/51 (~12.745098)','confidence':{'score':82,'level':'HIGH'}},'Assumes ages unchanged at classify time; recency is recomputed at classify (API §classify), so score may drop with elapsed time.')
add('PTA-07','pta','classify after split with pta_status=NON_PTA (branch failed) -> 422 NO_STORED_RANGE',{'stored':'PTA-02','classify':{'asking_price_minor':8000000,'pta_status':'NON_PTA'}},{'http_status':422,'code':'NO_STORED_RANGE'})
add('PTA-08','pta','classify on split without pta_status -> 422 PTA_SELECTION_REQUIRED',{'stored':'PTA-02','classify':{'asking_price_minor':11500000}},{'http_status':422,'code':'PTA_SELECTION_REQUIRED'})
# --- outliers / IQR
O1=[100000,101000,102000,103000,104000,105000,106000,200000]
add('OUT-01','outlier','n=8 IQR trims 200000',{**std,'observations':obs(O1),'asking_price_minor':None},rng(O1),'Q1=101750 Q3=105250 IQR=3500 fences [96500,110500]')
O2=[100000,101000,102000,103000,104000,105000,106000,110500]
add('OUT-02','outlier','value exactly on upper fence is retained (strictly outside only)',{**std,'observations':obs(O2),'asking_price_minor':None},rng(O2),'Q3 = 105000+0.25*1000 = 105250; upper fence = 110500')
O3=[100000]*7+[150000]
add('OUT-03','outlier','IQR=0 -> no auto-trim, flag spread anomaly',{**std,'observations':obs(O3),'asking_price_minor':None},{**rng(O3),'review_flag':TBD},tbd='Q9: what code/field flags the IQR=0 spread anomaly (warnings[] string? which value?) and is the result still shown?')
O4=[100000,101000,102000,103000,104000,105000,106000,107000,300000,310000]
add('OUT-04','outlier','n=10 two high outliers trimmed once (no repeated trimming)',{**std,'observations':obs(O4),'asking_price_minor':None},rng(O4))
add('OUT-05','outlier','trim leaves n<8: no second pass',{'see':'OUT-01'},{'note':'after trimming n=7; engine must not re-run IQR'})
# --- filters
add('FIL-01','filter','new obs age exactly 14x24h admitted; 14d+1s excluded STALE',{**std,'observations':[{'price_pkr':100000,'age_seconds':1209600},{'price_pkr':101000,'age_seconds':1209601}]},{'admitted':[100000],'excluded_by_reason':[{'code':'STALE','count':1}]})
add('FIL-02','filter','used obs age exactly 30x24h admitted; +1s excluded',{**std,'condition':'USED','used_grade':'GOOD','freshness_window_days':30,'observations':[{'price_pkr':60000,'age_seconds':2592000},{'price_pkr':61000,'age_seconds':2592001}]},{'admitted':[60000],'excluded_by_reason':[{'code':'STALE','count':1}]})
add('FIL-03','filter','observed_at in the future excluded',{**std,'observations':[{'price_pkr':100000,'age_seconds':-60}]},{'admitted':[]},tbd='Q10: exclusion reason code for future-dated observations (STALE? UNVERIFIED_PROVENANCE? new code?).')
add('FIL-04','filter','undated observation excluded UNDATED',{**std,'observations':[{'price_pkr':100000,'observed_at':None}]},{'excluded_by_reason':[{'code':'UNDATED','count':1}]})
add('FIL-05','filter','fresh retrieved_at does not refresh old observed_at',{**std,'observations':[{'price_pkr':100000,'observed_at_age_days':20,'retrieved_at_age_days':0}]},{'excluded_by_reason':[{'code':'STALE','count':1}]})
add('FIL-06','filter','same seller twice -> one effective comparable (latest)',{**std,'observations':[{'seller':'S1','price_pkr':100000,'age_days':5},{'seller':'S1','price_pkr':99000,'age_days':1},{'seller':'S2','price_pkr':101000},{'seller':'S3','price_pkr':102000}]},
    {'n_effective':3,'included_prices':[99000,101000,102000],'excluded_by_reason':[{'code':'DUPLICATE','count':1}]})
add('FIL-07','filter','target listing in candidates excluded TARGET_LISTING',{**std,'target_listing_id':'L-T','observations':[{'id':'L-T','price_pkr':115000}]+obs(P5)},{'excluded_by_reason':[{'code':'TARGET_LISTING','count':1}],'n_effective':5})
add('FIL-08','filter','5 sellers on one platform owner -> d=1',{**std,'observations':[{'seller':f'S{i}','source_owner_group':'G1','price_pkr':p} for i,p in enumerate(P5)]},{'independent_sources':1,'confidence':{'score':49,'level':'LOW','reasons_include':['SINGLE_SOURCE']}})
add('FIL-09','filter','zero/negative/foreign-currency/instalment prices excluded',{**std,'observations':[{'price_pkr':0},{'price_pkr':-5000},{'currency':'USD','amount':500},{'price_basis':'MONTHLY_INSTALMENT','price_pkr':5000}]},
    {'admitted':[],'excluded_codes':['PRICE_NOT_COMPARABLE','PRICE_NOT_COMPARABLE','UNSUPPORTED_CURRENCY','PRICE_NOT_COMPARABLE']},'Mapping of zero/negative/instalment to PRICE_NOT_COMPARABLE is an ASSUMPTION (Q8).')
add('FIL-10','filter','used target never filled from new pool',{**std,'condition':'USED','used_grade':'GOOD','observations':obs(P5)},{'result_state':'INSUFFICIENT_DATA','excluded_by_reason':[{'code':'CONDITION_MISMATCH','count':5}]})
add('FIL-11','filter','out-of-stock offer excluded NOT_IN_STOCK',{**std,'observations':[{'price_pkr':100000,'availability':'OUT_OF_STOCK'}]},{'excluded_by_reason':[{'code':'NOT_IN_STOCK','count':1}]})
add('FIL-12','filter','counts invariant included+excluded=retrieved',{'see':'PTA-04'},{'invariant':'5+2=7'})
# --- precedence / classify
add('PRE-01','precedence','DB/service failure -> ERROR, not INSUFFICIENT',{'service':'evidence DB unavailable'},{'result_state':'ERROR','error':{'code':'SERVICE_UNAVAILABLE','http_status':503,'retryable':True},'data':None})
add('CLS-01','classify','now == valid_until passes',{'stored':'RNG-01 (earliest observed_at age 5d)','now_minus_earliest_observed':'14d exactly'},{'http_status':200})
add('CLS-02','classify','now = valid_until + 1s -> 409 RANGE_STALE',{'stored':'RNG-01','now_minus_earliest_observed':'14d+1s'},{'http_status':409,'code':'RANGE_STALE'})
add('CLS-03','classify','variant change -> 422 VARIANT_CHANGE_REQUIRES_CHECK',{'stored':'RNG-01','classify':{'storage_gb':256}},{'http_status':422,'code':'VARIANT_CHANGE_REQUIRES_CHECK'})
add('CLS-04','classify','verdict anchored on median, not (low+high)/2',{**std,'observations':obs([90000,95000,100000,105000,110000,120000]),'asking_price_minor':11300000},{**rng([90000,95000,100000,105000,110000,120000],113000),'wrong_if_midpoint':'midpoint 103750 -> +8.916% FAIR (WRONG)'})
# --- normaliser
N=[('NRM-01','Rs 1,25,000',125000,''),('NRM-02','125k',125000,''),('NRM-03','1.25 lac',125000,''),('NRM-04','1.25 lakh',125000,''),
   ('NRM-05','PKR 125000/-',125000,''),('NRM-06','85k',85000,'PRD US3'),('NRM-07','1.2 lac',120000,'PRD US3'),('NRM-08','1.2L',120000,'PRD §6'),
   ('NRM-09','1,20,000',120000,'PRD §6 lakh grouping'),('NRM-10','₨ 120,000',120000,'Western grouping'),('NRM-11','Rs. 85,000',85000,''),
   ('NRM-12','1 crore',10000000,'PRD scope lists crore'),('NRM-13','12.5k',12500,'')]
for id,raw,pkr,n in N: add(id,'normaliser',f'parse "{raw}"',{'raw_text':raw},{'amount_minor':pkr*100,'currency':'PKR'},n)
T=[('NRM-20','۱,۲۵,۰۰۰','Q11: Eastern Arabic-Indic / Urdu digits support at launch? (expected 12500000 if supported)'),
   ('NRM-21','125K','Q12: case-insensitive suffixes (K, LAC, Lakh)? expected 12500000 if yes'),
   ('NRM-22','1 lac 20 hazar','Q11: Roman Urdu compound amounts in scope (PRD lists as Could)?'),
   ('NRM-23','1.2','Q13: bare decimal without unit - reject, ask user, or treat as lakh?'),
   ('NRM-24','500','Q14: implausible target (<1000 per PRD vs category-config per CTO CR8) - which threshold flags confirmation?'),
   ('NRM-25','1.23456 lac','Q15: sub-paisa/excess precision - reject or round? (1.23456 lac = 123456 PKR exactly; 1.234567 lac = 123456.7)'),
   ('NRM-26','Rs 1,25,000 Rs 1,10,000 final','PRD: multiple prices -> ask user; confirm output shape (candidates list + requires_confirmation)'),
   ('NRM-27','EMI 5,000/month','Q16: target price given only as instalment - reject or ask for cash price?')]
for id,raw,q in T: add(id,'normaliser',f'parse "{raw}"',{'raw_text':raw},None,tbd=q)
for id,raw,exp in [('NRM-30','$500',{'error':'UNSUPPORTED_CURRENCY / ask for PKR price (PRD §6)'}),('NRM-31','Rs 0',{'amount_minor':None,'requires_confirmation':True}),
                   ('NRM-32','-25000',{'amount_minor':None,'requires_confirmation':True}),('NRM-33','',{'amount_minor':None,'no_price_found':True}),
                   ('NRM-34','Rs 99,99,99,99,99,999',{'rejected':'exceeds safe integer / absurd -> requires_confirmation'})]:
    add(id,'normaliser',f'parse "{raw}"',{'raw_text':raw},exp,'Exact error code/field for normaliser rejections not specified; assert value null + requires_confirmation (ASSUMPTION).')

# ===== v1.1 (9 Nov 00:5x PKT): CTO rulings reported by Engineer (agent message 00:39 PKT, not seen by QA, not in 02-methodology) =====
RUL='cto-ruling-via-message (reported by Engineer, not in spec)'
byid={v['id']:v for v in V}
def resolve(id,exp,notes,basis=RUL):
    v=byid[id]; v['expected']=exp; v['notes']=notes; v['basis']=basis
# Q2 fractional paisa -> half-even at output only
resolve('RNG-05',{'median_minor_exact':'20000003/2','median_minor':10000002,'range_method':'MIN_MAX','range_low_minor':10000000,'range_high_minor':10000010,
  'fair_band_low_minor':8500001,'fair_band_high_minor':11000002},
  'Median=(10000001+10000002)/2=10000001.5 paisa -> half-even -> 10000002 (2 is even). Fair band computed on UNROUNDED median: 10000001.5*0.85=8500001.275 -> 8500001; *1.10=11000001.65 -> 11000002.')
# Q10 future dates
resolve('FIL-03',{'admitted':[100000]},'Observed 60 s in the future is within the 5-min skew allowance -> admitted. Recency age clamped to 0 is Engineer code, not ruling (ASSUMPTION).')
def addr(id,group,desc,inp,exp,notes='',basis=RUL):
    V.append(dict(id=id,group=group,description=desc,input=inp,expected=exp,notes=notes,basis=basis))
addr('FIL-13','filter','observed_at 5 min + 1 s in the future -> INVALID_TIMESTAMP',{**std,'observations':[{'price_pkr':100000,'age_seconds':-301}]},{'admitted':[],'excluded_by_reason':[{'code':'INVALID_TIMESTAMP','count':1}]})
addr('FIL-14','filter','observed_at exactly 5 min in the future -> admitted',{**std,'observations':[{'price_pkr':100000,'age_seconds':-300}]},{'admitted':[100000]},'Inclusive boundary at exactly 300 s is ASSUMPTION ("5-minute skew allowed"); Engineer code admits it.',basis='assumption')
addr('FIL-15','filter','age uses older of observed_at and source_updated_at',{**std,'observations':[{'price_pkr':100000,'observed_at_age_days':10,'source_updated_at_age_days':16}]},{'effective_age_days':16,'admitted':[],'excluded_by_reason':[{'code':'STALE','count':1}]},'max(10,16)=16 > 14 -> STALE (new).')
addr('FIL-16','filter','older-of rule, both within window',{**std,'observations':[{'price_pkr':100000,'observed_at_age_days':2,'source_updated_at_age_days':6}]},{'effective_age_days':6,'admitted':[100000],'recency_term':'1-0.5*6/14=11/14 (0.785714)'})
# fair band
for id,obs_,M,lo,hi in [('BND-01',P5,'102000',8670000,11220000),('BND-02',P100,'100000',8500000,11000000)]:
    addr(id,'verdict',f'fair_band_low/high = median x0.85 / x1.10 (M={M})',{**std,'observations':obs(obs_)},{'fair_band_low_minor':lo,'fair_band_high_minor':hi},f'{M}*0.85 and {M}*1.10, exact; equals VER band edges.')
# NEAR_EXPIRY: new window 14d -> 20% remaining at age >= 11.2 d = 967,680 s
addr('NEX-01','confidence','oldest included obs age 11.2 d exactly (20% of 14 d remains) -> NEAR_EXPIRY, score unchanged',{**std,'observations':obs(P5),'ages_seconds':[86400,172800,259200,345600,967680],'independent_sources':3},
  {'reasons_include':['NEAR_EXPIRY'],'score_unaffected_by_near_expiry':True},'remaining = 1-967680/1209600 = 0.20 -> <=0.20 fires. Informational only.')
addr('NEX-02','confidence','oldest age 967,679 s (just over 20% remains) -> no NEAR_EXPIRY',{**std,'observations':obs(P5),'ages_seconds':[86400,172800,259200,345600,967679],'independent_sources':3},{'reasons_exclude':['NEAR_EXPIRY']})
addr('NEX-03','confidence','used window 30 d: age 24 d exactly -> NEAR_EXPIRY',{**std,'condition':'USED','used_grade':'GOOD','freshness_window_days':30,'observations':[{'price_pkr':p,'age_days':a} for p,a in zip([60000,61000,62000],[1,2,24])]},{'reasons_include':['NEAR_EXPIRY']},'1-24/30=0.20.')
# GEO_SPREAD
addr('GEO-01','confidence','2 cities x2 comparables, city-median gap > 15% of overall median -> GEO_SPREAD',{**std,'observations':[{'price_pkr':100000,'city':'Karachi'},{'price_pkr':102000,'city':'Karachi'},{'price_pkr':118000,'city':'Lahore'},{'price_pkr':120000,'city':'Lahore'}]},
  {'reasons_include':['GEO_SPREAD'],'score_unaffected_by_geo_spread':True},'City medians 101000 / 119000; overall median (102000+118000)/2=110000; 18000/110000=0.1636>0.15. Interpreting "(max-min)" as max-min of CITY MEDIANS follows Engineer code: ASSUMPTION, CTO to confirm (Q21).')
addr('GEO-02','confidence','2 cities x2, gap 12.96% -> no GEO_SPREAD',{**std,'observations':[{'price_pkr':100000,'city':'Karachi'},{'price_pkr':102000,'city':'Karachi'},{'price_pkr':114000,'city':'Lahore'},{'price_pkr':116000,'city':'Lahore'}]},
  {'reasons_exclude':['GEO_SPREAD']},'101000 vs 115000; overall 108000; 14000/108000=0.1296<=0.15.')
addr('GEO-03','confidence','only one city has >=2 comparables -> no GEO_SPREAD',{**std,'observations':[{'price_pkr':100000,'city':'Karachi'},{'price_pkr':102000,'city':'Karachi'},{'price_pkr':140000,'city':'Lahore'}]},{'reasons_exclude':['GEO_SPREAD']})
addr('GEO-04','confidence','gap exactly 15% -> no GEO_SPREAD (strict >)',{**std,'observations':[{'price_pkr':p,'city':c} for p,c in [(100000,'Karachi'),(100000,'Karachi'),(115000,'Lahore'),(115000,'Lahore'),(100000,None)]]},
  {'reasons_exclude':['GEO_SPREAD']},'Overall median of [100k,100k,100k,115k,115k]=100000; gap 15000/100000=0.15, not >0.15. Missing-city obs counts in overall median (Engineer code; ASSUMPTION).')
# normaliser rulings
resolve('NRM-31',{'ok':False,'reason':'ZERO'},'Ruling: normaliser rejects zero.')
resolve('NRM-32',{'ok':False,'reason':'NEGATIVE'},'Ruling: normaliser rejects negative.')
resolve('NRM-25',{'ok':True,'amount_minor':12345670},'1.234567 lac = 123456.7 PKR = 12345670 paisa exactly (no rounding needed). Ruling: half-even, not reject.')
addr('NRM-40','normaliser','sub-paisa half-even tie rounds to even (down)',{'raw_text':'0.000125k'},{'ok':True,'amount_minor':12},'0.125 PKR = 12.5 paisa -> half-even -> 12.')
addr('NRM-41','normaliser','sub-paisa half-even tie rounds to even (up)',{'raw_text':'0.000135k'},{'ok':True,'amount_minor':14},'0.135 PKR = 13.5 paisa -> 14.')
addr('NRM-42','normaliser','sub-paisa non-tie',{'raw_text':'1.23456789 lac'},{'ok':True,'amount_minor':12345679},'123456.789 PKR = 12345678.9 paisa -> 12345679.')
addr('NRM-43','normaliser','non-finite rejected',{'raw_text':'NaN'},{'ok':False,'reason':'NON_FINITE'})
addr('NRM-44','normaliser','non-finite rejected',{'raw_text':'Infinity'},{'ok':False,'reason':'NON_FINITE'})
addr('NRM-45','normaliser','sub-paisa amount rounding to 0 is rejected',{'raw_text':'0.004'},{'ok':False,'reason':'TOO_SMALL or ZERO: TBD'},'0.4 paisa -> half-even 0. Ruling rejects zero; reason code name TOO_SMALL is Engineer code (ASSUMPTION).',basis='assumption')
# verdict/rounding vectors that now ALSO rest on ruling (inclusive band already spec)
for id in ['VER-01','VER-02','VER-03','VER-04','VER-05','VER-06','VER-07','VER-08','VER-09','VER-10','VER-11','VER-12','VER-13']:
    byid[id]['notes']=(byid[id]['notes']+' Inclusive band is in spec §5 and re-confirmed by CTO ruling.').strip()
# CON-10 stays TBD: ruling covers money output rounding; does not say whether C_raw uses half-even
byid['CON-10']['expected']['open_question']=('Q3: rounding of C_raw tie. The CTO ruling ("half-even only at output") is reported for money; it is NOT clear that it covers the confidence score. '
  'If half-even: 78. If half-up: 79. QA probe 00:45: engine float Math.round gave 78 (78.4999... float error). Require exact rational arithmetic either way.')
ASSUME={'PTA-04','PTA-06','FIL-09','NRM-30','NRM-33','NRM-34','CON-07'}
for v in V:
    if 'basis' in v: continue
    e=v['expected'] or {}
    if isinstance(e,dict) and str(e.get('status','')).startswith('TBD'): v['basis']='TBD'
    elif v['id'] in ASSUME: v['basis']='assumption'
    else: v['basis']='spec'


# ===== v1.2 (9 Nov ~01:00 PKT): authoritative 02-pricing-methodology-v0.1, 03 API v0.4, 09-qa-answers =====
byid={v['id']:v for v in V}
M01='02 v0.1'; A04='03 API v0.4'
def spec(id,ref,exp=None,notes=None):
    v=byid[id]; v['basis']='spec'; v['spec_ref']=ref
    if exp is not None: v['expected']=exp
    if notes is not None: v['notes']=notes
def addv(id,group,desc,inp,exp,ref,notes='',basis='spec'):
    v=dict(id=id,group=group,description=desc,input=inp,expected=exp,notes=notes,basis=basis,spec_ref=ref); V.append(v); byid[id]=v
# default spec refs per group
GREF={'range':M01+' §6-7','insufficient':M01+' §6, §10','verdict':M01+' §7','confidence':M01+' §8','pta':M01+' §8; '+A04,'outlier':M01+' §6',
      'filter':M01+' §2, §4, §5','precedence':M01+' §10','classify':M01+' §11; '+A04,'normaliser':M01+' §3'}
# 1. rebase ruling vectors
for v in V:
    if v['basis'].startswith('cto-ruling'):
        v['basis']='spec'; v['spec_ref']=GREF[v['group']]
byid['RNG-05']['spec_ref']=M01+' §7, §12; 09 Q2'
for i in ('FIL-13','FIL-03'): byid[i]['spec_ref']=M01+' §4; 09 Q10/Q22'
byid['FIL-15']['spec_ref']=byid['FIL-16']['spec_ref']=M01+' §4; 09 Q4'
for i in ('NEX-01','NEX-02','NEX-03'): byid[i]['spec_ref']=M01+' §9; '+A04
for i in ('GEO-01','GEO-02','GEO-03','GEO-04'):
    byid[i]['spec_ref']=M01+' §9; 09 Q21'; byid[i]['notes']=byid[i]['notes'].replace('Interpreting "(max-min)" as max-min of CITY MEDIANS follows Engineer code: ASSUMPTION, CTO to confirm (Q21).','City medians, overall median incl. city-null: 09 Q21.').replace('Missing-city obs counts in overall median (Engineer code; ASSUMPTION).','City-null counts in overall median (09 Q21).')
spec('FIL-14',M01+' §4; 09 Q22',{'admitted':[100000],'effective_age_days':0,'recency_term':'1'},'Exactly 300 s future: admitted, age clamped 0 -> R term 1.')
spec('FIL-03',M01+' §4; 09 Q22',{'admitted':[100000],'effective_age_days':0},'60 s future <= 300 s: admitted, age clamped 0.')
spec('NRM-45',M01+' §3; 09 Q23',{'ok':False,'reason':'ZERO'},'0.004 PKR = 0.4 paisa -> half-even 0 -> ZERO (not TOO_SMALL).')
# 2. resolve TBDs answered by 09
spec('CON-10',M01+' §8; 09 Q3',{'S':'7/10','D':'1','R':'1/2','Q':'1','C_raw_exact':'157/2','score':78,'level':'MEDIUM'},'C_raw=100*(0.21+0.25+0.125+0.2)=78.5 exactly -> half-even -> 78 (8 is even).')
spec('INS-09',M01+' §10; 09 Q6',{'result_state':'INSUFFICIENT_DATA','excluded_by_reason':[{'code':'STALE','count':5}],'insufficient_reasons':['NO_FRESH_EVIDENCE','TOO_FEW_COMPARABLES'],'confidence':{'score':None,'level':'NONE'}},'Order fixed by §10.')
spec('VER-15',M01+' §3; '+A04+'; 09 Q7',{'http_status':422,'code':'INVALID_ASKING_PRICE','retryable':False,'message_key':'errors.price.invalid'},'Zero is not absence; only null means no asking price.')
spec('OUT-03',M01+' §6; 09 Q9',{**byid['OUT-03']['expected'],'status':None,'open_question':None,'review_flag':None,'warnings':['IQR_ZERO_SPREAD_REVIEW']},'Q1=Q3=100000 -> IQR 0, max>min -> warning, no trim; spread 50000/100000=0.5<=0.6 -> range shown.')
for k in ('status','open_question','review_flag'): byid['OUT-03']['expected'].pop(k,None)
# 3. CTO corrections (each rechecked with tools/oracle.py: agree)
spec('CON-12',M01+' §8, §12; 09',{'S':'1/2','D':'1','R':'1/2','Q':'1','C_raw_exact':'145/2','score':72,'level':'MEDIUM'},'C_raw=100*(0.15+0.25+0.125+0.2)=72.5 -> half-even -> 72. v1.1 had 73 (half-up) — corrected; oracle now half-even.')
spec('NRM-25',M01+' §3, §12',{'ok':True,'amount_minor':12345600},'1.23456 lac = 1.23456*100000 = 123,456 PKR = 12,345,600 paisa. v1.1 wrongly said 12,345,670 (QA arithmetic error, CTO-corrected; agreed).')
byid['FIL-08'].update(description='5 offers on ONE platform from 5 distinct verified ultimate seller owners -> n=d=5, no SINGLE_SOURCE',
  input={**std,'observations':[{'seller':f'OWNER-{i}','source_owner_group':'PLATFORM-G1','price_pkr':p} for i,p in enumerate(P5)]},
  expected={'n_effective':5,'independent_sources':5,'reasons_exclude':['SINGLE_SOURCE']},basis='spec',spec_ref=M01+' §2; 09 Q5/Q19',
  notes='Platform parent is provenance only; d counts sellerOwnerId (09 FIL-08 correction).')
addv('FIL-08B','filter','5 offers, same ultimate seller owner across platforms -> dedup to 1 -> Insufficient',{**std,'observations':[{'seller':'OWNER-X','source_owner_group':f'PLATFORM-{i}','price_pkr':p,'age_days':i+1} for i,p in enumerate(P5)]},
  {'result_state':'INSUFFICIENT_DATA','n_effective':1,'excluded_by_reason':[{'code':'DUPLICATE','count':4}],'insufficient_reasons':['TOO_FEW_COMPARABLES']},M01+' §2; 09 Q19','Newest (age 1 d, 98,000) retained.')
spec('NRM-34',M01+' §3; 09',None,'99,99,99,99,99,999 = 9,999,999,999,999 PKR = 999,999,999,999,900 paisa < 9,007,199,254,740,991: technically parseable. v1.1 "exceeds safe integer" rationale was wrong (CTO-corrected; agreed).')
byid['NRM-34'].update(basis='TBD',expected={'status':TBD,'open_question':'P1: absurd-price rejection needs approved category plausibility bounds (PM/Founder); no technical overflow.','technical_parse_amount_minor':999999999999900})
# CLS rebased: private check alive (<=24 h), evidence already old at check creation
CK={'private_ttl_hours':24}
byid['CLS-01'].update(description='evidence oldest age 13.5 d at check; classify +12 h -> age exactly 14 d -> 200',input={**std,'check':{**CK,'evidence_ages_days':[13.5,1,2,3,4],'classify_after_ms':43200000},'classify':{'asking_price_minor':11500000}},
  expected={'http_status':200},basis='spec',spec_ref=M01+' §4, §11; '+A04,notes='Check age 12 h < 24 h TTL; freshness equality passes.')
byid['CLS-02'].update(description='as CLS-01, classify +12 h +1 ms -> 409 RANGE_STALE',input={**std,'check':{**CK,'evidence_ages_days':[13.5,1,2,3,4],'classify_after_ms':43200001},'classify':{'asking_price_minor':11500000}},
  expected={'http_status':409,'code':'RANGE_STALE'},basis='spec',spec_ref=M01+' §4, §11; '+A04,notes='Age 14 d + 1 ms > window; fractional ms per §4.')
addv('CLS-05','classify','fresh evidence, check 9 days old -> 410 CHECK_EXPIRED',{**std,'check':{**CK,'evidence_ages_days':[1,2,3,4,5],'classify_after_ms':9*86400000},'classify':{'asking_price_minor':11500000}},{'http_status':410,'code':'CHECK_EXPIRED'},A04+' (classify); '+M01+' §11')
addv('CLS-06','classify','classify at exactly created+24 h -> 410 (now >= expires_at)',{**std,'check':{**CK,'evidence_ages_days':[1,2,3,4,5],'classify_after_ms':86400000},'classify':{'asking_price_minor':11500000}},{'http_status':410,'code':'CHECK_EXPIRED'},A04+' SecOps v0.3 retention ("now>=expires_at")')
addv('CLS-07','classify','classify at created+24 h -1 ms -> 200',{**std,'check':{**CK,'evidence_ages_days':[1,2,3,4,5],'classify_after_ms':86399999},'classify':{'asking_price_minor':11500000}},{'http_status':200},A04)
addv('CLS-08','classify','TTL expired AND evidence stale -> 410 wins over 409',{**std,'check':{**CK,'evidence_ages_days':[13.9,1,2,3,4],'classify_after_ms':86400000},'classify':{'asking_price_minor':11500000}},{'http_status':410,'code':'CHECK_EXPIRED'},A04+' classify order')
addv('CLS-09','classify','classify asking_price 0 -> 422 INVALID_ASKING_PRICE',{**std,'check':{**CK,'evidence_ages_days':[1,2,3,4,5],'classify_after_ms':3600000},'classify':{'asking_price_minor':0}},{'http_status':422,'code':'INVALID_ASKING_PRICE'},M01+' §3; 09 Q7')
# 4. new boundary tests
addv('CON-17','confidence','C_raw 49.5 -> half-even 50 -> n=3 cap 49',{'n_effective':3,'independent_sources':1,'ages_days':[26,26,26],'freshness_window_days':30,'match_quality':['9/10']*3},
  {'S':'3/10','D':'1/3','R':'17/30','Q':'9/10','C_raw_exact':'99/2','score':49,'level':'LOW'},M01+' §8; 09 Q3','100*(0.09+1/12+17/120+0.18)=49.5 -> 50 -> min(50,49 n<5,49 d<2,79 Q<1)=49. Scorer-level isolated input (09: n/d unit fixtures allowed).')
addv('CON-18','confidence','WIDE_SPREAD at n=3 (P90-P10)/M=0.32 > 0.30',{**std,'observations':obs([80000,100000,120000])},{'range_method':'MIN_MAX','reasons_include':['WIDE_SPREAD','FEW_COMPARABLES'],'score':49,'level':'LOW'},M01+' §6; 09 Q1',
  'P10: h=0.2 -> 80000+0.2*20000=84000; P90: h=1.8 -> 100000+0.8*20000=116000; 32000/100000=0.32. Display stays MIN_MAX 80000-120000.')
addv('CON-19','confidence','no WIDE_SPREAD at n=3 (P90-P10)/M=0.24',{**std,'observations':obs([85000,100000,115000])},{'reasons_exclude':['WIDE_SPREAD']},M01+' §6','P10 88000, P90 112000; 24000/100000=0.24.')
addv('FIL-17','filter','fractional age 13.5 d new -> admitted, R term 1-0.5*13.5/14',{**std,'observations':[{'price_pkr':100000,'age_seconds':1166400}]},{'admitted':[100000],'effective_age_days':13.5,'recency_term':'73/112'},M01+' §4','1-0.5*13.5/14 = 1-27/56 = 29/56?')
byid['FIL-17']['expected']['recency_term']='29/56'; byid['FIL-17']['notes']='1 - 0.5*13.5/14 = 1 - 13.5/28 = 14.5/28 = 29/56 (0.517857).'
addv('FIL-18','filter','new age 14 d + 1 ms -> STALE',{**std,'observations':[{'price_pkr':100000,'age_ms':1209600001}]},{'admitted':[],'excluded_by_reason':[{'code':'STALE','count':1}]},M01+' §4')
addv('FIL-19','filter','used age exactly 30 d (ms) admitted',{**std,'condition':'USED','used_grade':'GOOD','freshness_window_days':30,'observations':[{'price_pkr':60000,'age_ms':2592000000}]},{'admitted':[60000]},M01+' §4')
addv('FIL-20','filter','malformed observed_at -> INVALID_TIMESTAMP',{**std,'observations':[{'price_pkr':100000,'observed_at':'2026-13-45T99:00:00Z'}]},{'admitted':[],'excluded_by_reason':[{'code':'INVALID_TIMESTAMP','count':1}]},M01+' §4; 09 Q10')
addv('FIL-21','filter','valid observed_at but malformed source_updated_at -> INVALID_TIMESTAMP',{**std,'observations':[{'price_pkr':100000,'age_days':1,'source_updated_at':'not-a-date'}]},{'admitted':[],'excluded_by_reason':[{'code':'INVALID_TIMESTAMP','count':1}]},M01+' §4')
addv('FIL-22','filter','source_updated_at 301 s future, observed_at valid -> INVALID_TIMESTAMP',{**std,'observations':[{'price_pkr':100000,'age_days':1,'source_updated_at_age_seconds':-301}]},{'admitted':[],'excluded_by_reason':[{'code':'INVALID_TIMESTAMP','count':1}]},M01+' §4 ("either raw timestamp")')
addv('FIL-23','filter','5 offers from 3 owners -> n=3, d=3 (newest per owner)',{**std,'observations':[{'seller':'A','price_pkr':100000,'age_days':1},{'seller':'A','price_pkr':99000,'age_days':3},{'seller':'B','price_pkr':101000,'age_days':1},{'seller':'B','price_pkr':90000,'age_days':2},{'seller':'C','price_pkr':102000,'age_days':1}]},
  {'n_effective':3,'independent_sources':3,'included_prices':[100000,101000,102000],'excluded_by_reason':[{'code':'DUPLICATE','count':2}]},M01+' §2')
addv('FIL-24','filter','precedence: target listing that is also stale counts once as TARGET_LISTING',{**std,'target_listing_id':'L-T','observations':[{'id':'L-T','price_pkr':115000,'age_days':20}]},{'excluded_by_reason':[{'code':'TARGET_LISTING','count':1}]},M01+' §5')
addv('FIL-25','filter','precedence: out-of-stock AND stale -> NOT_IN_STOCK only',{**std,'observations':[{'price_pkr':100000,'availability':'OUT_OF_STOCK','age_days':20}]},{'excluded_by_reason':[{'code':'NOT_IN_STOCK','count':1}]},M01+' §5')
addv('OUT-06','outlier','one IQR trim then 0.60 gate fails (post-trim spread)',{**std,'observations':obs([40000,50000,60000,100000,110000,120000,130000,140000,900000])},
  {'result_state':'INSUFFICIENT_DATA','n_effective':8,'excluded_by_reason':[{'code':'STATISTICAL_OUTLIER','count':1}],'insufficient_reasons':['EXCESSIVE_SPREAD']},M01+' §6; 09 Q20',
  'n=9: Q1 h=2 -> 60000, Q3 h=6 -> 130000, IQR 70000, fences -45000/235000 -> trim 900000. n=8 median (100000+110000)/2=105000; (140000-40000)/105000=0.952>0.60.')
addv('OUT-07','outlier','no re-trim: second pass would remove 113000 but must not',{**std,'observations':obs([100000,101000,102000,103000,104000,105000,106000,112000,113000,400000])},
  {'result_state':'RANGE_AVAILABLE','n_effective':9,'range_method':'P10_P90','range_low_minor':10080000,'range_high_minor':11220000,'median_minor':10400000,'excluded_by_reason':[{'code':'STATISTICAL_OUTLIER','count':1}]},M01+' §6; 09 Q20',
  'Pass 1 (n=10): Q1 h=2.25 -> 102250; Q3 h=6.75 -> 106000+0.75*6000=110500; IQR 8250; upper fence 122875 -> trims 400000. A 2nd pass (n=9) would give Q1 102000, Q3 106000, fence 112000 and remove 113000: forbidden. n=9 median 104000; P10 h=0.8 -> 100800; P90 h=7.2 -> 112200.')
addv('OUT-08','outlier','all identical n=8 -> IQR 0, no warning',{**std,'observations':obs([100000]*8)},{'result_state':'RANGE_AVAILABLE','warnings':[],'median_minor':10000000},M01+' §6; 09 Q9')
addv('VER-17','verdict','asking negative -> 422 INVALID_ASKING_PRICE',{**std,'observations':obs(P5),'asking_price_minor':-100},{'http_status':422,'code':'INVALID_ASKING_PRICE'},M01+' §3')
addv('VER-18','verdict','asking non-integer minor 100.5 -> 422 INVALID_ASKING_PRICE',{**std,'observations':obs(P5),'asking_price_minor':100.5},{'http_status':422,'code':'INVALID_ASKING_PRICE'},M01+' §3')
addv('VER-19','verdict','NO_ASKING_PRICE + LOW (n=3) -> indicative=false, modifier=true',{**std,'observations':obs([100000,101000,102000]),'asking_price_minor':None},
  {'result_state':'RANGE_AVAILABLE','verdict_slot':'NO_ASKING_PRICE','indicative':False,'low_confidence_modifier':True,'confidence':{'level':'LOW'}},M01+' §8; 09 Q18')
byid['VER-14']['expected'].update(indicative=False); byid['VER-14']['spec_ref']=M01+' §5/§8; 09 Q18'
byid['PTA-02']['expected'].update(confidence={'score':49,'level':'LOW'}); byid['PTA-02']['expected']['indicative']=False; byid['PTA-02']['spec_ref']=M01+' §8; 09 Q17/Q18'
byid['PTA-03']['spec_ref']=M01+' §8; 09 Q17'
spec('PTA-04',M01+' §5; 09 Q8'); spec('FIL-09',M01+' §5; 09 Q8',notes='Zero/negative/instalment -> PRICE_NOT_COMPARABLE; USD -> UNSUPPORTED_CURRENCY (09 Q8).')
spec('PTA-06',M01+' §11',notes='Confidence recomputed at classified_at; with classify at check time ages unchanged -> 82.')
spec('CON-07',M01+' §8')
# normaliser: PRD-required notations now spec (09 table)
spec('NRM-21',M01+' §3 (case-insensitive suffix)',{'ok':True,'amount_minor':12500000})
spec('NRM-23',M01+' §3; 09',{'ok':True,'amount_minor':120},'Bare decimal keeps its meaning 1.2 PKR; never infer lakh. Plausibility flag pending category bounds (P1).')
spec('NRM-26',M01+' §3',{'ok':False},'Multiple price tokens must not yield one silent value (candidates + confirmation at extraction level).')
spec('NRM-27',M01+' §3',{'ok':False},'EMI-only target is not a cash price; ask for full PKR cash price.')
spec('NRM-30','03 API v0.4 PriceNormalizationError; '+M01+' §3',{'ok':False,'reason':'UNSUPPORTED_CURRENCY'},'ASSUMPTION that normalisePkr itself returns UNSUPPORTED_CURRENCY for "$" (type exists in v0.4).')
byid['NRM-30']['basis']='assumption'
spec('NRM-33',M01+' §3',{'ok':False,'reason':'NOT_A_NUMBER'})
spec('NRM-31',M01+' §3'); spec('NRM-32',M01+' §3')
for i in ('NRM-20','NRM-22'): byid[i]['expected']['open_question']='PM/Founder (09: Q11-Q16 not approved): '+byid[i]['expected']['open_question']
byid['NRM-24']['expected']['open_question']='P1 PM/Founder: category plausibility bounds; "500" parses to 50000 paisa technically.'
for i in ('NRM-24','NRM-20','NRM-22','NRM-34'): byid[i]['basis']='TBD'
# remaining assumptions get refs
for v in V:
    v.setdefault('spec_ref',GREF.get(v['group'],'') if v['basis']=='spec' else None)
    if v['basis']=='spec' and isinstance(v['expected'],dict) and str(v['expected'].get('status','')).startswith('TBD'): v['basis']='TBD'

json.dump({'_changelog':['v1.2 2026-11-09 ~01:00 PKT: rebased to authoritative 02-pricing-methodology-v0.1, 03 API v0.4 and 09-qa-answers; all cto-ruling-via-message -> spec with spec_ref; resolved TBDs CON-10, INS-09, VER-15, OUT-03 (+NRM-21/23/26/27/33 normaliser rules); applied CTO corrections CON-12 (72), NRM-25 (12,345,600), FIL-08 (seller owners), NRM-34 (TBD bounds), CLS-01/02 (check age <=24 h); added boundary vectors.','v1.1 2026-11-09 ~00:50 PKT: added basis field; applied CTO rulings reported by Engineer (agent msg 00:39 PKT, not seen by QA, not yet in 02-methodology); resolved RNG-05, FIL-03, NRM-25/31/32; added FIL-13..16, BND-01/02, NEX-01..03, GEO-01..04, NRM-40..45.','v1.0 2026-11-09 ~00:45 PKT: initial'],'_label':'SYNTHETIC DATA - not real market prices. Expected values derived from cto/02-pricing-methodology-v0.md and cto/03-api-contract-v0.md (9 Nov 2026). Not executed against any engine.',
           'money_unit':'amount_minor = PKR paisa (integer); exact rationals shown as "num/den" strings where non-integer',
           'vectors':V},open('../pricing-engine-test-vectors.json','w'),indent=1,ensure_ascii=False,default=str)
print(len(V))
