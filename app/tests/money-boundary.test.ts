/** SYNTHETIC malformed boundary cases; never real prices or personal data. */
import { describe, expect, it } from 'vitest';
import { classify, evaluateCheck, isStrictMoney, type Money } from '../src';
import { syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
const cases: Array<[string, unknown]> = [
  ['fractional',{amount_minor:100000.5,currency:'PKR'}],['string amount',{amount_minor:'100000',currency:'PKR'}],
  ['missing currency',{amount_minor:100000}],['foreign',{amount_minor:100000,currency:'USD'}],
  ['NaN',{amount_minor:NaN,currency:'PKR'}],['extra key',{amount_minor:100000,currency:'PKR',note:'SYNTHETIC-CANARY'}],
  ['bare string','100000'],['array',[100000,'PKR']],['lowercase',{amount_minor:100000,currency:'pkr'}],
  ['missing amount',{currency:'PKR'}],['zero',{amount_minor:0,currency:'PKR'}],['negative',{amount_minor:-1,currency:'PKR'}],
  ['Infinity',{amount_minor:Infinity,currency:'PKR'}],['unsafe',{amount_minor:Number.MAX_SAFE_INTEGER+1,currency:'PKR'}]
];
describe('API v0.7 §asking technical validity / methodology0.1 §3 strict Money',()=>{
 it.each(cases)('%s rejected422 consistently by check/classify, before bounds',(_name,raw)=>{
  const input=syntheticInput();input.asking_price=raw as Money;
  expect(isStrictMoney(raw)).toBe(false);
  const evaluated=evaluateCheck(input);
  expect(evaluated.result).toMatchObject({result_state:'ERROR',data:null,error:{code:'INVALID_ASKING_PRICE',http_status:422,message_key:'errors.price.invalid',retryable:false}});
  expect(evaluated.snapshot.input.asking_price).toBeNull();
  expect(classify(evaluateCheck(syntheticInput()).snapshot,{asking_price:raw as Money},{now:SYNTHETIC_NOW,expected_version:1,idempotency_key:'SYNTHETIC-money',capability_valid:true,resource_known:true,evidence_valid:true})).toMatchObject({ok:false,error:{code:'INVALID_ASKING_PRICE',http_status:422}});
 });
 it('rejects inherited/accessor/non-enumerable/symbol extras without invoking a getter',()=>{
  expect(isStrictMoney(Object.create({amount_minor:1,currency:'PKR'}))).toBe(false);
  const accessor={get amount_minor(){throw new Error('SYNTHETIC-not-invoked')},currency:'PKR'};
  expect(isStrictMoney(accessor)).toBe(false);const input=syntheticInput();input.asking_price=accessor as unknown as Money;
  expect(evaluateCheck(input).result).toMatchObject({error:{code:'INVALID_ASKING_PRICE',http_status:422}});
  expect(isStrictMoney(Object.defineProperty({amount_minor:1,currency:'PKR'},'extra',{value:1}))).toBe(false);
  expect(isStrictMoney({amount_minor:1,currency:'PKR',[Symbol('SYNTHETIC')]:1})).toBe(false);
 });
 it('valid positive safe endpoints accepted by validator; null remains no-price, not invalid',()=>{
  expect(isStrictMoney({amount_minor:1,currency:'PKR'})).toBe(true);expect(isStrictMoney({amount_minor:Number.MAX_SAFE_INTEGER,currency:'PKR'})).toBe(true);
  const input=syntheticInput();input.asking_price=null;expect(evaluateCheck(input).result.result_state).toBe('RANGE_AVAILABLE');
 });
});
