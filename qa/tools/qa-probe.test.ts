import { test } from 'vitest';
import { normalisePkr, quantile, median, verdictFor, scoreConfidence, rat } from '../src/index';
test('probe', () => {
  const raws = ['Rs 1,25,000','125k','1.25 lac','1.25 lakh','PKR 125000/-','85k','1.2 lac','1.2L','1,20,000','₨ 120,000','Rs. 85,000','1 crore','12.5k','۱,۲۵,۰۰۰','125K','1.2','500','Rs 0','-25000','','$500','1.234567 lac'];
  for (const r of raws) console.log('NRM', JSON.stringify(r), JSON.stringify(normalisePkr(r)));
  const P5=[98000,100000,102000,104000,106000].map(x=>x*100);
  console.log('Q', quantile(P5,1,10), quantile(P5,9,10), median(P5));
  const M=rat(10000000n);
  for (const a of [8499999,8500000,8500100,11000000,11000001]) console.log('V',a,JSON.stringify(verdictFor(a,M)));
  const R=(1-0.5*14/14);
  console.log('C tie', JSON.stringify(scoreConfidence({n:7,d:3,recency:R,quality:1,wide:false,attributeMatch:false})));
  console.log('C 79.96', JSON.stringify(scoreConfidence({n:6,d:3,recency:1-0.5*9/14,quality:1,wide:false,attributeMatch:false}).score));
  console.log('C ex', JSON.stringify(scoreConfidence({n:5,d:3,recency:25/28,quality:1,wide:false,attributeMatch:false}).score));
});
