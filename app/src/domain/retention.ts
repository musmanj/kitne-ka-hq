import { timestamp } from './pricing';
import { DAY_MS } from './policy';
export const RETENTION_MS = Object.freeze({ UNRESOLVED: 3600000, PRIVATE_CHECK: DAY_MS, PUBLIC_SHARE: 30 * DAY_MS });
export type RetentionClass = keyof typeof RETENTION_MS;
export type RetentionMetadata = { birth_epoch: string; created_at: string; expires_at: string };
export function utc(value: string): string { const n = timestamp(value); if (n === null) throw new RangeError('INVALID_TIMESTAMP'); return new Date(n).toISOString(); }
export function retentionMetadata(kind: RetentionClass, birth_epoch: string, created_at: string, earlierExpiry?: string): RetentionMetadata {
  if (!birth_epoch) throw new RangeError('EPOCH_REQUIRED');
  const created = timestamp(created_at); const earlier = earlierExpiry === undefined ? Infinity : timestamp(earlierExpiry);
  if (created === null || earlier === null || earlier <= created) throw new RangeError('INVALID_RETENTION');
  return { birth_epoch, created_at: utc(created_at), expires_at: new Date(Math.min(created + RETENTION_MS[kind], earlier)).toISOString() };
}
/** Checks precede payload/codec/replay access; current epoch is supplied OUTSIDE the store. */
export function retentionState(meta: RetentionMetadata, kind: RetentionClass, now: string, epoch: string): 'ACTIVE' | 'EXPIRED' | 'INVALID_EPOCH' | 'UNAVAILABLE' {
  const n = timestamp(now), created = timestamp(meta.created_at), expiry = timestamp(meta.expires_at);
  if (!epoch || !meta.birth_epoch || n === null || created === null || expiry === null || n < created || expiry <= created || expiry > created + RETENTION_MS[kind]) return 'UNAVAILABLE';
  if (meta.birth_epoch !== epoch) return 'INVALID_EPOCH';
  return n >= expiry ? 'EXPIRED' : 'ACTIVE';
}
