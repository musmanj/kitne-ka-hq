// Display only: never infer a verdict or Fair thresholds from these strings.
function difference(diff_percent,serverVerdict,locale='en-PK'){
 if(diff_percent==null)return null;
 if(!Number.isFinite(diff_percent))throw Error('Invalid server fraction');
 const pct=new Intl.NumberFormat(locale,{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1});
 const displayed=Number(new Intl.NumberFormat('en-US',{minimumFractionDigits:1,maximumFractionDigits:1}).format(diff_percent*100));
 if(serverVerdict==='HIGH'&&displayed===10)return 'just over 10% above the market median';
 if(serverVerdict==='UNUSUALLY_LOW'&&displayed===-15)return 'just under −15% relative to the market median';
 return pct.format(Math.abs(diff_percent))+(diff_percent<0?' below the market median':diff_percent>0?' above the market median':' at the market median');
}
module.exports={difference};
if(require.main===module){const assert=require('assert');const cases=[
 [.127451,'HIGH','12.7% above the market median'],
 [.0588235,'FAIR','5.9% above the market median'],
 [.1004,'HIGH','just over 10% above the market median'],
 [.1,'FAIR','10.0% above the market median'],
 [-.15,'FAIR','15.0% below the market median'],
 [-.15004,'UNUSUALLY_LOW','just under −15% relative to the market median'],
 [-.1666667,'UNUSUALLY_LOW','16.7% below the market median'],
 [null,'NO_ASKING_PRICE',null],
 [.0882,'FAIR','8.8% above the market median']];
 cases.forEach(([d,v,w])=>assert.equal(difference(d,v),w));console.log(cases.length+' display tests pass; no server verdict calculation tested.');}
