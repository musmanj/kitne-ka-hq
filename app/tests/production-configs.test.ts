/** SYNTHETIC evidence/schema only; actual approved POLICY metadata is D-008. */
import {describe,expect,it} from 'vitest';
import {CATEGORIES,PRODUCTION_CATEGORY_CONFIGS,withApprovedProductionPolicy,configuredPriceBounds,parseApprovedPolicy,evaluateCheck,type CategoryConfig} from '../src';
import {syntheticInput} from '../src/fixtures/synthetic';
describe('D-008 Founder-approved bounds: gates clear, not a production rollout',()=>{
 it.each([['phones',150000,150000000],['laptops',500000,300000000],['consoles',500000,90000000]] as const)('%s approved policy clears CONFIGURATION_REQUIRED with explicitly SYNTHETIC schema', (id,min,max)=>{
  const p=PRODUCTION_CATEGORY_CONFIGS[id]; expect(p).toMatchObject({version:'1.0.0',config_version:'1.0.0',approval_status:'APPROVED',approver_allowlist:['musmanj'],price_bounds_minor:{min,max,basis:'APPROVED'},approval_scope:{approved_by:'musmanj',approved_at:'2026-11-08T20:41:00Z',source_ref:'pm/config-bounds-proposal.md v0.2 §1.1-1.2; D-008'}});
  const config=withApprovedProductionPolicy(CATEGORIES[id]!);expect(parseApprovedPolicy(config)).not.toBeNull();expect(configuredPriceBounds(config)).toEqual({min,max});
 });
 it('approved phones test evaluation produces RANGE_AVAILABLE instead of CFG-01 config503',()=>{
  const x=syntheticInput();x.config=withApprovedProductionPolicy(x.config);x.variant.config_version=x.config.version;x.candidates.forEach(c=>{c.variant.config_version=x.config.version;});
  expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');
  x.config={...x.config,approver_allowlist:[]};expect(evaluateCheck(x).result).toMatchObject({result_state:'ERROR',error:{code:'CONFIGURATION_REQUIRED',http_status:503}});
 });
 it('missing or placeholder approval still503; SYNTHETIC fixtures unchanged',()=>{
  const base=withApprovedProductionPolicy(CATEGORIES.phones!);
  for(const patch of [{approval_status:'PENDING'},{approver_allowlist:null},{approval_scope:{...base.approval_scope!,source_ref:'TBD'}}]) expect(()=>configuredPriceBounds({...base,...patch} as CategoryConfig)).toThrow('CONFIGURATION_REQUIRED');
  expect(CATEGORIES.phones!.environment).toBe('SYNTHETIC');expect(syntheticInput().variant.config_version).toBe('synthetic-v0');expect(evaluateCheck(syntheticInput()).result.result_state).toBe('RANGE_AVAILABLE');
 });
});
