"""QA reference oracle for pricing methodology v0 (CTO 02-pricing-methodology-v0.md).
Used ONLY to double-check hand arithmetic in pricing-engine-test-vectors. Not product code,
not evidence that the engine works. Exact rational arithmetic (fractions) per §4.7."""
from fractions import Fraction as F
import math
def q(vals,p):
    s=sorted(F(v) for v in vals); n=len(s); h=(n-1)*F(p); lo=math.floor(h)
    return s[lo] if lo>=n-1 else s[lo]+(h-lo)*(s[lo+1]-s[lo])
def median(v): return q(v,F(1,2))
def iqr_trim(v):
    if len(v)<8: return list(v),[],None
    q1,q3=q(v,F(1,4)),q(v,F(3,4)); i=q3-q1
    if i==0: return list(v),[],'IQR_ZERO'
    lo,hi=q1-F(3,2)*i,q3+F(3,2)*i
    return [x for x in v if lo<=x<=hi],[x for x in v if x<lo or x>hi],(q1,q3,lo,hi)
def pool(v):
    k,out,info=iqr_trim(v); n=len(k)
    if n<3: return dict(state='INSUFFICIENT_DATA',reason='TOO_FEW_COMPARABLES',n=n,trimmed=out,info=info)
    M=median(k)
    if (max(k)-min(k))/M>F(3,5): return dict(state='INSUFFICIENT_DATA',reason='EXCESSIVE_SPREAD',n=n,spread=(max(k)-min(k))/M,trimmed=out,info=info)
    if n<5: lo,hi,m='%s'%min(k),'%s'%max(k),'MIN_MAX'
    else: lo,hi,m=q(k,F(1,10)),q(k,F(9,10)),'P10_P90'
    return dict(state='RANGE',n=n,median=M,low=F(lo),high=F(hi),method=m,trimmed=out,info=info)
def verdict(A,M):
    if A is None: return 'NO_ASKING_PRICE',None
    d=100*(F(A)-M)/M
    return ('UNUSUALLY_LOW' if d<-15 else 'HIGH' if d>10 else 'FAIR'),d
def conf(n,d,ages,W,Qs,P10=None,P90=None,M=None,pta_unconfirmed=False):
    S=min(F(n,10),1); D=min(F(d,3),1); R=sum(1-F(1,2)*F(a)/W for a in ages)/len(ages); Q=sum(F(x) for x in Qs)/len(Qs)
    raw=100*(F(3,10)*S+F(1,4)*D+F(1,4)*R+F(1,5)*Q)
    fl=math.floor(raw); fr=raw-fl
    c=fl+1 if fr>F(1,2) or (fr==F(1,2) and fl%2==1) else fl  # half-even once (02 v0.1 §8)
    caps=[]
    if n<5 or d<2: caps.append(49)
    if pta_unconfirmed: caps.append(49)
    if (P10 is not None and (P90-P10)/M>F(3,10)) or any(F(x)<1 for x in Qs): caps.append(79)
    s=min([c]+caps); lvl='LOW' if s<=49 else 'MEDIUM' if s<=79 else 'HIGH'
    return dict(raw=raw,raw_float=float(raw),score=s,level=lvl,S=S,D=D,R=R,Q=Q)
if __name__=='__main__':
    p=pool([98000,100000,102000,104000,106000]); print(p, verdict(115000,p['median']))
    print(conf(5,3,[1,2,3,4,5],14,[1]*5))
