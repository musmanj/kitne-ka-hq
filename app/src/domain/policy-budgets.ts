/** CTO11 re-review R1 /9Nov2026: ingress limits, NOT pricing/market policy.
 * Object input is measured as compact JSON of ALL own data (including non-enumerable
 * fields) before normalization/copy. No JSON stringify/toJSON/getter execution.
 * Raw JSON text is byte-checked separately before parsing, including whitespace. */
export const POLICY_MAX_SERIALIZED_BYTES = 64 * 1024;
export const POLICY_MAX_STRING_CHARS = 256; // Unicode code points, not grapheme clusters
export const POLICY_MAX_FREE_TEXT_BYTES = 1024; // decoded UTF-8 bytes, not chars
export const POLICY_MAX_CONTAINER_KEYS = 256;
export const POLICY_MAX_ARRAY_ITEMS = 256;
export const POLICY_MAX_NODES = 100000;
export const POLICY_MAX_DEPTH = 32;
/** Only descriptive unit metadata is free text. IDs/localization keys/references
 * and predicate values retain256-char cap. No raw OCR or product free-text inputs. */
export const POLICY_FREE_TEXT_FIELDS = Object.freeze(['attributes[].unit'] as const);
function stringWithinCharacters(text:string):boolean {
  if(text.length>2*POLICY_MAX_STRING_CHARS) return false;
  let count=0;for(const _ of text){void _;if(++count>POLICY_MAX_STRING_CHARS) return false;}return true;
}
type Shape = {array:boolean; keys:string[]; data:Map<string,unknown>; length:number};
/** Reflect.ownKeys inherently allocates its first key list. Reject width BEFORE a
 * second descriptor collection; fetch only bounded individual data descriptors.
 * Trusted canonical data only: executable proxies cannot be given a JS deadline. */
export function policyDataShape(value:object):Shape|null {
  const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
  if(array ? proto!==Array.prototype && proto!==null : proto!==Object.prototype && proto!==null) return null;
  let length=0;
  if(array){const d=Object.getOwnPropertyDescriptor(value,'length');if(!d || !Object.hasOwn(d,'value') || !Number.isSafeInteger(d.value) || d.value<0 || d.value>POLICY_MAX_ARRAY_ITEMS) return null;length=d.value as number;}
  const rawKeys=Reflect.ownKeys(value);
  if(rawKeys.length>(array ? POLICY_MAX_ARRAY_ITEMS+1 : POLICY_MAX_CONTAINER_KEYS)) return null;
  if(array && rawKeys.length!==length+1) return null;
  const data=new Map<string,unknown>(),keys:string[]=[];
  for(const key of rawKeys){
    if(typeof key!=='string' || !stringWithinCharacters(key)) return null;
    const d=Object.getOwnPropertyDescriptor(value,key);if(!d || !Object.hasOwn(d,'value')) return null;
    if(array && key==='length') continue;
    if(array && (!/^(?:0|[1-9][0-9]*)$/.test(key) || Number(key)>=length)) return null;
    keys.push(key);data.set(key,d.value);
  }
  if(array){for(let i=0;i<length;i++) if(!data.has(String(i))) return null;}
  return {array,keys,data,length};
}
/** Bounded UTF-8 count without allocation or traversing an oversized string. */
export function policyUtf8Bytes(text:string,limit:number):number|null {
  if(text.length>limit) return null;
  let bytes=0;
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i);
    if(c>=0xD800 && c<=0xDBFF && i+1<text.length && text.charCodeAt(i+1)>=0xDC00 && text.charCodeAt(i+1)<=0xDFFF){bytes+=4;i++;}
    else bytes+=c<0x80 ? 1 : c<0x800 ? 2 : 3;
    if(bytes>limit) return null;
  }
  return bytes;
}
/** Count exact JSON escaping and UTF-8 bytes. Strings already length/byte capped. */
function jsonStringBytes(text:string):number {
  let bytes=2;
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i);
    if(c===34 || c===92 || c===8 || c===9 || c===10 || c===12 || c===13) bytes+=2;
    else if(c<0x20) bytes+=6;
    else if(c>=0xD800 && c<=0xDBFF && i+1<text.length && text.charCodeAt(i+1)>=0xDC00 && text.charCodeAt(i+1)<=0xDFFF){bytes+=4;i++;}
    else if(c>=0xD800 && c<=0xDFFF) bytes+=6; // well-formed JSON.stringify lone-surrogate escaping
    else bytes+=c<0x80 ? 1 : c<0x800 ? 2 : 3;
  }
  return bytes;
}
export function canonicalConfigData(raw:unknown):boolean {
  const active=new Set<object>();let nodes=0,bytes=0;
  const add=(n:number):boolean=>(bytes+=n)<=POLICY_MAX_SERIALIZED_BYTES;
  function visit(v:unknown,depth:number,path:readonly string[]):boolean {
    if(++nodes>POLICY_MAX_NODES || depth>POLICY_MAX_DEPTH) return false;
    if(v===null) return add(4);
    if(typeof v==='boolean') return add(v ? 4 : 5);
    if(typeof v==='number') return Number.isFinite(v) && add(JSON.stringify(v).length);
    if(typeof v==='string'){
      const free=path.length===3 && path[0]==='attributes' && path[1]==='*' && path[2]==='unit';
      if(free ? policyUtf8Bytes(v,POLICY_MAX_FREE_TEXT_BYTES)===null : !stringWithinCharacters(v)) return false;
      return add(jsonStringBytes(v));
    }
    if(typeof v!=='object' || active.has(v)) return false;
    const shape=policyDataShape(v);if(!shape || !add(2+Math.max(0,shape.keys.length-1))) return false;
    active.add(v);
    for(const key of shape.keys){
      if(!shape.array && !add(jsonStringBytes(key)+1)) return false;
      if(!visit(shape.data.get(key),depth+1,[...path,shape.array ? '*' : key])) return false;
    }
    active.delete(v);return true;
  }
  try{return visit(raw,0,[]);}catch{return false;}
}
