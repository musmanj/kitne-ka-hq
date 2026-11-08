from pathlib import Path
from PIL import Image
p=Path(__file__).parent/'png'
for name in ['share-normal','share-indicative','share-normal-fallback','share-indicative-fallback']:
 im=Image.open(p/(name+'.png'))
 assert im.size==(2160,2700)
 for width in [180,270,320,360]:
  im.resize((width,round(width*1.25)),Image.Resampling.LANCZOS).save(p/(name+f'-thumb-{width}.png'))
 if 'fallback' not in name:im.resize((270,338),Image.Resampling.LANCZOS).save(p/(name+'-thumbnail.png'))
print('16 sized thumbnails + 2 current legacy-name previews generated.')
