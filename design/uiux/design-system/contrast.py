from pathlib import Path
import json
p=Path(__file__).parent
c={k:'#'+''.join(f'{round(x*255):02X}' for x in v['$value']['components']) for k,v in json.loads((p/'tokens.json').read_text())['color'].items()}
def lum(s):
 rgb=[int(s[i:i+2],16)/255 for i in (1,3,5)];rgb=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in rgb]
 return sum(a*b for a,b in zip(rgb,[.2126,.7152,.0722]))
rows=[];fail=[]
for x in json.loads((p/'contrast-pairs.json').read_text()):
 a,b=sorted([lum(c[x['foreground']]),lum(c[x['background']])]);r=(b+.05)/(a+.05);ok=r>=x['minimum'];rows.append(f"| {x['name']} | {c[x['foreground']]} / {c[x['background']]} | {x['kind']} | {r:.2f}:1 | {x['minimum']}:1 | {'PASS' if ok else 'FAIL'} |")
 if not ok:fail.append(x['name'])
(p/'contrast-report.md').write_text('# WCAG contrast report\n\nComputed from sRGB relative luminance (WCAG formula). Text minimum 4.5:1; large text and non-text UI minimum 3:1. All defined text uses the stricter 4.5:1. Disabled controls also tested though exempt. Focus ring separated from filled controls by a 3px surface gap. Shadows are decorative, not boundaries. No translucent text. Skeleton uses border as its meaningful boundary; shading is decorative. This is pair coverage, not a complete accessibility audit.\n\n'+f'{len(rows)-len(fail)}/{len(rows)} pairs pass.\n\n|Pair|Colors|Type|Ratio|Minimum|Result|\n|---|---|---|---|---|---|\n'+'\n'.join(rows)+'\n')
print('Contrast:',len(rows)-len(fail),'/',len(rows),'pass',fail)
assert not fail
