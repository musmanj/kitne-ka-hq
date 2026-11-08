/** Logical inline position; mirror arrow glyph in RTL. No price => no marker. */
function marker(low,high,asking,rtl=false){
 if(!Number.isFinite(low)||!Number.isFinite(high)||high<=low)throw new Error('Invalid evidence range');
 if(asking==null)return null;
 if(!Number.isFinite(asking))throw new Error('Invalid asking price');
 const raw=(asking-low)/(high-low),clamped=Math.max(0,Math.min(1,raw));
 const direction=raw<0?'below':raw>1?'above':'inside';
 return {inlinePercent:clamped*100,direction,arrow:direction==='inside'?'▼':direction==='below'?(rtl?'→':'←'):(rtl?'←':'→'),asking};
}
module.exports={marker};
if(require.main===module){const assert=require('assert');assert.equal(marker(160000,180000,null),null);assert.equal(marker(160000,180000,185000).inlinePercent,100);assert.equal(marker(160000,180000,150000).inlinePercent,0);assert.equal(marker(160000,180000,170000).inlinePercent,50);assert.equal(marker(160000,180000,185000,true).arrow,'←');console.log('Range clamp: 5 tests pass');}
