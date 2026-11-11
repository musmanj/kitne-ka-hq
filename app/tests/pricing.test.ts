import { describe, expect, it } from 'vitest';
import { syntheticCandidate, syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
import { asNumber, median, quantile, rat } from '../src/domain/numeric';
import { confidenceBand, evaluatePool, freshness, scoreConfidence, timestamp, verdictFor } from '../src/domain/pricing';
import { DAY_MS, FUTURE_TOLERANCE_MS } from '../src/domain/policy';
import type { ComparableCandidate, ExclusionReason } from '../src/domain/types';
const now = Date.parse(SYNTHETIC_NOW);
function pool(candidates: ComparableCandidate[], extra: { geographicUnverified?: boolean; ptaUnconfirmed?: boolean } = {}) {
  const input = syntheticInput();
  return evaluatePool({ target: input.variant, config: input.config, candidates, condition: input.variant.condition, now, ...extra });
}
function prices(xs: number[]) { return xs.map((x, i) => { const c = syntheticCandidate(i); c.observation.price.amount_minor = x; return c; }); }
describe('exact statistics and n gates', () => {
  it.each([2, 3, 4, 5, 7, 8])('n=%s boundary', n => {
    const result = pool(Array.from({ length: n }, (_, i) => syntheticCandidate(i, 100000 + i * 100)));
    expect(result.pool?.n_effective ?? null).toBe(n < 3 ? null : n);
    expect(result.pool?.range_method ?? null).toBe(n < 3 ? null : n < 5 ? 'MIN_MAX' : 'P10_P90');
    if (n < 3) expect(result.insufficient_reasons).toContain('TOO_FEW_COMPARABLES');
    else if (n < 5) expect(result.pool!.confidence.score).toBeLessThanOrEqual(49);
  });
  it('matches CTO invented arithmetic including score 82 and exact range', () => {
    const result = pool([98000, 100000, 102000, 104000, 106000].map((p, i) => syntheticCandidate(i, p, i + 1)));
    expect(result.pool).toMatchObject({ median: { amount_minor: 10200000 }, range_low: { amount_minor: 9880000 },
      range_high: { amount_minor: 10520000 }, fair_band_low: { amount_minor: 8670000 },
      fair_band_high: { amount_minor: 11220000 }, confidence: { score: 82, level: 'HIGH' } });
    expect(verdictFor(11500000, result.unrounded!.median).verdict).toBe('HIGH');
  });
  it('linear interpolation and even median stay unrounded', () => {
    expect(asNumber(quantile([100, 101, 102, 103, 104], 1, 10))).toBe(100.4);
    expect(asNumber(median([100, 101, 102, 103]))).toBe(101.5);
    expect(pool(prices([100, 101, 102, 103])).pool?.median.amount_minor).toBe(102);
  });
  it('rejects empty, unsorted and invalid quantiles', () => {
    for (const call of [() => median([]), () => quantile([2, 1], 1, 2), () => quantile([1], 2, 1), () => median([NaN])]) expect(call).toThrow();
  });
  it('IQR only starts at initial n8; post-trim n7 is P10-P90', () => {
    expect(pool(prices([100, 101, 102, 103, 104, 105, 150])).evidence.excluded_by_reason).toEqual([]);
    const e = pool(prices([100, 101, 102, 103, 104, 105, 106, 150]));
    expect(e.pool?.n_effective).toBe(7); expect(e.pool?.range_method).toBe('P10_P90');
    expect(e.evidence.excluded_by_reason).toContainEqual({ code: 'STATISTICAL_OUTLIER', count: 1 });
  });
  it('zero IQR never trims, flags anomaly; factual spread gate still applies', () => {
    const e = pool(prices([100, 100, 100, 100, 100, 100, 100, 150]));
    expect(e.pool?.n_effective).toBe(8); expect(e.warnings).toContain('IQR_ZERO_SPREAD_REVIEW');
    const bad = pool(prices([100, 100, 100, 100, 100, 100, 100, 200]));
    expect(bad.pool).toBeNull(); expect(bad.insufficient_reasons).toContain('EXCESSIVE_SPREAD');
  });
  it('IQR strict fence equality is kept', () => {
    // Q1=100,Q3=104,IQR=4 => upper=110 exactly.
    const e = pool(prices([100, 100, 100, 102, 102, 104, 104, 110]));
    expect(e.pool?.n_effective).toBe(8);
  });
  it.each([[70, 130, true], [70, 131, false]])('spread %s..%s boundary', (low, high, passes) => {
    expect(pool(prices([low, 100, high])).pool !== null).toBe(passes);
  });
});
describe('thresholds use exact unrounded anchor', () => {
  it.each([[8499, 'UNUSUALLY_LOW'], [8500, 'FAIR'], [8501, 'FAIR'], [11000, 'FAIR'], [11001, 'HIGH']])('%s => %s', (a, v) => {
    expect(verdictFor(a as number, rat(10000n)).verdict).toBe(v);
  });
  it('does not classify using rounded median or graphical midpoint', () => {
    expect(verdictFor(111, rat(201n, 2n)).verdict).toBe('HIGH'); // 110.55 high edge, rounded M101 would hide it
    expect(verdictFor(110, rat(201n, 2n)).diff_absolute_minor).toBe(10); // 9.5 => half-even10
    expect(verdictFor(109, rat(201n, 2n)).diff_absolute_minor).toBe(8); // 8.5 => half-even8
  });
  it.each([0, -1, 1.5, Infinity])('rejects invalid ask %s', a => expect(() => verdictFor(a, rat(100n))).toThrow());
});
describe('freshness and timestamp failure paths', () => {
  it.each(['NEW_SEALED', 'USED'] as const)('%s exact boundary, then +1ms', condition => {
    const c = syntheticCandidate(0, 100, condition === 'USED' ? 30 : 14); c.variant.condition = condition;
    expect(freshness(c, now).ok).toBe(true);
    expect(freshness(c, now + 1)).toEqual({ ok: false, reason: 'STALE' });
  });
  it('older source_updated_at wins over observed_at and retrieval never refreshes it', () => {
    const c = syntheticCandidate(0, 100, 1);
    c.observation.source_updated_at = new Date(now - 15 * DAY_MS).toISOString();
    expect(freshness(c, now)).toEqual({ ok: false, reason: 'STALE' });
    c.observation.observed_at = new Date(now - 16 * DAY_MS).toISOString();
    c.observation.source_updated_at = SYNTHETIC_NOW;
    expect(freshness(c, now)).toEqual({ ok: false, reason: 'STALE' });
  });
  it.each(['observed_at', 'source_updated_at'] as const)('future tolerance %s', field => {
    const c = syntheticCandidate(0);
    c.observation[field] = new Date(now + FUTURE_TOLERANCE_MS).toISOString();
    expect(freshness(c, now).ok).toBe(true);
    c.observation[field] = new Date(now + FUTURE_TOLERANCE_MS + 1).toISOString();
    expect(freshness(c, now)).toEqual({ ok: false, reason: 'INVALID_TIMESTAMP' });
  });
  it('handles missing, malformed dates and contractual earlier expiry', () => {
    const c = syntheticCandidate(0); c.observation.observed_at = null;
    expect(freshness(c, now)).toEqual({ ok: false, reason: 'UNDATED' });
    c.observation.source_updated_at = SYNTHETIC_NOW;
    expect(freshness(c, now).ok).toBe(true);
    c.observation.observed_at = '2026-02-30T00:00:00Z';
    expect(freshness(c, now)).toEqual({ ok: false, reason: 'INVALID_TIMESTAMP' });
    c.observation.observed_at = SYNTHETIC_NOW;
    c.source.expires_at = new Date(now).toISOString();
    expect(freshness(c, now).ok).toBe(true); expect(freshness(c, now + 1).ok).toBe(false);
    expect(timestamp('2026-11-09T00:00:00')).toBeNull(); expect(timestamp('not a date')).toBeNull();
  });
});
describe('audit exclusions, permission and independence', () => {
  const cases: Array<[ExclusionReason, (c: ComparableCandidate) => void]> = [
    ['TARGET_LISTING', c => { c.targetListing = true; }], ['UNVERIFIED_RIGHTS', c => { c.rightsVerified = false; }],
    ['UNVERIFIED_PROVENANCE', c => { c.verification = 'UNVERIFIED'; }],
    ['UNVERIFIED_PROVENANCE', c => { c.variantMatch.quality = 0.8; }],
    ['NOT_IN_STOCK', c => { c.inStock = false; }], ['PRICE_NOT_COMPARABLE', c => { c.comparable = false; }],
    ['PRICE_NOT_COMPARABLE', c => { c.observation.price.amount_minor = 0; }],
    ['PRICE_NOT_COMPARABLE', c => { c.observation.price.amount_minor = -1; }],
    ['PRICE_NOT_COMPARABLE', c => { c.observation.price.amount_minor = 1.5; }],
    ['UNSUPPORTED_CURRENCY', c => { c.observation.price.currency = 'USD' as 'PKR'; }],
    ['VARIANT_MISMATCH', c => { c.variant.attributes.storage_gb = 256; }],
    ['UNKNOWN_CRITICAL_ATTRIBUTE', c => { delete c.variant.attributes.storage_gb; }],
    ['CONDITION_MISMATCH', c => { c.variant.condition = 'USED'; }],
    ['STALE', c => { c.observation.observed_at = new Date(now - 15 * DAY_MS).toISOString(); }],
    ['UNDATED', c => { c.observation.observed_at = null; }],
    ['INVALID_TIMESTAMP', c => { c.observation.observed_at = 'garbage'; }],
    ['PRICE_NOT_COMPARABLE', c => { c.variantMatch = { matched: false, exclusion_reason: 'PRICE_NOT_COMPARABLE', quality: 1 }; }]
  ];
  it.each(cases)('excludes %s once', (reason, mutate) => {
    const input = syntheticInput(5); mutate(input.candidates[0]!);
    const e = pool(input.candidates);
    expect(e.evidence.excluded_by_reason).toContainEqual({ code: reason, count: 1 });
    expect(e.evidence.included_count + e.evidence.excluded_count).toBe(e.evidence.retrieved_count);
    expect(e.evidence.excluded_by_reason.reduce((n, x) => n + x.count, 0)).toBe(e.evidence.excluded_count);
    e.exclusions.forEach((audit, i) => { expect(audit.before_count).toBe(input.candidates.length - i); expect(audit.after_count).toBe(audit.before_count - 1); });
  });
  it.each(['seller', 'listing'])('deduplicates %s; retains newest effective observation', key => {
    const xs = [syntheticCandidate(0, 100, 2), syntheticCandidate(1, 101, 1), syntheticCandidate(2, 100, 1), syntheticCandidate(3, 100, 1)];
    if (key === 'seller') xs[0]!.sellerOwnerId = xs[1]!.sellerOwnerId;
    if (key === 'listing') xs[0]!.canonicalListingId = xs[1]!.canonicalListingId;
    const e = pool(xs);
    expect(e.pool?.n_effective).toBe(3); expect(e.evidence.excluded_by_reason).toContainEqual({ code: 'DUPLICATE', count: 1 });
    expect(e.included.some(x => x.candidate.observation.price.amount_minor === 10100)).toBe(true);
    expect(pool([...xs].reverse()).pool).toEqual(e.pool);
  });
  it('API v0.3: independent merchant owners are counted separately even on one platform', () => {
    const xs = syntheticInput(10).candidates;
    xs.forEach(x => { x.source.source_owner_group = 'one-platform'; });
    expect(pool(xs).pool).toMatchObject({ independent_sources: 10, confidence: { level: 'HIGH' } });
  });
});
describe('confidence bands, caps and informational reasons', () => {
  const base = { n: 10, d: 3, recency: 1, quality: 1, wide: false, attributeMatch: false };
  it.each([[0, 'LOW'], [49, 'LOW'], [50, 'MEDIUM'], [79, 'MEDIUM'], [80, 'HIGH'], [100, 'HIGH']])('score %s = %s', (s, level) => expect(confidenceBand(s as number)).toBe(level));
  it.each([-1, 101, 49.5, NaN])('invalid score %s', s => expect(() => confidenceBand(s)).toThrow());
  it.each([
    [{ n: 4 }, 49, 'FEW_COMPARABLES'], [{ d: 1 }, 49, 'SINGLE_SOURCE'],
    [{ wide: true }, 79, 'WIDE_SPREAD'], [{ attributeMatch: true }, 79, 'ATTRIBUTE_MATCH_NOT_SKU'],
    [{ geographicUnverified: true }, 100, 'ASKING_NOT_SOLD_PRICES'], [{ ptaUnconfirmed: true }, 49, 'PTA_UNCONFIRMED'],
    [{ nearExpiry: true }, 100, 'NEAR_EXPIRY'], [{ geoSpread: true }, 100, 'GEO_SPREAD']
  ])('caps/reasons %j', (patch, score, reason) => {
    const c = scoreConfidence({ ...base, ...patch }); expect(c.score).toBe(score);
    expect(c.reasons.map(r => r.code)).toContain(reason);
  });
  it('insufficient score null, clamps components, rejects nonfinite components', () => {
    expect(scoreConfidence({ ...base, n: 2 }).score).toBeNull();
    expect(scoreConfidence({ ...base, recency: 10, quality: 10 }).score).toBe(100);
    expect(() => scoreConfidence({ ...base, recency: NaN })).toThrow();
  });
  it('wide >30% cap, exact30% is not wide', () => {
    const equal = pool(prices([85, 85, 100, 100, 100, 100, 100, 100, 115, 115]));
    const greater = pool(prices([84, 84, 100, 100, 100, 100, 100, 100, 116, 116]));
    expect(equal.pool?.confidence.reasons.map(r => r.code)).not.toContain('WIDE_SPREAD');
    expect(greater.pool?.confidence.reasons.map(r => r.code)).toContain('WIDE_SPREAD');
  });
  it('near expiry oldest exactly20% remaining and infinitesimally younger', () => {
    const xs = syntheticInput(5).candidates;
    xs[0]!.observation.observed_at = new Date(now - 14 * DAY_MS * .8).toISOString();
    expect(pool(xs).pool?.confidence.reasons.map(r => r.code)).toContain('NEAR_EXPIRY');
    xs[0]!.observation.observed_at = new Date(now - 14 * DAY_MS * .8 + 1).toISOString();
    expect(pool(xs).pool?.confidence.reasons.map(r => r.code)).not.toContain('NEAR_EXPIRY');
  });
  it.each([[115, false], [116, true]])('city median difference threshold %s', (high, expected) => {
    const xs = prices([100, 100, high, high, 100]);
    xs.forEach((c, i) => { c.city = i < 2 ? 'SYNTHETIC A' : i < 4 ? 'SYNTHETIC B' : null; });
    const e = pool(xs); expect(e.pool?.confidence.reasons.some(r => r.code === 'GEO_SPREAD')).toBe(expected);
    const score = e.pool?.confidence.score;
    xs.forEach(c => { c.city = null; });
    expect(pool(xs).pool?.confidence.score).toBe(score);
  });
  it('one comparable per city cannot trigger GEO_SPREAD', () => {
    const xs = prices([90, 100, 110]); xs[0]!.city = 'A'; xs[2]!.city = 'B';
    expect(pool(xs).pool?.confidence.reasons.map(r => r.code)).not.toContain('GEO_SPREAD');
  });
});
describe('exact confidence tie regression (money and confidence policies are distinct)', () => {
  it('the exact78.5 formula rounds half-even to78 under CTO v0.1, not an accidental float tie', () => {
    expect(scoreConfidence({ n: 7, d: 3, recency: .5, quality: 1, wide: false, attributeMatch: false }).score).toBe(78);
  });
});
