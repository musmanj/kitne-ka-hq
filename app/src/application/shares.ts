import { canonicalId, canonicalJson, validDigest } from '../domain/canonical';
import { apiError, type CheckSnapshot } from '../domain/checks';
import { timestamp } from '../domain/pricing';
import { retentionMetadata, retentionState, utc, type RetentionMetadata } from '../domain/retention';
import type { ApiError, Confidence, ConfirmedCanonicalContext, EvidenceObservation, EvidenceSummary, InsufficientReason, Money, PriceVerdict, DifferenceFraction } from '../domain/types';
import { SHARE_RESPONSE_HEADERS } from './security-policy';
export type SnapshotEvidence = Pick<EvidenceSummary, 'included_count' | 'evidence_total_included' | 'evidence_truncated' | 'excluded_count' | 'excluded_by_reason' | 'evidence_newest_effective_at'> & { observations: EvidenceObservation[] };
export type SnapshotPool = { range_low: Money; range_high: Money; median: Money; fair_band_low: Money; fair_band_high: Money;
  range_method: 'MIN_MAX' | 'P10_P90'; confidence: Confidence; evidence: SnapshotEvidence };
export type SanitisedSnapshotResult = { state: 'INSUFFICIENT_DATA'; reasons: InsufficientReason[]; evidence: Pick<EvidenceSummary, 'included_count' | 'excluded_count' | 'excluded_by_reason'> } |
  { state: 'SINGLE_POOL'; pool: SnapshotPool; asking_price: Money | null; verdict: PriceVerdict | 'NO_ASKING_PRICE'; indicative: boolean;
    diff_absolute_minor: number | null; diff_percent: DifferenceFraction | null } |
  { state: 'PTA_SPLIT'; branches: Array<{ pta_status: 'APPROVED' | 'NON_PTA'; pool: SnapshotPool | null; insufficient_reasons: InsufficientReason[] }> };
export type ShareSnapshotPayload = { snapshot_id: string; locale: 'en-PK'; confirmed_context: ConfirmedCanonicalContext;
  created_at: string; expires_at: string; checked_at: string; classified_at: string | null; methodology_version: string;
  category_config_version: string; result_state: 'RANGE_AVAILABLE' | 'INSUFFICIENT_DATA'; result: SanitisedSnapshotResult };
export type ShareCreateResponse = { snapshot_id: string; url: string; og_image_url: string | null; image_status: 'PENDING'; created_at: string; expires_at: string; revoke_token: string };
export type ShareManagementRead = { snapshot_id: string; created_at: string; expires_at: string; availability: 'AVAILABLE' | 'UNAVAILABLE'; url: string | null };
export type ActiveShare = RetentionMetadata & { idHash: string; snapshot_id: string; creator_hash: string; payload: ShareSnapshotPayload; url: string };
/** Membership-only unavailable record. NOT a reason-bearing tombstone/ledger. Never retains payload. */
export type UnavailableShareMarker = RetentionMetadata & { idHash: string; purge_at: string; creator_hash?: string };
export type ShareRecord = ActiveShare | UnavailableShareMarker;
const generic = '{"message_key":"errors.share.unavailable"}';
export const PUBLIC_SHARE_UNAVAILABLE_BODY = generic;
function evidence(e: EvidenceSummary): SnapshotEvidence {
  return { included_count: e.included_count, evidence_total_included: e.evidence_total_included, evidence_truncated: e.evidence_truncated,
    excluded_count: e.excluded_count, excluded_by_reason: e.excluded_by_reason, evidence_newest_effective_at: e.evidence_newest_effective_at,
    observations: e.observations.map(o => ({ observation_id: o.observation_id, price: o.price, variant: o.variant, match_quality: o.match_quality,
      source: { source_id: o.source.source_id, source_name: o.source.source_name, url: o.source.url, observed_at: o.source.observed_at,
        source_updated_at: o.source.source_updated_at, retrieved_at: o.source.retrieved_at } })) };
}
/** Pure CREATE projection: caller atomically binds live check version/policy/epoch and stores
 * result. IDs/tokens/hashes come from authorised crypto adapter, NOT generated here. */
export function createShareProjection(snapshot: CheckSnapshot, input: { snapshot_id: string; idHash: string; creator_hash: string; revoke_token: string;
  public_origin: string; current_epoch: string; check_birth_epoch: string; capability_valid: boolean; rights_valid: boolean; now: string; expected_version: number; confirm_public: true; include_asking_price?: boolean; rights_expires_at?: string }):
  { ok: true; record: ActiveShare; response: ShareCreateResponse } | { ok: false; error: ApiError } {
  const fail = (code: string, status: number, key: string) => ({ ok: false as const, error: apiError(code, status, key) });
  if (!input.current_epoch) return fail('SERVICE_UNAVAILABLE', 503, 'share.unavailable');
  if (!input.capability_valid || input.check_birth_epoch !== input.current_epoch) return fail('CHECK_NOT_FOUND', 404, 'check.not_found');
  if (!input.rights_valid || (snapshot.result.valid_until !== null && Date.parse(input.now) > Date.parse(snapshot.result.valid_until))) return fail('RANGE_STALE', 409, 'classify.range_stale');
  if (input.expected_version !== snapshot.classification_version) return fail('VERSION_CONFLICT', 409, 'request.version_conflict');
  if (timestamp(input.now) === null || Date.parse(input.now) >= Date.parse(snapshot.input.private_expires_at)) return fail('CHECK_EXPIRED', 410, 'check.expired');
  if (snapshot.result.result_state === 'ERROR' || !snapshot.result.confirmed_context || input.confirm_public !== true || !canonicalId(input.snapshot_id) ||
    !validDigest(input.idHash) || !validDigest(input.creator_hash) || !/^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?$/.test(input.public_origin) || !/^[A-Za-z0-9_-]{16,512}$/.test(input.revoke_token)) return fail('INVALID_REQUEST', 422, 'share.invalid');
  try {
    const meta = retentionMetadata('PUBLIC_SHARE', input.current_epoch, input.now, input.rights_expires_at);
    const r = snapshot.result; let result: SanitisedSnapshotResult;
    if (r.result_state === 'INSUFFICIENT_DATA') result = { state: 'INSUFFICIENT_DATA', reasons: r.insufficient_reasons,
      evidence: { included_count: r.evidence.included_count, excluded_count: r.evidence.excluded_count, excluded_by_reason: r.evidence.excluded_by_reason } };
    else if (r.data.mode === 'PTA_SPLIT') result = { state: 'PTA_SPLIT', branches: r.data.pta_branches.map(b => ({ pta_status: b.pta_status,
      pool: b.pool ? { range_low: b.pool.range_low, range_high: b.pool.range_high, median: b.pool.median, fair_band_low: b.pool.fair_band_low,
        fair_band_high: b.pool.fair_band_high, range_method: b.pool.range_method, confidence: b.pool.confidence, evidence: evidence(b.evidence) } : null,
      insufficient_reasons: b.insufficient_reasons })) };
    else {
      const a = r.data.selected_assessment!, pool = a.selected_pool === 'NEW' ? a.new_market! : a.used_market!;
      result = { state: 'SINGLE_POOL', pool: { range_low: pool.range_low, range_high: pool.range_high, median: pool.median, fair_band_low: pool.fair_band_low,
        fair_band_high: pool.fair_band_high, range_method: pool.range_method, confidence: pool.confidence, evidence: evidence(a.evidence) },
      asking_price: input.include_asking_price ? a.asking_price : null, verdict: input.include_asking_price ? a.verdict as PriceVerdict | 'NO_ASKING_PRICE' : 'NO_ASKING_PRICE',
      indicative: input.include_asking_price ? a.indicative : false, diff_absolute_minor: input.include_asking_price ? a.diff_absolute_minor : null,
      diff_percent: input.include_asking_price ? a.diff_percent : null };
    }
    const payload: ShareSnapshotPayload = { snapshot_id: input.snapshot_id, locale: 'en-PK', confirmed_context: r.confirmed_context!,
      created_at: meta.created_at, expires_at: meta.expires_at, checked_at: utc(r.checked_at), classified_at: r.classified_at ? utc(r.classified_at) : null,
      methodology_version: r.methodology_version, category_config_version: r.category_config_version, result_state: r.result_state, result };
    const url = `${input.public_origin}/s/${input.snapshot_id}`;
    // Round-trip clone excludes aliased mutable input; no private row ID/capability/BigInt in DTO.
    return { ok: true, record: JSON.parse(canonicalJson({ ...meta, idHash: input.idHash, snapshot_id: input.snapshot_id, creator_hash: input.creator_hash, payload, url })) as ActiveShare,
      response: { snapshot_id: input.snapshot_id, url, og_image_url: null, image_status: 'PENDING', created_at: meta.created_at, expires_at: meta.expires_at, revoke_token: input.revoke_token } };
  } catch { return fail('INVALID_REQUEST', 422, 'share.invalid'); }
}
/** Active payload removed; same reasonless shape for revoke/expiry/rights removal. No cause argument. */
export function unavailableShare(record: ActiveShare, now: string): UnavailableShareMarker {
  const meta = { idHash: record.idHash, birth_epoch: record.birth_epoch, created_at: record.created_at, expires_at: record.expires_at,
    purge_at: new Date(Date.parse(record.expires_at) + 86400000).toISOString() };
  return Date.parse(now) < Date.parse(record.expires_at) ? { ...meta, creator_hash: record.creator_hash } : meta;
}
export function publicShareResponse(record: ShareRecord | null, context: { now: string; current_epoch: string; database_reachable: boolean; method: 'GET' | 'HEAD'; rights_valid: boolean }):
  { status: 200 | 404 | 410 | 503; headers: typeof SHARE_RESPONSE_HEADERS; body: string | null } {
  let status: 200 | 404 | 410 | 503; let body = generic;
  if (!context.database_reachable || !context.current_epoch || timestamp(context.now) === null) status = 503;
  else if (!record || ('purge_at' in record && Date.parse(context.now) >= Date.parse(record.purge_at))) status = 404;
  else {
    const state = retentionState(record, 'PUBLIC_SHARE', context.now, context.current_epoch);
    if (state === 'UNAVAILABLE') status = 503;
    else if (state !== 'ACTIVE' || !context.rights_valid || !('payload' in record)) status = 410;
    else { status = 200; body = canonicalJson(record.payload); }
  }
  if (status === 503) body = canonicalJson({ ...apiError('SNAPSHOT_UNAVAILABLE', 503), message_key: 'share.snapshot_unavailable', retryable: true });
  return { status, headers: SHARE_RESPONSE_HEADERS, body: context.method === 'HEAD' ? null : body };
}
export function shareManagementRead(record: ShareRecord | null, snapshot_id: string, context: { now: string; current_epoch: string; database_reachable: boolean;
  capability_present: boolean; creator_authorized: boolean; rights_valid: boolean }):
  { status: 200; headers: typeof SHARE_RESPONSE_HEADERS; body: ShareManagementRead } | { status: 401 | 404 | 503; headers: typeof SHARE_RESPONSE_HEADERS; body: { message_key: 'errors.share.unavailable' } } {
  const fail = (status: 401 | 404 | 503) => ({ status, headers: SHARE_RESPONSE_HEADERS, body: { message_key: 'errors.share.unavailable' as const } });
  if (!context.database_reachable || !context.current_epoch || timestamp(context.now) === null) return fail(503);
  if (!context.capability_present) return fail(401);
  if (!record || !context.creator_authorized || !record.creator_hash || retentionState(record, 'PUBLIC_SHARE', context.now, context.current_epoch) !== 'ACTIVE') return fail(404);
  const available = 'payload' in record && context.rights_valid;
  return { status: 200, headers: SHARE_RESPONSE_HEADERS, body: { snapshot_id, created_at: record.created_at, expires_at: record.expires_at,
    availability: available ? 'AVAILABLE' : 'UNAVAILABLE', url: available ? (record as ActiveShare).url : null } };
}
