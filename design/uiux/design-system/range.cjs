// C1 geometry only: server values, uniform monetary scale, numeric axis always LTR.
function geometry({low,high,median,fairLow,fairHigh,asking=null,verdict=null,domain=null}){
 for(const n of [low,high,median,fairLow,fairHigh])if(!Number.isFinite(n))throw Error('Missing server range/band');
 if(high<=low||fairHigh<=fairLow||median<low||median>high)throw Error('Invalid server range');
 if(asking!==null&&!Number.isFinite(asking))throw Error('Invalid asking price');
 const min=Math.min(low,fairLow,...(asking===null?[]:[asking])),max=Math.max(high,fairHigh,...(asking===null?[]:[asking]));
 const padding=(max-min)*.05,start=domain?.start??min-padding,end=domain?.end??max+padding;
 if(end<=start)throw Error('Invalid axis domain');
 const percent=n=>(n-start)/(end-start)*100;
 const raw=asking===null?null:percent(asking),marker=raw===null?null:Math.max(0,Math.min(100,raw));
 return {start,end,padding,rangeStart:percent(low),rangeEnd:percent(high),median:percent(median),fairStart:percent(fairLow),fairEnd:percent(fairHigh),marker,clamped:raw!==null&&raw!==marker,overflow:asking===null?null:asking<low?'below':asking>high?'above':'inside',arrow:raw===null?'':raw<0?'←':raw>100?'→':'',verdict,labelMode:'text',labelAnchors:{low:percent(low),high:percent(high)},fairTagAnchor:percent(fairLow),medianLabelAnchor:percent(median)};
}
module.exports={geometry};
if(require.main===module){const assert=require('assert'),f={low:98800,high:105200,median:102000,fairLow:86700,fairHigh:112200};let count=0;function test(t,fn){fn();count++;console.log('PASS',t)}
 test('No price retains Fair band, no marker',()=>{let g=geometry(f);assert.equal(g.marker,null);assert(g.fairStart<g.rangeStart&&g.fairEnd>g.rangeEnd)});
 test('High marker beyond listings/Fair but true position',()=>{let g=geometry({...f,asking:115000});assert(g.marker>g.fairEnd&&g.marker>g.rangeEnd);assert(!g.clamped)});
 test('Fair 108000 beyond listings inside Fair band',()=>{let g=geometry({...f,asking:108000});assert(g.marker>g.rangeEnd&&g.marker<g.fairEnd)});
 test('Low 85000 below Fair/listings',()=>{let g=geometry({...f,asking:85000});assert(g.marker<g.fairStart&&g.marker<g.rangeStart)});
 test('Inside 102000 sits on median',()=>assert.equal(geometry({...f,asking:102000}).marker,geometry({...f,asking:102000}).median));
 test('Extreme high expands domain rather than clamping',()=>{let g=geometry({...f,asking:999999});assert(!g.clamped);assert(g.end>999999)});
 test('Extreme low expands domain rather than clamping',()=>{let g=geometry({...f,asking:1});assert(!g.clamped);assert(g.start<1)});
 test('RTL numeric axis stays LTR',()=>assert.deepEqual(geometry({...f,asking:115000,rtl:true}),geometry({...f,asking:115000})));
 test('Missing server Fair band rejected',()=>assert.throws(()=>geometry({...f,fairLow:null})));
 test('Server verdict passed through',()=>assert.equal(geometry({...f,asking:108000,verdict:'HIGH'}).verdict,'HIGH'));
 test('Domain includes asking + exact 5 percent span padding',()=>{let g=geometry({...f,asking:115000});assert.equal(g.start,85285);assert.equal(g.end,116415);assert.equal(g.padding,1415)});
 test('No-price domain includes Fair bounds + 5 percent padding',()=>{let g=geometry(f);assert.equal(g.start,85425);assert.equal(g.end,113475)});
 test('Labels anchored to dark segment, not Fair edges',()=>{let g=geometry(f);assert.equal(g.labelAnchors.low,g.rangeStart);assert.equal(g.labelAnchors.high,g.rangeEnd);assert.notEqual(g.labelAnchors.low,g.fairStart);assert.equal(g.labelMode,'text')});
 test('Fair tag and Median label anchor their own shapes',()=>{let g=geometry(f);assert.equal(g.fairTagAnchor,g.fairStart);assert.equal(g.medianLabelAnchor,g.median)});
 test('Uniform linear positions',()=>{let g=geometry({...f,asking:115000});assert(Math.abs(g.marker-(115000-g.start)/(g.end-g.start)*100)<1e-10)});
 test('Explicit frozen-domain outlier clamps right only beyond domain',()=>{let g=geometry({...f,asking:999999,domain:{start:85285,end:116415}});assert.equal(g.marker,100);assert(g.clamped);assert.equal(g.arrow,'→')});
 test('Explicit frozen-domain outlier clamps left only beyond domain',()=>{let g=geometry({...f,asking:1,domain:{start:85285,end:116415}});assert.equal(g.marker,0);assert(g.clamped);assert.equal(g.arrow,'←')});
 console.log(count+' geometry tests pass; no pricing engine tested.');}
