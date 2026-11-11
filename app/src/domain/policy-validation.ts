import { canonicalConfigData, policyDataShape, policyUtf8Bytes, POLICY_MAX_SERIALIZED_BYTES, POLICY_MAX_NODES, POLICY_MAX_DEPTH } from './policy-budgets';
export { canonicalConfigData } from './policy-budgets';
import { canonicalId, isRecord } from './canonical';
import type { CategoryConfig } from './types';
/** CTO strict-policy ruling9Nov01:39PKT. Pure; no approval is inferred. */
export function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const s = value.trim();
  return !s || /[<>]/.test(s) || /(?:^|[^a-z0-9])(?:TBD|TODO|PENDING)(?:$|[^a-z0-9])/i.test(s);
}
export const APPROVER_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{2,63}$/;
const REPO_REFERENCE = '(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9._-]+\\.md(?: v(?:0|[1-9][0-9]*)\\.(?:0|[1-9][0-9]*))?(?: §[0-9]+(?:\\.[0-9]+)*(?:-[0-9]+(?:\\.[0-9]+)*)?)?';
const REFERENCE_ATOM = `(?:${REPO_REFERENCE}|D-[0-9]{3}|GP-[0-9]{8}-[0-9]{3})`;
/** D-008 steering9Nov01:42PKT: semicolon+space separated canonical references. */
export const SOURCE_REFERENCE_PATTERN = new RegExp(`^${REFERENCE_ATOM}(?:; ${REFERENCE_ATOM})*$`);
export function strictSemver(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 128 || isPlaceholder(value)) return false;
  const m = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(value);
  return !!m && (!m[4] || m[4].split('.').every(p => !/^[0-9]+$/.test(p) || p === '0' || !p.startsWith('0')));
}
function exactKeys(o: Record<string,unknown>, allowed: readonly string[], required: readonly string[] = allowed): boolean {
  return Reflect.ownKeys(o).every(k => typeof k === 'string' && allowed.includes(k)) && required.every(k => Object.hasOwn(o,k));
}
function utcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || isPlaceholder(value) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.[0-9]{1,3})?Z$/.test(value)) return false;
  const t=Date.parse(value); return Number.isFinite(t) && new Date(t).toISOString().slice(0,19)===value.slice(0,19);
}
const validId = (x: unknown): x is string => typeof x === 'string' && !isPlaceholder(x) && APPROVER_ID_PATTERN.test(x);
/** Strict entire CategoryConfig schema for APPROVED policy only. SYNTHETIC technical
 * fixtures are separately gated and are NOT production policy/approval artifacts. */
function parsePolicy(raw: unknown, synthetic: boolean): CategoryConfig | null {
  if (!isRecord(raw) || !exactKeys(raw,['id','version','config_version','label_key','attributes','condition_values','used_grade_values','price_bounds_minor','environment','approval_status','approval_scope','approver_allowlist'],
    synthetic ? ['id','version','label_key','attributes','condition_values','used_grade_values','price_bounds_minor','environment'] : ['id','version','label_key','attributes','condition_values','used_grade_values','price_bounds_minor','environment','approval_status','approval_scope','approver_allowlist'])) return null;
  if (!canonicalId(raw.id) || isPlaceholder(raw.id) || !(synthetic ? typeof raw.version==='string' && /^synthetic[A-Za-z0-9._-]*$/.test(raw.version) : strictSemver(raw.version)) || (Object.hasOwn(raw,'config_version') && (raw.config_version!==raw.version || (!synthetic && !strictSemver(raw.config_version)))) ||
    (synthetic ? raw.environment!=='SYNTHETIC' : raw.environment!=='PRODUCTION' || raw.approval_status!=='APPROVED') || typeof raw.label_key!=='string' || isPlaceholder(raw.label_key)) return null;
  const b=raw.price_bounds_minor, a=raw.approval_scope;
  if (!isRecord(b) || !exactKeys(b,['min','max','basis']) || b.basis!==(synthetic ? 'SYNTHETIC' : 'APPROVED') || !Number.isSafeInteger(b.min) || !Number.isSafeInteger(b.max) || (b.min as number)<1 || (b.max as number)<(b.min as number)) return null;
  if (!synthetic || a!==undefined) {
  if (!isRecord(a) || !exactKeys(a,['category_id','conditions','approved_by','approved_at','source_ref']) || a.category_id!==raw.id || isPlaceholder(a.category_id) ||
    typeof a.approved_by!=='string' || !validId(a.approved_by.trim()) || !utcTimestamp(a.approved_at) || typeof a.source_ref!=='string') return null;
  const source=a.source_ref.trim(), approved_by=a.approved_by.trim();
  if (isPlaceholder(source) || source.includes('..') || source.includes('//') || !SOURCE_REFERENCE_PATTERN.test(source)) return null;
  if (!Array.isArray(raw.approver_allowlist) || !raw.approver_allowlist.length || !raw.approver_allowlist.every(validId) || new Set(raw.approver_allowlist).size!==raw.approver_allowlist.length || !raw.approver_allowlist.includes(approved_by)) return null;
  const conditions=['NEW_SEALED','USED'];
  if (!Array.isArray(a.conditions) || !a.conditions.every(x => typeof x==='string' && !isPlaceholder(x) && conditions.includes(x)) || new Set(a.conditions).size!==a.conditions.length || !conditions.every(c=>(a.conditions as unknown[]).includes(c))) return null;
  }
  if (synthetic && (Object.hasOwn(raw,'approval_status') && !['PENDING','APPROVED'].includes(raw.approval_status as string) || Object.hasOwn(raw,'approver_allowlist') && (!Array.isArray(raw.approver_allowlist) || !raw.approver_allowlist.every(validId)))) return null;
  const conditions=['NEW_SEALED','USED'], grades=['LIKE_NEW','GOOD','FAIR'];
  if (!Array.isArray(raw.condition_values) || !raw.condition_values.length || !raw.condition_values.every(c=>conditions.includes(c)) || !Array.isArray(raw.used_grade_values) || !raw.used_grade_values.length || !raw.used_grade_values.every(g=>grades.includes(g))) return null;
  if (!Array.isArray(raw.attributes) || raw.attributes.length>100 || !raw.attributes.every(isRecord)) return null;
  const names=raw.attributes.map(a=>a.key); if (new Set(names).size!==names.length || !names.every(canonicalId)) return null;
  for (const attr of raw.attributes) {
    if (!exactKeys(attr,['key','label_key','type','required_for_assessment','enum_values','unknown_policy','min','max','unit','hard_match','nullable','required_when'],['key','label_key','type','required_for_assessment','hard_match','nullable']) ||
      typeof attr.label_key!=='string' || !attr.label_key || !['enum','integer','text','boolean'].includes(attr.type as string) ||
      !['required_for_assessment','hard_match','nullable'].every(k=>typeof attr[k]==='boolean')) return null;
    if (Object.hasOwn(attr,'enum_values') && (!Array.isArray(attr.enum_values) || !attr.enum_values.length || !attr.enum_values.every(canonicalId))) return null;
    if (attr.type==='enum' && !Array.isArray(attr.enum_values)) return null;
    if (Object.hasOwn(attr,'unknown_policy') && !['BLOCK','BRANCH'].includes(attr.unknown_policy as string)) return null;
    if (attr.unknown_policy==='BRANCH' && attr.key!=='pta_status') return null;
    if (attr.key==='pta_status' && (attr.type!=='enum' || !(attr.enum_values as unknown[]).every(v=>['APPROVED','NON_PTA','NOT_SURE'].includes(v as string)))) return null;
    for (const k of ['min','max']) if (Object.hasOwn(attr,k) && !Number.isSafeInteger(attr[k])) return null;
    if (typeof attr.min==='number' && typeof attr.max==='number' && attr.min>attr.max) return null;
    if (Object.hasOwn(attr,'unit') && (typeof attr.unit!=='string' || !attr.unit.trim())) return null;
    if (Object.hasOwn(attr,'required_when') && (!isRecord(attr.required_when) || !exactKeys(attr.required_when,['condition','used_grade',...names as string[]],[]) || !Object.values(attr.required_when).every(v=>v===null || typeof v==='string' || typeof v==='boolean' || (typeof v==='number' && Number.isFinite(v))))) return null;
  }
  // All predicates are typed against the field they actually read in required().
  for (const attr of raw.attributes) {
    if (!attr.required_when) continue;
    for (const [key,value] of Object.entries(attr.required_when as Record<string,unknown>)) {
      if (key==='condition') {if (!(raw.condition_values as unknown[]).includes(value)) return null;continue;}
      if (key==='used_grade') {if (value!==null && !(raw.used_grade_values as unknown[]).includes(value)) return null;continue;}
      const dep=raw.attributes.find(a=>a.key===key); if (!dep) return null;
      if (value===null) {if (!dep.nullable) return null;continue;}
      if (dep.type==='enum' && (!Array.isArray(dep.enum_values) || !dep.enum_values.includes(value))) return null;
      if (dep.type==='integer' && (typeof value!=='number' || !Number.isSafeInteger(value) || value<0 || typeof dep.min==='number' && value<dep.min || typeof dep.max==='number' && value>dep.max)) return null;
      if (dep.type==='boolean' && typeof value!=='boolean') return null;
      if (dep.type==='text' && (typeof value!=='string' || !value.trim())) return null;
    }
  }
  return raw as CategoryConfig;
}

function detachedFrozen<T>(v:T):T {
  const active=new Set<object>();let nodes=0;
  function clone(x:unknown,depth:number):unknown {
    if(++nodes>POLICY_MAX_NODES || depth>POLICY_MAX_DEPTH) throw new RangeError('CONFIGURATION_REQUIRED');
    if(x===null || typeof x!=='object') return x;
    if(active.has(x)) throw new RangeError('CONFIGURATION_REQUIRED');
    active.add(x);const shape=policyDataShape(x);if(!shape) throw new RangeError('CONFIGURATION_REQUIRED');
    const result=shape.array ? Array.from({length:shape.length},(_,i)=>clone(shape.data.get(String(i)),depth+1)) :
      Object.fromEntries(shape.keys.map(k=>[k,clone(shape.data.get(k),depth+1)]));
    active.delete(x);return Object.freeze(result);
  }
  return clone(v,0) as T;
}
/** Isolated public parser: returns null for every malformed/hostile policy. */
export function parseApprovedPolicy(raw:unknown):CategoryConfig|null {
  try {return ownData(raw,'environment')==='PRODUCTION' ? loadCategoryConfig(raw) : null;} catch {return null;}
}
/** Single trusted-config ingress; raw inspection + strict schema precede copying.
 * SYNTHETIC technical fixtures have the same structural/predicate validation,
 * but remain separately environment-labelled, not an approval bypass in production. */
export function loadCategoryConfig(raw:unknown):CategoryConfig|null {
  try {
    if(!canonicalConfigData(raw) || !isRecord(raw)) return null;
    const valid=parsePolicy(raw,raw.environment==='SYNTHETIC');
    if(!valid) return null;
    const detached=detachedFrozen(valid);
    const copy=detached.approval_scope ? Object.freeze({...detached,approval_scope:Object.freeze({...detached.approval_scope,approved_by:detached.approval_scope.approved_by.trim(),source_ref:detached.approval_scope.source_ref.trim()})}) : detached;
    // Defend changing proxy descriptor traps between inspection and copy.
    return canonicalConfigData(copy) && parsePolicy(copy,copy.environment==='SYNTHETIC') ? copy : null;
  } catch {return null;}
}
export function ownData(value:unknown,key:string):unknown {
  try {if(value===null || typeof value!=='object') return undefined;const d=Object.getOwnPropertyDescriptor(value,key);return d && Object.hasOwn(d,'value') ? d.value : undefined;} catch {return undefined;}
}
export function loadCategoryConfigs(raw:unknown):readonly CategoryConfig[]|null {
  try {
    if(!Array.isArray(raw)) return null;
    const shape=policyDataShape(raw);if(!shape) return null;
    // Budget each policy independently, not all categories under one64KiB aggregate.
    const configs=Array.from({length:shape.length},(_,i)=>loadCategoryConfig(shape.data.get(String(i))));
    return configs.every((c):c is CategoryConfig=>c!==null) ? Object.freeze(configs) : null;
  } catch {return null;}
}

/** Optional trusted-config TEXT ingress. Check raw UTF-8 (including whitespace)
 * before JSON.parse/materialization; callers map null to generic configuration503. */
export function loadCategoryConfigJson(raw:unknown):CategoryConfig|null {
  try {if(typeof raw!=='string' || policyUtf8Bytes(raw,POLICY_MAX_SERIALIZED_BYTES)===null) return null;return loadCategoryConfig(JSON.parse(raw) as unknown);}catch{return null;}
}
