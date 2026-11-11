import { canonicalId, canonicalJson, validDigest, type CanonicalHmac } from '../domain/canonical';
import { apiError, classify, type CheckSnapshot, type ClassifyOutcome, type ClassifyRequest } from '../domain/checks';
import { retentionState, type RetentionMetadata } from '../domain/retention';
import { deserialiseSnapshot, hydrateSnapshot, serialiseSnapshot, type SnapshotRegistry } from './snapshot-codec';
import type { ConfirmationRecord } from './confirmation';
export type StoredCheck = RetentionMetadata & { check_id: string; policy_version: string; config_version: string;
  snapshot_json: string; confirmation_record: ConfirmationRecord; classification_versions: Record<string, string>;
  replay_refs: Record<string, { digest: string; version: number }> };
export type Commit<T> = { value: T; next?: StoredCheck };
/** Real adapter MUST implement one atomic transaction/RPC and recheck live guards at commit.
 * A callback is synchronous: no I/O, await, provider reservation or clock read allowed. */
export interface CheckStore { atomic<T>(id: string, transaction: (row: Readonly<StoredCheck> | null) => Commit<T>): T }
function immutable<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(immutable); Object.freeze(value); } return value;
}
function clone<T>(v: T): T { return JSON.parse(canonicalJson(v)) as T; }
/** Reference only: single-process JS run-to-completion, NOT distributed/global atomicity. */
export class InMemoryCheckStore implements CheckStore {
  private readonly rows = new Map<string, StoredCheck>();
  private active = false;
  constructor(seed: readonly StoredCheck[] = []) { seed.forEach(row => this.rows.set(row.check_id, immutable(clone(row)))); }
  atomic<T>(id: string, transaction: (row: Readonly<StoredCheck> | null) => Commit<T>): T {
    if (this.active) throw new Error('REENTRANT_TRANSACTION');
    this.active = true;
    try {
      const decision = transaction(this.rows.get(id) ?? null);
      if (decision.next !== undefined) { if (decision.next.check_id !== id) throw new Error('INVALID_COMMIT'); this.rows.set(id, immutable(clone(decision.next))); }
      return decision.value;
    } finally { this.active = false; }
  }
}
export type AtomicClassifyContext = { now: string; current_epoch: string; capability_valid: boolean; capability_scope: string;
  expected_version: number | null; idempotency_key: string; policy_version: string; config_version: string;
  evidence_valid: boolean; quota_available: boolean; registry: SnapshotRegistry; hmac: CanonicalHmac };
/** R5: key/digest hashing is injected real HMAC at the trusted application boundary.
 * Stored key/digest never contain token, raw idempotency key or request mirror. */
export function classifyAtomically(store: CheckStore, check_id: string, request: ClassifyRequest, context: AtomicClassifyContext): ClassifyOutcome {
  const fail = (code: string, status: number, key: string): ClassifyOutcome => ({ ok: false, error: apiError(code, status, key) });
  if (!context.current_epoch) return fail('SERVICE_UNAVAILABLE', 503, 'check.unavailable');
  if (!canonicalId(check_id) || !context.capability_valid) return fail('CHECK_NOT_FOUND', 404, 'check.not_found');
  return store.atomic(check_id, row => {
    const unchanged = (value: ClassifyOutcome): Commit<ClassifyOutcome> => ({ value });
    if (!row) return unchanged(fail('CHECK_NOT_FOUND', 404, 'check.not_found'));
    const state = retentionState(row, 'PRIVATE_CHECK', context.now, context.current_epoch);
    if (state === 'INVALID_EPOCH') return unchanged(fail('CHECK_NOT_FOUND', 404, 'check.not_found'));
    if (state === 'EXPIRED') return unchanged(fail('CHECK_EXPIRED', 410, 'check.expired'));
    if (state !== 'ACTIVE') return unchanged(fail('SERVICE_UNAVAILABLE', 503, 'check.unavailable'));
    if (context.expected_version === null) return unchanged(fail('PRECONDITION_REQUIRED', 428, 'request.precondition_required'));
    if (!Number.isSafeInteger(context.expected_version) || context.expected_version < 1 || !/^[A-Za-z0-9_-]{1,128}$/.test(context.idempotency_key) || !canonicalId(context.capability_scope)) return unchanged(fail('INVALID_REQUEST', 400, 'request.invalid'));
    if (!context.evidence_valid || row.policy_version !== context.policy_version || row.config_version !== context.config_version) return unchanged(fail('RANGE_STALE', 409, 'classify.range_stale'));
    let keyHash: string, digest: string, canonicalKey: string, canonicalRequest: string;
    try {
      canonicalKey = canonicalJson({ resource: check_id, action: 'CLASSIFY', capability_scope: context.capability_scope, epoch: context.current_epoch, key: context.idempotency_key });
      canonicalRequest = canonicalJson({ expected_version: context.expected_version, request });
    } catch { return unchanged(fail('INVALID_REQUEST', 400, 'request.invalid')); }
    try {
      keyHash = context.hmac.digest(canonicalKey); digest = context.hmac.digest(canonicalRequest);
      if (!validDigest(keyHash) || !validDigest(digest)) return unchanged(fail('SERVICE_UNAVAILABLE', 503, 'check.unavailable'));
    } catch { return unchanged(fail('SERVICE_UNAVAILABLE', 503, 'check.unavailable')); }
    const decode = (json: string): CheckSnapshot | null => {
      const decoded = deserialiseSnapshot(json, context.registry);
      return decoded.ok ? hydrateSnapshot(decoded.value, context.registry, { check_id: row.check_id, expires_at: row.expires_at }) : null;
    };
    const current = decode(row.snapshot_json);
    if (!current) return unchanged(fail('SNAPSHOT_CODEC_ERROR', 500, 'check.snapshot_invalid'));
    const replay = Object.hasOwn(row.replay_refs, keyHash) ? row.replay_refs[keyHash] : undefined;
    if (replay) {
      if (replay.digest !== digest) return unchanged(fail('IDEMPOTENCY_CONFLICT', 409, 'request.idempotency_conflict'));
      const json = row.classification_versions[String(replay.version)]; const original = json ? decode(json) : null;
      if (!original) return unchanged(fail('SNAPSHOT_CODEC_ERROR', 500, 'check.snapshot_invalid'));
      // Revalidate ORIGINAL selected evidence against injected now/current policy before replay.
      const guard = classify(original, request, { now: context.now, expected_version: original.classification_version, idempotency_key: keyHash,
        capability_valid: true, resource_known: true, evidence_valid: true });
      if (!guard.ok) return unchanged(guard);
      return unchanged({ ok: true, result: original.result, snapshot: original, replayed: true });
    }
    if (!context.quota_available) return unchanged(fail('RATE_LIMIT_UNAVAILABLE', 503, 'rate_limit.unavailable'));
    const next = classify(current, request, { now: context.now, expected_version: context.expected_version, idempotency_key: keyHash,
      capability_valid: true, resource_known: true, evidence_valid: true });
    if (!next.ok) return unchanged(next);
    const encoded = serialiseSnapshot(next.snapshot, row.policy_version);
    if (!encoded.ok || !deserialiseSnapshot(encoded.value, context.registry).ok) return unchanged(fail('SNAPSHOT_CODEC_ERROR', 500, 'check.snapshot_invalid'));
    return { value: next, next: { ...row, snapshot_json: encoded.value,
      classification_versions: { ...row.classification_versions, [String(next.snapshot.classification_version)]: encoded.value },
      replay_refs: { ...row.replay_refs, [keyHash]: { digest, version: next.snapshot.classification_version } } } };
  });
}
