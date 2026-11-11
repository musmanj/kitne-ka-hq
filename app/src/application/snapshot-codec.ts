import { loadCategoryConfig, ownData } from '../domain/policy-validation';
import { isStrictMoney } from '../domain/money-validation';
import { sameAskingAcknowledgement, type AskingAcknowledgement } from '../domain/asking-policy';
import { canonicalId, canonicalJson, isRecord, onlyKeys, utf8Bytes } from '../domain/canonical';
import { apiError, configurationFailureEvaluation, render, type CheckInput, type CheckSnapshot, type StoredBranch } from '../domain/checks';
import { evidenceRows } from '../domain/evidence';
import { identityConfirmed } from '../domain/matching';
import { cmp, median, money, mul, quantile, rat, type Rational } from '../domain/numeric';
import { DAY_MS, EXCLUSION_ORDER, FRESHNESS_DAYS, FUTURE_TOLERANCE_MS, METHODOLOGY_VERSION } from '../domain/policy';
import { none, poolConfidence, timestamp, type PoolEvaluation, type Included } from '../domain/pricing';
import { utc } from '../domain/retention';
import type { ApiError, CategoryConfig, CheckResult, ComparableCandidate, ConfirmedCanonicalContext, EvidenceSummary, InsufficientReason, Money, Product, SourceProvenance, Variant } from '../domain/types';
/** Engineering budgets, not market bounds. PENDING CTO/SecOps deployment measurement. */
export const SNAPSHOT_LIMITS = Object.freeze({ bytes: 1048576, pools: 4, included_per_pool: 1000, rational_digits: 128 });
export type ExactRational = { numerator: string; denominator: string };
export type Statistics = { median_minor: ExactRational | null; p10_minor: ExactRational | null; p90_minor: ExactRational | null;
  range_low_minor: ExactRational | null; range_high_minor: ExactRational | null; fair_band_low_minor: ExactRational | null; fair_band_high_minor: ExactRational | null };
export type EvidenceCounts = Omit<EvidenceSummary, 'observations'>;
export type PersistedIncludedEvidence = { observation: ComparableCandidate['observation']; canonical_listing_id: string;
  variant: Variant; source_ref: string; seller_owner_ref: string; match_quality: 1 | .9; city_id: string | null; permission_version: string };
export type PersistedPoolSnapshot = { pool_key: string; statistics: Statistics; included_evidence: PersistedIncludedEvidence[];
  warnings: string[]; evidence_counts: EvidenceCounts; valid_until: string | null; insufficient_reasons: InsufficientReason[] };
export type EngineSnapshotEnvelope = { codec_version: 1; methodology_version: '0.1'; config_version: string; policy_version: string;
  checked_at: string; confirmed_context: ConfirmedCanonicalContext; pools: PersistedPoolSnapshot[];
  classification: { asking_acknowledgement: AskingAcknowledgement | null; geographic_unverified: boolean; version: number; classified_at: string; asking_price: Money | null; pta_status: 'APPROVED' | 'NON_PTA' | null;
    /** Typed diagnostic projection, not an HTTP response blob; preserves split/absent-branch suppression. */
    insufficient: { reasons: InsufficientReason[]; evidence_counts: EvidenceCounts } | null } };
export type CodecResult<T> = { ok: true; value: T } | { ok: false; error: ApiError };
export type SnapshotRegistry = { product(id: string): Product | null; config(version: string): CategoryConfig | null;
  source(ref: string, permissionVersion: string): SourceProvenance | null; owner(ref: string): boolean; city(id: string): boolean };
const configurationFail=():CodecResult<never>=>({ok:false,error:apiError('CONFIGURATION_REQUIRED',503,'configuration.required')});
const fail = (): CodecResult<never> => ({ ok: false, error: apiError('SNAPSHOT_CODEC_ERROR', 500, 'check.snapshot_invalid') });
function assert(ok: unknown): asserts ok { if (!ok) throw new RangeError('SNAPSHOT_CODEC_ERROR'); }
const date = (x: unknown): x is string => typeof x === 'string' && timestamp(x) !== null && utc(x) === x;
const posMoney = isStrictMoney;
const reasons = ['NO_STORED_RANGE', 'IDENTITY_UNCONFIRMED', 'NO_PERMITTED_SOURCE', 'NO_FRESH_EVIDENCE', 'TOO_FEW_COMPARABLES', 'EXCESSIVE_SPREAD'];
export function encodeRational(x: Rational): ExactRational { const r = rat(x.n, x.d); return { numerator: String(r.n), denominator: String(r.d) }; }
export function decodeRational(x: unknown): Rational {
  assert(isRecord(x) && onlyKeys(x, ['numerator', 'denominator']) && Object.keys(x).length === 2);
  assert(typeof x.numerator === 'string' && typeof x.denominator === 'string' && x.numerator.length <= SNAPSHOT_LIMITS.rational_digits && x.denominator.length <= SNAPSHOT_LIMITS.rational_digits);
  assert(/^(?:0|-[1-9][0-9]*|[1-9][0-9]*)$/.test(x.numerator) && /^[1-9][0-9]*$/.test(x.denominator));
  const r = rat(BigInt(x.numerator), BigInt(x.denominator)); assert(String(r.n) === x.numerator && String(r.d) === x.denominator); return r;
}
function counts(e: EvidenceSummary): EvidenceCounts { return { retrieved_count: e.retrieved_count, included_count: e.included_count, used_condition_included_count: e.used_condition_included_count,
  excluded_count: e.excluded_count, excluded_by_reason: e.excluded_by_reason.map(x => ({ code: x.code, count: x.count })), new_pool_count: e.new_pool_count,
  used_pool_count: e.used_pool_count, independent_sources: e.independent_sources, evidence_total_included: e.evidence_total_included,
  evidence_truncated: e.evidence_truncated, evidence_newest_effective_at: e.evidence_newest_effective_at }; }
function stats(e: PoolEvaluation): Statistics {
  if (!e.unrounded) return { median_minor: null, p10_minor: null, p90_minor: null, range_low_minor: null, range_high_minor: null, fair_band_low_minor: null, fair_band_high_minor: null };
  const prices = e.included.map(x => x.candidate.observation.price.amount_minor).sort((a, b) => a - b), m = e.unrounded.median;
  return { median_minor: encodeRational(m), p10_minor: encodeRational(quantile(prices, 1, 10)), p90_minor: encodeRational(quantile(prices, 9, 10)),
    range_low_minor: encodeRational(e.unrounded.low), range_high_minor: encodeRational(e.unrounded.high),
    fair_band_low_minor: encodeRational(mul(m, 85n, 100n)), fair_band_high_minor: encodeRational(mul(m, 110n, 100n)) };
}
function included(x: Included, config: CategoryConfig): PersistedIncludedEvidence {
  const c = x.candidate, o = c.observation;
  return { observation: { id: o.id, listing_id: o.listing_id, price: { amount_minor: o.price.amount_minor, currency: o.price.currency }, observed_at: o.observed_at === null ? null : utc(o.observed_at),
    source_updated_at: o.source_updated_at === null ? null : utc(o.source_updated_at), retrieved_at: utc(o.retrieved_at), provenance_ref: o.provenance_ref },
    canonical_listing_id: c.canonicalListingId, variant: { product_id: c.variant.product_id, config_version: c.variant.config_version, condition: c.variant.condition, used_grade: c.variant.used_grade, city: c.city,
      attributes: Object.fromEntries(config.attributes.filter(a => Object.hasOwn(c.variant.attributes, a.key)).map(a => [a.key, c.variant.attributes[a.key]!])) }, source_ref: c.source_ref,
    seller_owner_ref: c.sellerOwnerId!, match_quality: c.variantMatch.quality as 1 | .9, city_id: c.city, permission_version: c.source.permission_record_id };
}
/** No JSON replacer that might accidentally persist arbitrary new fields or raw input. */
export function serialiseSnapshot(snapshot: CheckSnapshot, policy_version: string): CodecResult<string> {
  const config=loadCategoryConfig(ownData(ownData(snapshot,'input'),'config'));
  if(!config) return configurationFail();
  snapshot={...snapshot,input:{...snapshot.input,config}};
  try {
    assert(snapshot.result.result_state !== 'ERROR' && snapshot.result.confirmed_context !== null && canonicalId(policy_version));
    const envelope: EngineSnapshotEnvelope = { codec_version: 1, methodology_version: '0.1', config_version: snapshot.input.config.version,
      policy_version, checked_at: utc(snapshot.input.now), confirmed_context: snapshot.result.confirmed_context,
      pools: snapshot.branches.flatMap(b => (['NEW_SEALED', 'USED'] as const).map(condition => {
        const e = condition === 'USED' ? b.used_market : b.new_market;
        return { pool_key: `${b.pta_status ?? 'NONE'}:${condition}`, statistics: stats(e), included_evidence: e.included.map(x => included(x, snapshot.input.config)), warnings: [...e.warnings],
          evidence_counts: counts(e.evidence), valid_until: e.valid_until === null ? null : new Date(e.valid_until).toISOString(), insufficient_reasons: [...e.insufficient_reasons] };
      })), classification: { asking_acknowledgement: snapshot.asking_acknowledgement ?? null, geographic_unverified: snapshot.input.geographicUnverified === true, version: snapshot.classification_version, classified_at: utc(snapshot.result.classified_at), asking_price: snapshot.asking_price === null ? null : { amount_minor: snapshot.asking_price.amount_minor, currency: snapshot.asking_price.currency },
        pta_status: snapshot.selected_pta, insufficient: snapshot.result.result_state === 'INSUFFICIENT_DATA'
          ? { reasons: [...snapshot.result.insufficient_reasons], evidence_counts: counts(snapshot.result.evidence) } : null } };
    const value = canonicalJson(envelope); assert(utf8Bytes(value) <= SNAPSHOT_LIMITS.bytes); return { ok: true, value };
  } catch { return fail(); }
}
function validateVariant(v: unknown, config: CategoryConfig, product: Product, registry: SnapshotRegistry): asserts v is Variant {
  assert(isRecord(v) && onlyKeys(v, ['product_id', 'config_version', 'attributes', 'condition', 'used_grade', 'city']) && isRecord(v.attributes));
  assert(v.product_id === product.id && v.config_version === config.version && ['NEW_SEALED', 'USED'].includes(v.condition as string));
  assert(v.used_grade === null || config.used_grade_values.includes(v.used_grade as never)); assert(v.city === null || (canonicalId(v.city) && registry.city(v.city)));
  for (const [k, a] of Object.entries(v.attributes)) {
    const spec = config.attributes.find(x => x.key === k); assert(spec);
    assert(a === null ? spec.nullable : spec.type === 'enum' ? typeof a === 'string' && canonicalId(a) && spec.enum_values?.includes(a) :
      spec.type === 'integer' ? typeof a === 'number' && Number.isSafeInteger(a) && a >= (spec.min ?? 0) && a <= (spec.max ?? Number.MAX_SAFE_INTEGER) :
      spec.type === 'boolean' ? typeof a === 'boolean' : canonicalId(a) && config.environment === 'SYNTHETIC');
  }
  assert(identityConfirmed(v as Variant, config));
}
function validateCounts(x: unknown): asserts x is EvidenceCounts {
  assert(isRecord(x) && onlyKeys(x, ['retrieved_count', 'included_count', 'used_condition_included_count', 'excluded_count', 'excluded_by_reason', 'new_pool_count', 'used_pool_count', 'independent_sources', 'evidence_total_included', 'evidence_truncated', 'evidence_newest_effective_at']));
  for (const key of ['retrieved_count', 'included_count', 'used_condition_included_count', 'excluded_count', 'new_pool_count', 'used_pool_count', 'independent_sources', 'evidence_total_included']) assert(Number.isSafeInteger(x[key]) && (x[key] as number) >= 0 && (x[key] as number) <= 1000000);
  assert((x.included_count as number) + (x.excluded_count as number) === x.retrieved_count && x.included_count === x.evidence_total_included && typeof x.evidence_truncated === 'boolean');
  assert(x.evidence_newest_effective_at === null || date(x.evidence_newest_effective_at));
  assert(Array.isArray(x.excluded_by_reason) && x.excluded_by_reason.length <= EXCLUSION_ORDER.length);
  let sum = 0; const seen = new Set<string>();
  for (const row of x.excluded_by_reason) { assert(isRecord(row) && onlyKeys(row, ['code', 'count']) && EXCLUSION_ORDER.includes(row.code as never) && !seen.has(row.code as string) && Number.isSafeInteger(row.count) && (row.count as number) > 0); seen.add(row.code as string); sum += row.count as number; }
  assert(sum === x.excluded_count);
}
/** Decode to a typed envelope only after bounded structural/registry/statistical validation.
 * Does not rerun collection, matching, IQR or choose new comparables. */
export function deserialiseSnapshot(json: string, registry: SnapshotRegistry): CodecResult<EngineSnapshotEnvelope> {
  try {
    assert(typeof json === 'string' && utf8Bytes(json) <= SNAPSHOT_LIMITS.bytes);
    const e: unknown = JSON.parse(json); assert(isRecord(e) && onlyKeys(e, ['codec_version', 'methodology_version', 'config_version', 'policy_version', 'checked_at', 'confirmed_context', 'pools', 'classification']));
    assert(e.codec_version === 1 && e.methodology_version === METHODOLOGY_VERSION && typeof e.config_version==='string' && e.config_version.length<=128 && canonicalId(e.policy_version) && date(e.checked_at));
    let config:CategoryConfig|null;
    try {config=loadCategoryConfig(registry.config(e.config_version));} catch {return configurationFail();}
    if(!config) return configurationFail();
    assert(e.config_version===config.version);
    const context = e.confirmed_context; assert(isRecord(context) && onlyKeys(context, ['product', 'variant']) && isRecord(context.product) && isRecord(context.variant));
    assert(onlyKeys(context.product, ['id', 'display_name']) && canonicalId(context.product.id)); const product = registry.product(context.product.id); assert(product && product.category_id === config.id && context.product.display_name === `${product.brand} ${product.model}`);
    assert(onlyKeys(context.variant, ['config_version', 'attributes', 'condition', 'used_grade', 'pta_status']) && ['APPROVED', 'NON_PTA', 'NOT_SURE', null].includes(context.variant.pta_status as never));
    const target = { product_id: product.id, config_version: context.variant.config_version, condition: context.variant.condition, used_grade: context.variant.used_grade, city: null, attributes: { ...(isRecord(context.variant.attributes) ? context.variant.attributes : {}) } };
    if (context.variant.pta_status !== null) target.attributes.pta_status = context.variant.pta_status;
    validateVariant(target, config, product, registry);
    assert(isRecord(e.classification) && onlyKeys(e.classification, ['asking_acknowledgement', 'geographic_unverified', 'version', 'classified_at', 'asking_price', 'pta_status', 'insufficient']) && Number.isSafeInteger(e.classification.version) && (e.classification.version as number) >= 1 && date(e.classification.classified_at) && Date.parse(e.classification.classified_at) >= Date.parse(e.checked_at));
    assert(typeof e.classification.geographic_unverified === 'boolean');
    assert(e.classification.asking_price === null || posMoney(e.classification.asking_price)); assert(['APPROVED', 'NON_PTA', null].includes(e.classification.pta_status as never));
    const ack = e.classification.asking_acknowledgement;
    assert(ack === null || (isRecord(ack) && onlyKeys(ack, ['amount_minor', 'currency', 'product_id', 'category_id', 'config_version']) && sameAskingAcknowledgement(ack as AskingAcknowledgement, e.classification.asking_price as Money | null, product, config)));
    const diagnostic = e.classification.insufficient;
    if (diagnostic !== null) { assert(isRecord(diagnostic) && onlyKeys(diagnostic, ['reasons', 'evidence_counts']) && Array.isArray(diagnostic.reasons) && diagnostic.reasons.every(r => reasons.includes(r as string))); validateCounts(diagnostic.evidence_counts); }
    assert(Array.isArray(e.pools) && e.pools.length <= SNAPSHOT_LIMITS.pools); const keys = new Set<string>();
    for (const pool of e.pools) {
      assert(isRecord(pool) && onlyKeys(pool, ['pool_key', 'statistics', 'included_evidence', 'warnings', 'evidence_counts', 'valid_until', 'insufficient_reasons']) && typeof pool.pool_key === 'string' && /^(APPROVED|NON_PTA|NONE):(NEW_SEALED|USED)$/.test(pool.pool_key) && !keys.has(pool.pool_key)); keys.add(pool.pool_key);
      assert(Array.isArray(pool.warnings) && pool.warnings.every(w => w === 'IQR_ZERO_SPREAD_REVIEW'));
      assert(pool.valid_until === null || date(pool.valid_until)); assert(Array.isArray(pool.insufficient_reasons) && pool.insufficient_reasons.every(r => reasons.includes(r as string)));
      validateCounts(pool.evidence_counts); assert(Array.isArray(pool.included_evidence) && pool.included_evidence.length <= SNAPSHOT_LIMITS.included_per_pool && pool.included_evidence.length === pool.evidence_counts.included_count);
      const ids = new Set<string>(), owners = new Set<string>(); const prices: number[] = [];
      for (const row of pool.included_evidence) {
        assert(isRecord(row) && onlyKeys(row, ['observation', 'canonical_listing_id', 'variant', 'source_ref', 'seller_owner_ref', 'match_quality', 'city_id', 'permission_version']) && canonicalId(row.canonical_listing_id) && canonicalId(row.source_ref) && canonicalId(row.seller_owner_ref) && canonicalId(row.permission_version));
        assert(registry.owner(row.seller_owner_ref) && registry.source(row.source_ref, row.permission_version) !== null && [1, .9].includes(row.match_quality as number) && (row.city_id === null || (canonicalId(row.city_id) && registry.city(row.city_id))));
        validateVariant(row.variant, config, product, registry); assert(row.variant.condition === pool.pool_key.split(':')[1]);
        const o = row.observation; assert(isRecord(o) && onlyKeys(o, ['id', 'listing_id', 'price', 'observed_at', 'source_updated_at', 'retrieved_at', 'provenance_ref']) && canonicalId(o.id) && canonicalId(o.listing_id) && o.provenance_ref === row.source_ref && posMoney(o.price) && date(o.retrieved_at));
        assert((o.observed_at === null || date(o.observed_at)) && (o.source_updated_at === null || date(o.source_updated_at)) && (o.observed_at !== null || o.source_updated_at !== null));
        const temporal = [o.observed_at, o.source_updated_at].filter((x): x is string => typeof x === 'string').map(Date.parse);
        const checked = Date.parse(e.checked_at); const effective = Math.min(...temporal);
        assert(temporal.every(t => t <= checked + FUTURE_TOLERANCE_MS) && effective + FRESHNESS_DAYS[row.variant.condition] * DAY_MS >= checked);
        if (pool.valid_until !== null) assert(Date.parse(pool.valid_until as string) <= Math.min(effective + FRESHNESS_DAYS[row.variant.condition] * DAY_MS, Date.parse(registry.source(row.source_ref, row.permission_version)!.expires_at)));
        assert(!ids.has(o.id) && !owners.has(row.seller_owner_ref)); ids.add(o.id); owners.add(row.seller_owner_ref); prices.push(o.price.amount_minor);
      }
      assert(owners.size === pool.evidence_counts.independent_sources);
      const st = pool.statistics; const names = ['median_minor', 'p10_minor', 'p90_minor', 'range_low_minor', 'range_high_minor', 'fair_band_low_minor', 'fair_band_high_minor'];
      assert(isRecord(st) && onlyKeys(st, names) && Object.keys(st).length === names.length);
      if (st.median_minor === null) { assert(names.every(k => st[k] === null) && pool.valid_until === null); }
      else {
        assert(prices.length >= 3 && pool.insufficient_reasons.length === 0 && pool.valid_until !== null); prices.sort((a, b) => a - b); const m = median(prices);
        const expected = [m, quantile(prices, 1, 10), quantile(prices, 9, 10), prices.length < 5 ? rat(BigInt(prices[0]!)) : quantile(prices, 1, 10), prices.length < 5 ? rat(BigInt(prices.at(-1)!)) : quantile(prices, 9, 10), mul(m, 85n, 100n), mul(m, 110n, 100n)];
        names.forEach((key, i) => { const r = decodeRational(st[key]); assert(cmp(r, expected[i]!) === 0); money(r); });
      }
    }
    for (const pta of ['APPROVED', 'NON_PTA', 'NONE']) assert(keys.has(`${pta}:NEW_SEALED`) === keys.has(`${pta}:USED`));
    return { ok: true, value: e as EngineSnapshotEnvelope };
  } catch { return fail(); }
}
/** Hydration trusts only the validated codec plus live canonical registry. No IQR rerun.
 * Lifecycle/auth/epoch must be gated by the calling store BEFORE invoking this. */
export function hydrateSnapshot(e: EngineSnapshotEnvelope, registry: SnapshotRegistry, privateMeta: { check_id: string; expires_at: string }): CheckSnapshot {
  let config:CategoryConfig|null;
  try {config=loadCategoryConfig(registry.config(e.config_version));} catch {config=null;}
  if(!config) return configurationFailureEvaluation({check_id:privateMeta.check_id,now:e.checked_at}).snapshot;
  const product = JSON.parse(canonicalJson(registry.product(e.confirmed_context.product.id))) as Product;
  const cv = e.confirmed_context.variant;
  const variant: Variant = { product_id: product.id, config_version: config.version, condition: cv.condition, used_grade: cv.used_grade, city: null,
    attributes: { ...cv.attributes, ...(cv.pta_status === null ? {} : { pta_status: cv.pta_status }) } };
  const input: CheckInput = { check_id: privateMeta.check_id, product, variant, config, candidates: [], asking_price: e.classification.asking_price,
    geographicUnverified: e.classification.geographic_unverified, now: e.checked_at, private_expires_at: privateMeta.expires_at };
  const evaluations = new Map<string, PoolEvaluation>();
  for (const p of e.pools) {
    const rows: Included[] = p.included_evidence.map((r, input_index) => {
      const source = { ...registry.source(r.source_ref, r.permission_version)! };
      const times = [r.observation.observed_at, r.observation.source_updated_at].filter((x): x is string => x !== null).map(Date.parse);
      const effective_at = Math.min(...times), window = FRESHNESS_DAYS[r.variant.condition];
      const candidate: ComparableCandidate = { observation: r.observation, listing_id: r.observation.listing_id, canonicalListingId: r.canonical_listing_id,
        sellerOwnerId: r.seller_owner_ref, city: r.city_id, inStock: true, variant: r.variant, variantMatch: { matched: true, quality: r.match_quality, exclusion_reason: null },
        source, source_ref: r.source_ref, rights_status: 'PERMITTED', price_basis: 'FULL_CASH_TAX_INCLUSIVE', comparable: true, rightsVerified: true,
        targetListing: false, verification: 'VERIFIED', evidence_hash: 'CANONICAL-REGISTRY-REFERENCE' };
      return { candidate, input_index, effective_at, valid_until: Math.min(effective_at + window * DAY_MS, Date.parse(source.expires_at)) };
    });
    const unrounded = p.statistics.median_minor === null ? null : { median: decodeRational(p.statistics.median_minor), low: decodeRational(p.statistics.range_low_minor), high: decodeRational(p.statistics.range_high_minor) };
    const evidence = { ...p.evidence_counts, observations: unrounded ? evidenceRows(rows, config) : [] };
    const pool = unrounded ? { median: money(unrounded.median), range_low: money(unrounded.low), range_high: money(unrounded.high),
      fair_band_low: money(decodeRational(p.statistics.fair_band_low_minor)), fair_band_high: money(decodeRational(p.statistics.fair_band_high_minor)),
      range_method: rows.length < 5 ? 'MIN_MAX' as const : 'P10_P90' as const, observation_ids: rows.map(x => x.candidate.observation.id), provenance: evidence.observations.map(x => x.source),
      n_effective: rows.length, independent_sources: p.evidence_counts.independent_sources, confidence: poolConfidence(rows, unrounded, Date.parse(e.checked_at), false, input.geographicUnverified) } : null;
    evaluations.set(p.pool_key, { pool, evidence, included: rows, exclusions: [], insufficient_reasons: p.insufficient_reasons, warnings: p.warnings, unrounded, valid_until: p.valid_until === null ? null : Date.parse(p.valid_until) });
    input.candidates.push(...rows.map(x => x.candidate));
  }
  const branches: StoredBranch[] = [];
  for (const pta of ['APPROVED', 'NON_PTA', 'NONE'] as const) {
    const new_market = evaluations.get(`${pta}:NEW_SEALED`), used_market = evaluations.get(`${pta}:USED`); if (!new_market || !used_market) continue;
    const branchVariant = { ...variant, attributes: { ...variant.attributes, ...(pta === 'NONE' ? {} : { pta_status: pta }) } };
    branches.push({ pta_status: pta === 'NONE' ? null : pta, variant: branchVariant, new_market, used_market, selected: variant.condition === 'USED' ? used_market : new_market });
  }
  let result: CheckResult = render(input, branches, e.classification.pta_status, e.classification.asking_price, e.classification.version, e.classification.classified_at);
  if (e.classification.insufficient) result = { ...result, result_state: 'INSUFFICIENT_DATA', error: null, data: null,
    evidence: { ...e.classification.insufficient.evidence_counts, observations: [], evidence_truncated: false }, insufficient_reasons: e.classification.insufficient.reasons,
    confidence: none(), low_confidence_modifier: false };
  return { input, branches, selected_pta: e.classification.pta_status, classification_version: e.classification.version,
    asking_price: e.classification.asking_price, asking_acknowledgement: e.classification.asking_acknowledgement, result, replays: {} };
}
