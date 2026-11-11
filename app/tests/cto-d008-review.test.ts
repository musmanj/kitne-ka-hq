/** CTO11 F1–F3 exact six acceptance names; all schema/evidence is SYNTHETIC. */
import {describe,it,expect} from 'vitest';
import {evaluateCheck,parseApprovedPolicy,withApprovedProductionPolicy,loadCategoryConfig,classify,validateAssessmentRequest,serialiseSnapshot,deserialiseSnapshot,hydrateSnapshot,type SnapshotRegistry} from '../src';
import {syntheticInput} from '../src/fixtures/synthetic';
function input(){const x=syntheticInput();x.config=withApprovedProductionPolicy(structuredClone(x.config));x.variant.config_version=x.config.version;x.candidates.forEach(c=>c.variant.config_version=x.config.version);return x;}
const unavailable={result_state:'ERROR',error:{code:'CONFIGURATION_REQUIRED',http_status:503,message_key:'errors.configuration.required'}};
describe('CTO D-008 additional acceptance probes',()=>{
 it('missing attributes returns CONFIGURATION_REQUIRED, not an exception',()=>{const x=input();Reflect.deleteProperty(x.config,'attributes');expect(evaluateCheck(x).result).toMatchObject(unavailable);});
 it('invalid attributes type returns CONFIGURATION_REQUIRED, not an exception',()=>{const x=input();Object.assign(x.config,{attributes:{}});expect(evaluateCheck(x).result).toMatchObject(unavailable);});
 it('invalid config id returns CONFIGURATION_REQUIRED',()=>{const x=input();Object.assign(x.config,{id:null});expect(evaluateCheck(x).result).toMatchObject(unavailable);});
 it('invalid conditional enum cannot disable required storage identity',()=>{const x=input();x.config.attributes.find(a=>a.key==='storage_gb')!.required_when={condition:'REFURBISHED'};delete x.variant.attributes.storage_gb;x.candidates.forEach(c=>delete c.variant.attributes.storage_gb);expect(parseApprovedPolicy(x.config)).toBeNull();expect(evaluateCheck(x).result).toMatchObject(unavailable);});
 it('accessor config rejected without execution',()=>{const x=input();let reads=0;Object.defineProperty(x.config,'approval_status',{enumerable:true,get(){reads++;return 'APPROVED';}});expect(parseApprovedPolicy(x.config)).toBeNull();expect(evaluateCheck(x).result).toMatchObject(unavailable);expect(reads).toBe(0);});
 it('unknown non-enumerable policy key is rejected before copying',()=>{const x=input();Object.defineProperty(x.config,'unknown',{value:true});expect(parseApprovedPolicy(x.config)).toBeNull();expect(evaluateCheck(x).result).toMatchObject(unavailable);});
});
describe('CTO11 hostile config and ingress boundary regressions',()=>{
 it.each(['cycle','symbol','prototype','nested-getter','setter','sparse-array','array-property','array-prototype','throwing-proxy','revoked-proxy','non-object','missing-nested','bad-unknown-policy','bad-type','condition-enum','grade-enum','pta-enum','unsupported-branch'])('%s returns503 without retaining malformed config',(kind)=>{
  const x=input();let calls=0;
  if(kind==='cycle') Object.assign(x.config,{self:x.config});
  if(kind==='symbol') Object.defineProperty(x.config,Symbol('SYNTHETIC-extra'),{value:true});
  if(kind==='prototype') Object.setPrototypeOf(x.config,{extra:true});
  if(kind==='nested-getter') Object.defineProperty(x.config.approval_scope!,'source_ref',{enumerable:true,get(){calls++;throw new Error('SYNTHETIC_SECRET_MUST_NOT_LEAK');}});
  if(kind==='setter') Object.defineProperty(x.config,'approval_status',{enumerable:true,set(){calls++;}});
  if(kind==='sparse-array') Reflect.deleteProperty(x.config.attributes,'0');
  if(kind==='array-property') Object.assign(x.config.attributes,{extra:true});
  if(kind==='array-prototype') Object.setPrototypeOf(x.config.attributes,Object.create(Array.prototype));
  if(kind==='throwing-proxy') x.config=new Proxy(x.config,{ownKeys(){throw new Error('SYNTHETIC_SECRET_MUST_NOT_LEAK');}});
  if(kind==='revoked-proxy'){const p=Proxy.revocable(x.config,{});p.revoke();x.config=p.proxy;}
  if(kind==='non-object') Object.assign(x,{config:null});
  if(kind==='missing-nested') Reflect.deleteProperty(x.config.approval_scope!,'conditions');
  if(kind==='bad-unknown-policy') Object.assign(x.config.attributes[0]!,{unknown_policy:'SKIP'});
  if(kind==='bad-type') Object.assign(x.config.attributes[0]!,{type:'SKIP'});
  if(kind==='condition-enum') Object.assign(x.config,{condition_values:['NEW_SEALED','OTHER']});
  if(kind==='pta-enum') x.config.attributes.find(a=>a.key==='pta_status')!.enum_values=['APPROVED','GARBAGE'];
  if(kind==='unsupported-branch') x.config.attributes[0]!.unknown_policy='BRANCH';
  if(kind==='grade-enum') Object.assign(x.config,{used_grade_values:['GOOD','OTHER']});
  const out=evaluateCheck(x);expect(out.result).toMatchObject(unavailable);expect(calls).toBe(0);expect(JSON.stringify(out)).not.toContain('SYNTHETIC_SECRET_MUST_NOT_LEAK');expect(out.result.confirmed_context).toBeNull();
 });
 it.each([{condition:'OTHER'},{condition:42},{used_grade:'MINT'},{used_grade:true},{pta_status:'UNRECOGNISED'},{storage_gb:'128'},{storage_gb:1.5},{storage_gb:null},{warranty:123},{unregistered:'X'}])('typed predicate rejects %j',predicate=>{
  const x=input();x.config.attributes[0]!.required_when=predicate;expect(evaluateCheck(x).result).toMatchObject(unavailable);
 });
 it('valid used-grade dependency reads Variant.used_grade, not attributes',()=>{
  const x=input();x.variant.condition='USED';x.variant.used_grade='GOOD';x.config.attributes[0]!.required_when={used_grade:'GOOD'};delete x.variant.attributes.storage_gb;
  expect(parseApprovedPolicy(x.config)).not.toBeNull();expect(evaluateCheck(x).result.result_state).toBe('INSUFFICIENT_DATA');
 });
 it('boolean dependency is typed, and enum dependency must use declared choices',()=>{
  const x=input();x.config.attributes.push({key:'SYNTHETIC_flag',label_key:'attributes.flag',type:'boolean',nullable:false,required_for_assessment:false,hard_match:false});
  x.config.attributes[0]!.required_when={SYNTHETIC_flag:'false'};expect(loadCategoryConfig(x.config)).toBeNull();
  x.config.attributes[0]!.required_when={SYNTHETIC_flag:false};expect(loadCategoryConfig(x.config)).not.toBeNull();
 });
 it('loader copies known non-enumerable DATA fields and deep-freezes detached config',()=>{
  const x=input();Object.defineProperty(x.config,'id',{value:'phones',enumerable:false});const loaded=loadCategoryConfig(x.config)!;
  expect(loaded.id).toBe('phones');expect(Object.isFrozen(loaded)).toBe(true);expect(Object.isFrozen(loaded.attributes[0])).toBe(true);
  x.config.attributes[0]!.label_key='SYNTHETIC_changed';expect(loaded.attributes[0]!.label_key).not.toBe('SYNTHETIC_changed');
 });
 it('technical asking validity still wins over invalid config',()=>{const x=input();Object.assign(x,{config:null,asking_price:{amount_minor:1.5,currency:'PKR'}});expect(evaluateCheck(x).result).toMatchObject({error:{code:'INVALID_ASKING_PRICE',http_status:422}});});
 it('outer config accessor is rejected without running it',()=>{const x=input();let reads=0;Object.defineProperty(x,'config',{get(){reads++;throw new Error('SYNTHETIC-secret');}});expect(evaluateCheck(x).result).toMatchObject(unavailable);expect(reads).toBe(0);});
 it('classify rejects input/config accessor without execution',()=>{
  for(const key of ['input','config']){const snap=structuredClone(evaluateCheck(input()).snapshot);let reads=0;Object.defineProperty(key==='input'?snap:snap.input,key,{get(){reads++;throw new Error('SYNTHETIC-secret');}});
   expect(classify(snap,{asking_price:null},{now:syntheticInput().now,expected_version:1,idempotency_key:'SYNTHETIC-key',resource_known:true,capability_valid:true,evidence_valid:true})).toMatchObject({ok:false,error:{code:'CONFIGURATION_REQUIRED',http_status:503}});expect(reads).toBe(0);}
 });
 it('classify validates malformed snapshot config before PTA predicates or replay',()=>{
  const snap=structuredClone(evaluateCheck(input()).snapshot);Object.assign(snap.input.config,{attributes:{}});
  const out=classify(snap,{asking_price:null},{now:snap.input.now,expected_version:1,idempotency_key:'SYNTHETIC-key',resource_known:true,capability_valid:true,evidence_valid:true});
  expect(out).toMatchObject({ok:false,error:{code:'CONFIGURATION_REQUIRED',http_status:503}});
 });
 it('confirmation config registry failure maps503, not malformed-body400',()=>{
  const x=input();Object.assign(x.config,{attributes:{}});
  const raw={product_id:x.product.id,variant:x.variant,asking_price:null,confirmed_fields:[]};
  const out=validateAssessmentRequest(raw,{products:[x.product],configs:[x.config],city_ids:[]},{now:x.now,notice_version:'SYNTHETIC',hmac:{digest:()=> 'a'.repeat(64)}});
  expect(out).toMatchObject({ok:false,error:{code:'CONFIGURATION_REQUIRED',http_status:503}});
 });
});

describe('CTO11 policy validation applies to persistence registry boundaries',()=>{
 function setup(){
  const x=input();
  // Explicitly SYNTHETIC reviewed-style canonical enums/ranges; never a real catalogue.
  for(const attr of x.config.attributes){if(attr.type==='text'){attr.type='enum';attr.enum_values=[String(x.variant.attributes[attr.key])];}if(attr.type==='integer'){attr.min=0;attr.max=4096;}}
  const snap=evaluateCheck(x).snapshot;
  const registry:SnapshotRegistry={product:()=>x.product,config:()=>x.config,source:(id,p)=>x.candidates.find(c=>c.source_ref===id && c.source.permission_record_id===p)?.source??null,owner:id=>x.candidates.some(c=>c.sellerOwnerId===id),city:()=>false};
  const encoded=serialiseSnapshot(snap,'SYNTHETIC-policy');if(!encoded.ok) throw new Error('SYNTHETIC-encode');
  const decoded=deserialiseSnapshot(encoded.value,registry);if(!decoded.ok) throw new Error('SYNTHETIC-decode');
  return {x,snap,registry,encoded:encoded.value,envelope:decoded.value};
 }
 it('approved1.0.0 config survives exact-rational codec roundtrip',()=>{
  const {x,snap,registry,encoded,envelope}=setup();expect(deserialiseSnapshot(encoded,registry).ok).toBe(true);
  expect(hydrateSnapshot(envelope,registry,{check_id:x.check_id,expires_at:x.private_expires_at}).result.result_state).toBe('RANGE_AVAILABLE');
  expect(snap.input.config.version).toBe('1.0.0');
 });
 it.each(['malformed','throwing','accessor'])('registry %s policy maps503 on decode/hydrate without leakage',kind=>{
  const {x,registry,encoded,envelope}=setup();let reads=0;
  if(kind==='malformed') Object.assign(x.config,{attributes:{}});
  if(kind==='throwing') registry.config=()=>{throw new Error('SYNTHETIC_EXCEPTION_CANARY');};
  if(kind==='accessor') Object.defineProperty(x.config,'approval_status',{get(){reads++;throw new Error('SYNTHETIC_EXCEPTION_CANARY');}});
  const decoded=deserialiseSnapshot(encoded,registry);expect(decoded).toMatchObject({ok:false,error:{code:'CONFIGURATION_REQUIRED',http_status:503}});
  const restored=hydrateSnapshot(envelope,registry,{check_id:x.check_id,expires_at:x.private_expires_at});expect(restored.result).toMatchObject(unavailable);
  expect(JSON.stringify([decoded,restored])).not.toContain('SYNTHETIC_EXCEPTION_CANARY');expect(reads).toBe(0);
 });
 it('serialization rejects malformed snapshot policy with503 before projection',()=>{
  const {snap}=setup();const modified=structuredClone(snap);Object.assign(modified.input.config,{attributes:{}});
  expect(serialiseSnapshot(modified,'SYNTHETIC-policy')).toMatchObject({ok:false,error:{code:'CONFIGURATION_REQUIRED',http_status:503}});
 });
 it('each SYNTHETIC fixture owns its config; invalid predicates never poison controls',()=>{
  const a=syntheticInput(),b=syntheticInput();a.config.attributes[0]!.required_when={condition:'UNKNOWN'};
  expect(evaluateCheck(a).result).toMatchObject(unavailable);expect(evaluateCheck(b).result.result_state).toBe('RANGE_AVAILABLE');
 });
});
