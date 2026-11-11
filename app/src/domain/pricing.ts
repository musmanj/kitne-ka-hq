import { parseApprovedPolicy, loadCategoryConfig, ownData } from './policy-validation';
import { canonicalJson } from './canonical';
import type { CategoryConfig, ComparableCandidate, Confidence, ConfidenceReason, EvidenceSummary,
  ExclusionReason, InsufficientReason, MarketPool, Variant, Condition, DifferencePercentagePoints } from './types';
import { add, asNumber, cmp, decimalRational, halfEven, median, money, mul, quantile, rat, sub, type Rational } from './numeric';
import { DAY_MS, FRESHNESS_DAYS, FUTURE_TOLERANCE_MS, GEO_MIN_CITY_SAMPLES,
  EXCLUSION_ORDER, CONFIDENCE_ROUNDING_POLICY, type ConfidenceRounding, FAIR_HIGH_PERCENT, FAIR_LOW_PERCENT, GEO_SPREAD_PERCENT, MAX_SPREAD_PERCENT, WIDE_SPREAD_PERCENT,
  METHODOLOGY_VERSION, NEAR_EXPIRY_REMAINING } from './policy';
import { evidenceMetadata, evidenceRows, suppressEvidenceRows } from './evidence';
import { identityConfirmed, matchVariant } from './matching';
export { METHODOLOGY_VERSION };
const ordinal = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
export const none = (): Confidence => ({ score: null, level: 'NONE', reasons: [] });
export function timestamp(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)) return null;
  // Reject calendar rollover (Date.parse otherwise silently accepts e.g. February 30).
  const day = Number(value.slice(8, 10)), month = Number(value.slice(5, 7)), year = Number(value.slice(0, 4));
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1]!) return null;
  if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) return null;
  const t = Date.parse(value); return Number.isFinite(t) ? t : null;
}
export type Freshness = { ok: true; effective_at: number; valid_until: number } | { ok: false; reason: ExclusionReason };
/** spec v0.1 §4: older timestamp; exactly expiry passes; either >5m future fails.
 * Small future skew is admitted but recency age is clamped to zero, not >1. */
export function freshness(c: ComparableCandidate, now: number): Freshness {
  if (!Number.isSafeInteger(now)) throw new RangeError('Invalid injected clock');
  const s = c.source;
  const raw = [c.observation.observed_at, c.observation.source_updated_at].filter(x => x !== null && x !== undefined);
  if (!raw.length) return { ok: false, reason: 'UNDATED' };
  const times = raw.map(timestamp), expiry = timestamp(s.expires_at);
  if (times.some(t => t === null || t > now + FUTURE_TOLERANCE_MS) || expiry === null) return { ok: false, reason: 'INVALID_TIMESTAMP' };
  const effective_at = Math.min(...times as number[]);
  const valid_until = Math.min(effective_at + FRESHNESS_DAYS[c.variant.condition] * DAY_MS, expiry);
  return now > valid_until ? { ok: false, reason: 'STALE' } : { ok: true, effective_at, valid_until };
}
export type Included = { input_index: number; candidate: ComparableCandidate; effective_at: number; valid_until: number };
export type PoolEvaluation = { pool: MarketPool | null; evidence: EvidenceSummary; insufficient_reasons: InsufficientReason[];
  included: Included[]; exclusions: Array<{ input_index: number; reason: ExclusionReason; before_count: number; after_count: number }>; warnings: string[]; unrounded: { low: Rational; high: Rational; median: Rational } | null; valid_until: number | null };
export function confidenceBand(score: number): Confidence['level'] {
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new RangeError('Confidence out of range');
  return score <= 49 ? 'LOW' : score <= 79 ? 'MEDIUM' : 'HIGH';
}
export function roundConfidence(value: Rational, mode: ConfidenceRounding = CONFIDENCE_ROUNDING_POLICY.mode): number {
  if (value.n < 0n) throw new RangeError('Negative confidence');
  return Number(mode === 'HALF_EVEN' ? halfEven(value) : (value.n * 2n + value.d) / (value.d * 2n));
}
export function scoreConfidence(args: { n: number; d: number; recency: number | Rational; quality: number | Rational;
  wide: boolean; attributeMatch: boolean; geographicUnverified?: boolean; ptaUnconfirmed?: boolean;
  nearExpiry?: boolean; geoSpread?: boolean }): Confidence {
  const { n, d } = args;
  if (![n, d].every(Number.isSafeInteger) || n < 0 || d < 0) throw new RangeError('Invalid confidence counts');
  if (n < 3) return none();
  if (d < 1) throw new RangeError('Invalid confidence counts');
  const clamp = (value: number | Rational): Rational => {
    const x = typeof value === 'number' ? decimalRational(value) : value;
    return cmp(x, rat(0n)) < 0 ? rat(0n) : cmp(x, rat(1n)) > 0 ? rat(1n) : x;
  };
  // spec v0.1 §8: exact weights, half-even once, then caps and bands.
  const sample = rat(BigInt(Math.min(n, 10)), 10n), diversity = rat(BigInt(Math.min(d, 3)), 3n);
  const raw = mul(add(add(mul(sample, 3n, 10n), mul(diversity, 1n, 4n)),
    add(mul(clamp(args.recency), 1n, 4n), mul(clamp(args.quality), 1n, 5n))), 100n);
  let score = roundConfidence(raw);
  const codes: ConfidenceReason[] = ['ASKING_NOT_SOLD_PRICES'];
  if (n < 5) { score = Math.min(score, 49); codes.push('FEW_COMPARABLES'); }
  if (d < 2) { score = Math.min(score, 49); codes.push('SINGLE_SOURCE'); }
  if (args.wide) { score = Math.min(score, 79); codes.push('WIDE_SPREAD'); }
  if (args.attributeMatch) { score = Math.min(score, 79); codes.push('ATTRIBUTE_MATCH_NOT_SKU'); }
  // spec v0.1 §9 removes the geographic cap; legacy geographicUnverified is ignored.
  if (args.ptaUnconfirmed) { score = Math.min(score, 49); codes.push('PTA_UNCONFIRMED'); }
  if (args.nearExpiry) codes.push('NEAR_EXPIRY');
  if (args.geoSpread) codes.push('GEO_SPREAD');
  return { score, level: confidenceBand(score), reasons: codes.map(code => ({ code, message_key: `confidence.${code.toLowerCase()}`, params: {} })) };
}
/** Informational only. Missing-city offers still contribute to overall median. */
export function geoSpread(included: Included[], overall: Rational): boolean {
  const cities = new Map<string, number[]>();
  for (const { candidate: c } of included) {
    const o = c.observation;
    const city = c.city?.trim().toLowerCase();
    if (city) cities.set(city, [...(cities.get(city) ?? []), o.price.amount_minor]);
  }
  const medians = [...cities.values()].filter(xs => xs.length >= GEO_MIN_CITY_SAMPLES)
    .map(xs => median(xs.sort((a, b) => a - b))).sort(cmp);
  return medians.length >= 2 && cmp(mul(sub(medians.at(-1)!, medians[0]!), 100n), mul(overall, BigInt(GEO_SPREAD_PERCENT))) > 0;
}
export function poolConfidence(included: Included[], unrounded: NonNullable<PoolEvaluation['unrounded']>, now: number,
  ptaUnconfirmed = false, geographicUnverified = false): Confidence {
  const sources = independentSources(included);
  const recency = mul(included.reduce((sum, x) => add(sum, sub(rat(1n), rat(
    BigInt(Math.max(0, now - x.effective_at)), BigInt(2 * FRESHNESS_DAYS[x.candidate.variant.condition] * DAY_MS)))), rat(0n)), 1n, BigInt(included.length));
  const quality = mul(included.reduce((sum, x) => add(sum, decimalRational(x.candidate.variantMatch.quality)), rat(0n)), 1n, BigInt(included.length));
  const prices = included.map(x => x.candidate.observation.price.amount_minor).sort((a, b) => a - b);
  // spec v0.1 §6: P90-P10 cap even when n3–4 displays MIN_MAX.
  const wide = cmp(mul(sub(quantile(prices, 9, 10), quantile(prices, 1, 10)), 100n), mul(unrounded.median, BigInt(WIDE_SPREAD_PERCENT))) > 0;
  return scoreConfidence({ n: included.length, d: sources, recency,
    quality,
    wide, attributeMatch: included.some(x => x.candidate.variantMatch.quality < 1), geographicUnverified,
    ptaUnconfirmed, geoSpread: geoSpread(included, unrounded.median),
    nearExpiry: included.some(x => cmp(rat(BigInt(Math.max(0, now - x.effective_at)),
      BigInt(FRESHNESS_DAYS[x.candidate.variant.condition] * DAY_MS)), sub(rat(1n), decimalRational(NEAR_EXPIRY_REMAINING))) >= 0) });
}
function independentSources(xs: Included[]): number {
  // spec v0.1 §2: ultimate merchant owner, never API/platform-owner diversity.
  return new Set(xs.map(x => x.candidate.sellerOwnerId).filter((x): x is string => x !== null)).size;
}
export class ConfigurationRequiredError extends Error {
  constructor() { super('CONFIGURATION_REQUIRED: approved category price bounds required'); }
}
export function approvedApprover(config: CategoryConfig): boolean { return parseApprovedPolicy(config) !== null; }
export function configuredPriceBounds(config: CategoryConfig, condition?: Condition): { min: number; max: number } {
  const validated = loadCategoryConfig(config); if(!validated) throw new ConfigurationRequiredError();
  config=validated;
  const bounds = config.price_bounds_minor;
  if (!bounds || typeof bounds.min !== 'number' || typeof bounds.max !== 'number' || !Number.isSafeInteger(bounds.min) || !Number.isSafeInteger(bounds.max) || bounds.min < 1 || bounds.max < bounds.min ||
    (bounds.basis !== 'APPROVED' && !(bounds.basis === 'SYNTHETIC' && config.environment === 'SYNTHETIC' && config.version.startsWith('synthetic')))) throw new ConfigurationRequiredError();
  if (bounds.basis === 'APPROVED' && (!parseApprovedPolicy(config) || (condition !== undefined && !config.approval_scope!.conditions.includes(condition)))) throw new ConfigurationRequiredError();
  return { min: bounds.min, max: bounds.max };
}
export function evaluatePool(args: { target: Variant; config: CategoryConfig; candidates: ComparableCandidate[];
  condition: Condition; now: number; ptaUnconfirmed?: boolean; geographicUnverified?: boolean }): PoolEvaluation {
  const { target, condition, now, candidates } = args;
  const config=loadCategoryConfig(ownData(args,'config'));if(!config) throw new ConfigurationRequiredError();
  if (!Number.isSafeInteger(now)) throw new RangeError('Invalid injected clock');
  const bounds = configuredPriceBounds(config, condition);
  const excluded = new Map<ExclusionReason, number>();
  const exclusions: PoolEvaluation['exclusions'] = [];
  const warnings: string[] = [];
  const reject = (r: ExclusionReason, input_index: number): void => { excluded.set(r, (excluded.get(r) ?? 0) + 1); const before_count = candidates.length - exclusions.length; exclusions.push({ input_index, reason: r, before_count, after_count: before_count - 1 }); };
  let included: Included[] = [];
  const identity = identityConfirmed(target, config, condition);
  let temporalCandidates = 0, temporalSurvivors = 0;
  for (const [input_index, c] of candidates.entries()) {
    const o = c.observation;
    const localMatch = matchVariant(target, c.variant, config, condition);
    const upstream = c.variantMatch.matched ? null : c.variantMatch.exclusion_reason;
    const matchReason = localMatch.matched ? null : localMatch.exclusion_reason;
    let reason: ExclusionReason | null = null;
    // spec v0.1 §5 primary exclusion precedence (one reason per input).
    for (const code of EXCLUSION_ORDER.slice(0, EXCLUSION_ORDER.indexOf('INVALID_TIMESTAMP'))) {
      const fails = code === 'TARGET_LISTING' ? c.targetListing :
        code === 'UNVERIFIED_RIGHTS' ? !c.rightsVerified || c.rights_status !== 'PERMITTED' || !c.source.permission_record_id ||
          timestamp(c.source.expires_at) === null || timestamp(c.source.expires_at)! < now :
        code === 'UNSUPPORTED_CURRENCY' ? o.price.currency !== 'PKR' :
        code === 'PRICE_NOT_COMPARABLE' ? !c.comparable || c.price_basis !== 'FULL_CASH_TAX_INCLUSIVE' ||
          !Number.isSafeInteger(o.price.amount_minor) || o.price.amount_minor <= 0 :
        code === 'OUT_OF_CATEGORY_BOUNDS' ? o.price.amount_minor < bounds.min || o.price.amount_minor > bounds.max :
        code === 'NOT_IN_STOCK' ? !c.inStock :
        code === 'UNKNOWN_CRITICAL_ATTRIBUTE' ? !identity || matchReason === code : matchReason === code;
      if (fails || upstream === code) { reason = code; break; }
    }
    if (reason) { reject(reason, input_index); continue; }
    temporalCandidates++;
    const fresh = freshness(c, now);
    if (!fresh.ok) { reject(fresh.reason, input_index); continue; }
    temporalSurvivors++;
    if (c.verification !== 'VERIFIED' || !c.sellerOwnerId || !c.source.source_owner_group || !c.evidence_hash ||
      !o.listing_id || !o.provenance_ref || !c.source_ref || c.source_ref !== o.provenance_ref || !c.canonicalListingId || timestamp(o.retrieved_at) === null ||
      !['LICENSED_API', 'PERMISSIONED_FEED', 'RIGHTS_CLEARED_DIRECT_QUOTE'].includes(c.source.method) ||
      ![0.9, 1].includes(c.variantMatch.quality) || upstream !== null) { reject(upstream ?? 'UNVERIFIED_PROVENANCE', input_index); continue; }
    included.push({ input_index, candidate: c, effective_at: fresh.effective_at, valid_until: fresh.valid_until });
  }
  // spec v0.1 §2: canonical listings first, then owner. Latest effective, latest retrieval,
  // lexical canonical listing then observation ID. Input order never decides the survivor.
  included.sort((a, b) => b.effective_at - a.effective_at || timestamp(b.candidate.observation.retrieved_at)! - timestamp(a.candidate.observation.retrieved_at)! ||
    ordinal(a.candidate.canonicalListingId, b.candidate.canonicalListingId) || ordinal(a.candidate.observation.id, b.candidate.observation.id));
  // API v0.7 R2: conflicting canonical observation IDs are never array-order winners.
  const facts = (x: Included) => canonicalJson([x.candidate.observation, x.candidate.canonicalListingId,
    x.candidate.sellerOwnerId, x.candidate.variant, x.candidate.variantMatch, x.candidate.source_ref]);
  const idFacts = new Map<string, Set<string>>();
  for (const x of included) { const id = x.candidate.observation.id; const values = idFacts.get(id) ?? new Set<string>(); values.add(facts(x)); idFacts.set(id, values); }
  included = included.filter(x => { if (idFacts.get(x.candidate.observation.id)!.size > 1) { reject('UNVERIFIED_PROVENANCE', x.input_index); return false; } return true; });
  const listings = new Set<string>(), ids = new Set<string>();
  included = included.filter(x => {
    const c = x.candidate, o = c.observation;
    if (listings.has(c.canonicalListingId) || ids.has(o.id)) { reject('DUPLICATE', x.input_index); return false; }
    listings.add(c.canonicalListingId); ids.add(o.id); return true;
  });
  const sellers = new Set<string | null>();
  included = included.filter(x => {
    if (sellers.has(x.candidate.sellerOwnerId)) { reject('DUPLICATE', x.input_index); return false; }
    sellers.add(x.candidate.sellerOwnerId); return true;
  });
  included.sort((a, b) => a.candidate.observation.price.amount_minor - b.candidate.observation.price.amount_minor);
  let prices = included.map(x => x.candidate.observation.price.amount_minor);
  if (prices.length >= 8) {
    const q1 = quantile(prices, 1, 4), q3 = quantile(prices, 3, 4), iqr = sub(q3, q1);
    if (iqr.n === 0n && prices[0] !== prices.at(-1)) warnings.push('IQR_ZERO_SPREAD_REVIEW');
    if (iqr.n !== 0n) {
      const low = sub(q1, mul(iqr, 3n, 2n)), high = add(q3, mul(iqr, 3n, 2n));
      included = included.filter(x => {
        const p = rat(BigInt(x.candidate.observation.price.amount_minor));
        if (cmp(p, low) < 0 || cmp(p, high) > 0) { reject('STATISTICAL_OUTLIER', x.input_index); return false; }
        return true;
      });
    }
  }
  prices = included.map(x => x.candidate.observation.price.amount_minor);
  const n = prices.length, d = independentSources(included);
  const insufficient_reasons: InsufficientReason[] = [];
  if (!identity) insufficient_reasons.push('IDENTITY_UNCONFIRMED');
  if (!n && excluded.has('UNVERIFIED_RIGHTS')) insufficient_reasons.push('NO_PERMITTED_SOURCE');
  if (!n && temporalCandidates > 0 && temporalSurvivors === 0) insufficient_reasons.push('NO_FRESH_EVIDENCE');
  if (n < 3) insufficient_reasons.push('TOO_FEW_COMPARABLES');
  const m = n ? median(prices) : rat(0n);
  if (n >= 3 && cmp(mul(sub(rat(BigInt(prices.at(-1)!)), rat(BigInt(prices[0]!))), 100n), mul(m, BigInt(MAX_SPREAD_PERCENT))) > 0) insufficient_reasons.push('EXCESSIVE_SPREAD');
  const evidence: EvidenceSummary = { retrieved_count: candidates.length, included_count: n,
    used_condition_included_count: condition === 'USED' ? n : 0, excluded_count: candidates.length - n,
    excluded_by_reason: EXCLUSION_ORDER.filter(code => excluded.has(code)).map(code => ({ code, count: excluded.get(code)! })),
    new_pool_count: condition === 'NEW_SEALED' ? n : 0, used_pool_count: condition === 'USED' ? n : 0,
    independent_sources: d, ...evidenceMetadata(included, now), observations: evidenceRows(included, config) };
  if (insufficient_reasons.length) return { pool: null, evidence: suppressEvidenceRows(evidence), insufficient_reasons, included, exclusions, warnings, unrounded: null, valid_until: null };
  const unrounded = { low: n < 5 ? rat(BigInt(prices[0]!)) : quantile(prices, 1, 10),
    high: n < 5 ? rat(BigInt(prices.at(-1)!)) : quantile(prices, 9, 10), median: m };
  const pool: MarketPool = { range_low: money(unrounded.low), range_high: money(unrounded.high), median: money(m),
    fair_band_low: money(mul(m, BigInt(100 + FAIR_LOW_PERCENT), 100n)), fair_band_high: money(mul(m, BigInt(100 + FAIR_HIGH_PERCENT), 100n)),
    range_method: n < 5 ? 'MIN_MAX' : 'P10_P90', observation_ids: included.map(x => x.candidate.observation.id),
    provenance: evidence.observations.map(o => o.source), n_effective: n, independent_sources: d,
    confidence: poolConfidence(included, unrounded, now, args.ptaUnconfirmed, args.geographicUnverified) };
  return { pool, evidence, insufficient_reasons, included, exclusions, warnings, unrounded, valid_until: Math.min(...included.map(x => x.valid_until)) };
}
export function verdictFor(askingMinor: number, anchor: Rational): { verdict: 'FAIR' | 'HIGH' | 'UNUSUALLY_LOW'; diff_absolute_minor: number; diff_percent: DifferencePercentagePoints; diff_percentage_points: DifferencePercentagePoints; diff_ratio: Rational } {
  if (!Number.isSafeInteger(askingMinor) || askingMinor <= 0 || anchor.n <= 0n) throw new RangeError('Invalid asking price/median');
  const diff = sub(rat(BigInt(askingMinor)), anchor);
  // Exact equivalent to delta ratio <= +.10 and >= -.15, before any rounding.
  const verdict = cmp(mul(diff, 100n), mul(anchor, BigInt(FAIR_HIGH_PERCENT))) > 0 ? 'HIGH' :
    cmp(mul(diff, 100n), mul(anchor, BigInt(FAIR_LOW_PERCENT))) < 0 ? 'UNUSUALLY_LOW' : 'FAIR';
  const diff_ratio = rat(diff.n * anchor.d, diff.d * anchor.n);
  const diff_percentage_points = (100 * asNumber(diff_ratio)) as DifferencePercentagePoints;
  // Legacy QA-facing primitive alias; wire DTO uses branded FRACTION, never this field.
  return { verdict, diff_absolute_minor: Number(halfEven(diff)), diff_percent: diff_percentage_points, diff_percentage_points, diff_ratio };
}
