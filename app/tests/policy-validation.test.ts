/** SYNTHETIC policy approvals ONLY; no production artifact or real approver. */
import {describe,expect,it} from 'vitest';
import {isPlaceholder,parseApprovedPolicy,strictSemver,configuredPriceBounds,type CategoryConfig} from '../src';
import {syntheticInput} from '../src/fixtures/synthetic';
function policy():CategoryConfig {return {...syntheticInput().config,version:'1.2.3',config_version:'1.2.3',environment:'PRODUCTION',approval_status:'APPROVED',
 price_bounds_minor:{min:150000,max:150000000,basis:'APPROVED'},approver_allowlist:['SYNTHETIC-approver'],
 approval_scope:{category_id:'phones',conditions:['NEW_SEALED','USED'],approved_by:'SYNTHETIC-approver',approved_at:'2026-11-09T00:00:00Z',source_ref:'qa/SYNTHETIC-policy.md'}};}
describe('CTO strict approved policy schema and placeholder safety net',()=>{
 it.each(['','  ','TBD',' todo ','Pending','<Founder>','GP-<date>-001','SYNTHETIC-PENDING'])('placeholder %s',v=>expect(isPlaceholder(v)).toBe(true));
 it.each(['SYNTHETIC-approver','qa/policy.md','1.2.3'])('non-placeholder %s',v=>expect(isPlaceholder(v)).toBe(false));
 it.each(['1.2.3','0.0.0','1.0.0-alpha.1','2.0.0+build.3'])('valid strict semver %s',v=>expect(strictSemver(v)).toBe(true));
 it.each(['v1.2.3','01.2.3','1.2','1.2.3-01','1.2.3 ','TBD','1.0.0-PENDING'])('invalid strict semver %s',v=>expect(strictSemver(v)).toBe(false));
 it('normalises approver/source outer whitespace, exact-case membership, valid gate-pack/path',()=>{
  const p=policy();p.approval_scope!.approved_by=' SYNTHETIC-approver ';p.approval_scope!.source_ref=' GP-20261109-001 ';
  expect(parseApprovedPolicy(p)?.approval_scope).toMatchObject({approved_by:'SYNTHETIC-approver',source_ref:'GP-20261109-001'});
  expect(configuredPriceBounds(p)).toEqual({min:150000,max:150000000});
 });
 it.each(['pm/config-bounds-proposal.md v0.2 §1.1-1.2; D-008','docs/policy.md; GP-20261109-001','D-008','qa/policy.md §1.2.3'])('valid exact citation grammar %s',source=>{const p=policy();p.approval_scope!.source_ref=source;expect(parseApprovedPolicy(p)).not.toBeNull();});
 it.each(['qa/policy.md;D-008','qa/policy.md;  D-008','qa/policy.md v01.2','qa/policy.md v1','qa/policy.md §','D-008; ','qa/../policy.md; D-008','D-008; TODO'])('bad compound citation fails closed %s',source=>{const p=policy();p.approval_scope!.source_ref=source;expect(parseApprovedPolicy(p)).toBeNull();});
 it.each(['bad id','1starts-digit','ab','<Founder>','PENDING'])('allowlist entry itself invalid %s',id=>{const p=policy();p.approver_allowlist=[id];p.approval_scope!.approved_by=id;expect(parseApprovedPolicy(p)).toBeNull();});
 it.each(['qa/policy.md section1','https://example.invalid/policy.md','/qa/policy.md','qa/../policy.md','qa//policy.md','../policy.md','TBD','  '])('invalid source format %s',source=>{const p=policy();p.approval_scope!.source_ref=source;expect(parseApprovedPolicy(p)).toBeNull();});
 it.each(['2026-11-09T00:00:00+00:00','2026-11-09','2026-02-30T00:00:00Z','TODO'])('UTC timestamp format %s rejected',approved_at=>{const p=policy();p.approval_scope!.approved_at=approved_at;expect(parseApprovedPolicy(p)).toBeNull();});
 it.each(['condition','version','config_version','case','root','scope','bounds','attribute','required_when','allowlist-extra'])('%s bad policy always maps503',kind=>{
  const p=policy();
  if(kind==='condition') p.approval_scope!.conditions.push('TBD' as 'USED');
  if(kind==='version') p.version='synthetic-v0';
  if(kind==='config_version') p.config_version='PENDING';
  if(kind==='case') p.approval_scope!.approved_by='synthetic-approver';
  if(kind==='root') Object.assign(p,{unrecognised:true});
  if(kind==='scope') Object.assign(p.approval_scope!,{unrecognised:true});
  if(kind==='bounds') Object.assign(p.price_bounds_minor!,{unrecognised:true});
  if(kind==='attribute') Object.assign(p.attributes[0]!,{unrecognised:true});
  if(kind==='required_when') p.attributes[0]!.required_when={unrecognised:'x'};
  if(kind==='allowlist-extra') p.approver_allowlist=['SYNTHETIC-approver','TBD'];
  expect(parseApprovedPolicy(p)).toBeNull();expect(()=>configuredPriceBounds(p)).toThrow('CONFIGURATION_REQUIRED');
 });
});
