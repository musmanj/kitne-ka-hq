/** SYNTHETIC metadata/schema only; resource limits are not market policy. */
import {describe,it,expect,vi} from 'vitest';
import {canonicalConfigData,loadCategoryConfig,loadCategoryConfigs,loadCategoryConfigJson,evaluateCheck,withApprovedProductionPolicy,
 POLICY_MAX_SERIALIZED_BYTES,POLICY_MAX_STRING_CHARS,POLICY_MAX_FREE_TEXT_BYTES,POLICY_MAX_CONTAINER_KEYS,POLICY_MAX_ARRAY_ITEMS,POLICY_MAX_DEPTH,type CategoryConfig} from '../src';
import {syntheticInput} from '../src/fixtures/synthetic';
function input(){const x=syntheticInput();x.config=withApprovedProductionPolicy(x.config);x.variant.config_version=x.config.version;x.candidates.forEach(c=>c.variant.config_version=x.config.version);return x;}
const bytes=(x:unknown)=>Buffer.byteLength(JSON.stringify(x),'utf8');
const unavailable={result_state:'ERROR',error:{code:'CONFIGURATION_REQUIRED',http_status:503}};
function sized(target:number):CategoryConfig {
 const c=input().config;
 for(let i=0;i<70;i++)c.attributes.push({key:`SYNTHETIC_padding_${i}`,label_key:'attributes.SYNTHETIC_padding',type:'boolean',required_for_assessment:false,hard_match:false,nullable:true,unit:'a'});
 let remain=target-bytes(c);expect(remain).toBeGreaterThan(0);
 for(const a of c.attributes.filter(a=>a.unit==='a')){const extra=Math.min(remain,POLICY_MAX_FREE_TEXT_BYTES-1);a.unit+='a'.repeat(extra);remain-=extra;}
 expect(remain).toBe(0);expect(bytes(c)).toBe(target);return c;
}
describe('CTO11 re-review R1 policy resource boundaries',()=>{
 it('exactly64KiB serialized raw config passes;65537bytes returns503',()=>{
  const x=input();x.config=sized(POLICY_MAX_SERIALIZED_BYTES);expect(loadCategoryConfig(x.config)).not.toBeNull();expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');
  x.config.attributes.find(a=>a.unit!==undefined && a.unit.length<POLICY_MAX_FREE_TEXT_BYTES)!.unit+='a';expect(bytes(x.config)).toBe(POLICY_MAX_SERIALIZED_BYTES+1);expect(evaluateCheck(x).result).toMatchObject(unavailable);
 });
 it('256character default string passes;257 returns503',()=>{const x=input();x.config.label_key='x'.repeat(POLICY_MAX_STRING_CHARS);expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');x.config.label_key+='x';expect(evaluateCheck(x).result).toMatchObject(unavailable);});
 it('256Unicode code points pass;257 fail without confusing bytes/code units',()=>{const c=input().config;c.label_key='😀'.repeat(256);expect(loadCategoryConfig(c)).not.toBeNull();c.label_key+='😀';expect(loadCategoryConfig(c)).toBeNull();});
 it('explicit attributes[].unit free text1024UTF8bytes passes;1025 returns503',()=>{const x=input();x.config.attributes[0]!.unit='a'.repeat(POLICY_MAX_FREE_TEXT_BYTES);expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');x.config.attributes[0]!.unit+='a';expect(evaluateCheck(x).result).toMatchObject(unavailable);});
 it('free-text cap is UTF8bytes, not characters',()=>{const c=input().config;c.attributes[0]!.unit='é'.repeat(512);expect(Buffer.byteLength(c.attributes[0]!.unit,'utf8')).toBe(1024);expect(loadCategoryConfig(c)).not.toBeNull();c.attributes[0]!.unit+='a';expect(loadCategoryConfig(c)).toBeNull();});
 it('CTO8MiB localization label rejected before copying or retention',()=>{const x=input();x.config.label_key='x'.repeat(8*1024*1024);const result=evaluateCheck(x);expect(result.result).toMatchObject(unavailable);expect(result.snapshot.input.config.label_key).toBe('unavailable');});
 it('source_ref is structured metadata, not an extended free-text field',()=>{const c=input().config;c.approval_scope!.source_ref=`qa/${'a'.repeat(250)}.md`;expect(c.approval_scope!.source_ref.length).toBe(256);expect(loadCategoryConfig(c)).not.toBeNull();c.approval_scope!.source_ref=`qa/${'a'.repeat(251)}.md`;expect(loadCategoryConfig(c)).toBeNull();});
 it('UTF8 aggregate bytes and JSON escaping are measured exactly',()=>{
  const c=sized(POLICY_MAX_SERIALIZED_BYTES);const a=c.attributes.find(a=>a.unit!==undefined && a.unit.length>=4)!;
  const original=a.unit!;a.unit='é'+original.slice(2);expect(bytes(c)).toBe(POLICY_MAX_SERIALIZED_BYTES);expect(loadCategoryConfig(c)).not.toBeNull();
  a.unit='\n'+a.unit.slice(1);expect(bytes(c)).toBe(POLICY_MAX_SERIALIZED_BYTES);expect(loadCategoryConfig(c)).not.toBeNull();
  a.unit='\u0000'+a.unit.slice(1);expect(bytes(c)).toBe(POLICY_MAX_SERIALIZED_BYTES+4);expect(loadCategoryConfig(c)).toBeNull();
 });
 it('lone surrogate escaping counts six JSON bytes; paired surrogate counts fourUTF8bytes',()=>{const c=sized(POLICY_MAX_SERIALIZED_BYTES);const a=c.attributes.find(a=>a.unit!==undefined && a.unit.length>=6)!;a.unit='\ud800'+a.unit!.slice(6);expect(bytes(c)).toBe(POLICY_MAX_SERIALIZED_BYTES);expect(loadCategoryConfig(c)).not.toBeNull();a.unit='😀'+a.unit.slice(1);expect(bytes(c)).toBe(POLICY_MAX_SERIALIZED_BYTES-2);expect(loadCategoryConfig(c)).not.toBeNull();});
 it('raw whitespace is counted before JSON.parse/materialization',()=>{
  const raw=JSON.stringify(input().config),exact=raw+' '.repeat(POLICY_MAX_SERIALIZED_BYTES-Buffer.byteLength(raw,'utf8'));expect(Buffer.byteLength(exact,'utf8')).toBe(POLICY_MAX_SERIALIZED_BYTES);expect(loadCategoryConfigJson(exact)).not.toBeNull();
  const spy=vi.spyOn(JSON,'parse');try{expect(loadCategoryConfigJson(exact+' ')).toBeNull();expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
 });
 it('malformed raw JSON is safely rejected and oversized nonASCII text never parsed',()=>{
  expect(loadCategoryConfigJson('{')).toBeNull();const spy=vi.spyOn(JSON,'parse');try{expect(loadCategoryConfigJson('é'.repeat(POLICY_MAX_SERIALIZED_BYTES/2+1))).toBeNull();expect(spy).not.toHaveBeenCalled();}finally{spy.mockRestore();}
 });
 it('each registry category gets its own64KiB budget',()=>{const c=sized(POLICY_MAX_SERIALIZED_BYTES);expect(loadCategoryConfigs([c,c])).toHaveLength(2);});
 it('wide root rejected before a second descriptor collection or descriptor reads',()=>{
  const raw=Object.fromEntries(Array.from({length:POLICY_MAX_CONTAINER_KEYS+1},(_,i)=>[`SYNTHETIC_${i}`,true]));let reads=0;
  expect(canonicalConfigData(new Proxy(raw,{getOwnPropertyDescriptor(t,k){reads++;return Reflect.getOwnPropertyDescriptor(t,k);}}))).toBe(false);expect(reads).toBe(0);
 });
 it('oversized array rejected before own-key enumeration',()=>{let reads=0;const a=new Array(POLICY_MAX_ARRAY_ITEMS+1);expect(canonicalConfigData(new Proxy(a,{ownKeys(t){reads++;return Reflect.ownKeys(t);}}))).toBe(false);expect(reads).toBe(0);});
 it('depth limit remains bounded without a stack overflow',()=>{const root:Record<string,unknown>={};let cursor=root;for(let i=0;i<POLICY_MAX_DEPTH+1;i++){const next={};cursor.next=next;cursor=next;}expect(canonicalConfigData(root)).toBe(false);});
 it('oversized raw metadata is rejected before trimming/normalization',()=>{const c=input().config;c.approval_scope!.approved_by=' '.repeat(256)+'musmanj';expect(loadCategoryConfig(c)).toBeNull();});
});
