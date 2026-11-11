/** Pure bounded canonical JSON: never use arbitrary object toJSON/getters or key order. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value) as object | null) &&
    Object.values(Object.getOwnPropertyDescriptors(value)).every(d => !d.get && !d.set);
}
export const onlyKeys = (value: Record<string, unknown>, allowed: readonly string[]): boolean => Object.keys(value).every(k => allowed.includes(k));
export const canonicalId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
export function utf8Bytes(value: string): number {
  let size = 0; for (const c of value) { const n = c.codePointAt(0)!; size += n <= 127 ? 1 : n <= 2047 ? 2 : n <= 65535 ? 3 : 4; } return size;
}
export function canonicalJson(value: unknown): string {
  let nodes = 0;
  function visit(v: unknown, depth: number): unknown {
    if (++nodes > 100000 || depth > 32) throw new RangeError('CANONICAL_INPUT_LIMIT');
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (Array.isArray(v)) return v.map(x => visit(x, depth + 1));
    if (isRecord(v)) return Object.fromEntries(Object.keys(v).sort().map(k => [k, visit(v[k], depth + 1)]));
    throw new RangeError('INVALID_CANONICAL_INPUT');
  }
  return JSON.stringify(visit(value, 0));
}
/** Inject a real environment-separated HMAC implementation at a trusted adapter.
 * No key, crypto/network implementation, or unkeyed hash substitute is provided. */
export interface CanonicalHmac { digest(canonicalFacts: string): string }
export const validDigest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
