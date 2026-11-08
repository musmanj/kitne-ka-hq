from pathlib import Path
from PIL import Image,ImageStat
from bs4 import BeautifulSoup
import json,re
p=Path(__file__).parent;frames=json.loads((p/'d4-frames.json').read_text());metrics=json.loads((p/'d4-measurements.json').read_text());lookup={(f['folder'],f['name']):f for f in frames}
assert len(metrics)==len(frames)==33
for m in metrics:
 f=lookup[(m['folder'],m['name'])];assert m['width']==f['width'],m['name'];assert not m['shareOverlap'],m['name']
 clean=p/f['folder']/'png'/(f['name']+'.png');im=Image.open(clean)
 assert im.width==f['width']*2,(f['name'],im.size)
 if f['share']:assert im.size==(2160,2700)
 annotated=Image.open(p/f['folder']/'png/annotated'/(f['name']+'.png'));assert annotated.width==(f['width']+352)*2
 soup=BeautifulSoup((p/f['folder']/(f['name']+'.html')).read_text(),'html.parser');text=soup.main.get_text(' ',strip=True)
 assert not re.search(r'midpoint|delta_pct|pending CTO|Option A illustrative',text,re.I),f['name']
 assert soup.select_one('.annotations') and soup.select_one('.annotation-toggle')
 for bar in soup.main.select('.range-v2'):
  assert bar.get('dir')=='ltr' and bar.select_one('.most-listings') and bar.select_one('.fair-tag') and bar.select_one('.median-label'),f['name']
  assert not bar.select('.range-ends'),f['name']
 if f['share']:assert not soup.main.select('.ask-value'),f['name']
 if f['name'].startswith('results-no-price') or f['name'].startswith('results-pta-split'):
  assert not soup.main.select('.indicative-chip'),f['name']
 if f['name'].startswith('results-no-price'):
  assert soup.main.select('.fair-zone') and not soup.main.select('.ask-marker')
allpng=list(p.rglob('*.png'));newpng=[f for folder in ['hifi','responsive','rtl'] for f in (p/folder/'png').rglob('*.png')]
rows=[]
for f in sorted(allpng):
 im=Image.open(f).convert('RGB');s=ImageStat.Stat(im).stddev;assert min(s)>1,(f,s);assert f.stat().st_size>1000,f
 if f in newpng:rows.append(f'| {f.relative_to(p)} | {im.width}×{im.height} | {f.stat().st_size} |')
report='# D4 export verification\n\n'+f'{len(frames)} frames, each with clean + margin-annotated DPR2 PNG. {len(newpng)} current D4 PNGs including thumbnails/emulations; all decoded and nonblank. Also checked all {len(allpng)} PNGs in UIUX tree (including unchanged D2 flows/low-fi): nonblank RGB standard deviation >1 and size>1000 bytes.\n\nNo horizontal overflow in 33 clean layouts; no share verdict/footer overlap; share canvases2160×2700. Clean mobile720px physical width;768/1280 at1536/2560; annotated adds704 physical px margin. No-price has Fair zone/no marker; no-price/split have no Indicative chip. Stale median terminology and developer meta not present in main UI.\n\n|File|Physical pixels|Bytes|\n|---|---|---|\n'+'\n'.join(rows)+'\n'
(p/'d4-verification.md').write_text(report)
for folder in ['hifi','responsive','rtl']:
 (p/folder/'measurements.json').write_text(json.dumps([m for m in metrics if m['folder']==folder],indent=2)+'\n')
 (p/folder/'verification.md').write_text('# Current D4 verification\n\nSee [full D4 verification](../d4-verification.md). '+str(sum(1 for f in newpng if f.is_relative_to(p/folder)))+' PNGs in this folder, all nonblank. Clean and annotated exports are separated.\n')
print(f'{len(frames)} frames; {len(newpng)} D4 PNGs; {len(allpng)} total PNGs nonblank; layout checks pass.')
