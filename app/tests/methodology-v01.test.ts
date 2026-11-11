import { describe, expect, it } from 'vitest';
import { ConfigurationRequiredError, classify, evaluateCheck, evaluatePool, normalisePkr, rat,
  roundConfidence, scoreConfidence, type ClassifyContext } from '../src/index';
import { syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
const now = Date.parse(SYNTHETIC_NOW);
const context = (patch: Partial<ClassifyContext> = {}): ClassifyContext => ({ now: SYNTHETIC_NOW, expected_version: 1,
  idempotency_key: 'SYNTHETIC-v01', evidence_valid: true, resource_known: true, capability_valid: true, ...patch });
function evaluate(input = syntheticInput()) { return evaluatePool({ target: input.variant, config: input.config, candidates: input.candidates, condition: input.variant.condition, now }); }
describe('CTO-confirmed v0.1 — independently tested corrections to stale QA vectors', () => {
  it.each([[157n, 2n, 78], [145n, 2n, 72], [99n, 2n, 50], [159n, 2n, 80]])('exact confidence tie %s/%s ->%s', (n, d, rounded) => {
    expect(roundConfidence(rat(n, d))).toBe(rounded);
  });
  it('49.5 becomes50 once, THEN the n4 cap applies49', () => {
    expect(scoreConfidence({ n: 4, d: 3, recency: .5, quality: .5, wide: false, attributeMatch: false }).score).toBe(49);
  });
  it('CON-12 corrected score72, without intermediate float rounding', () => {
    expect(scoreConfidence({ n: 5, d: 3, recency: rat(1n, 2n), quality: 1, wide: false, attributeMatch: false })).toMatchObject({ score: 72, level: 'MEDIUM' });
  });
  it('all stale reports temporal failure then too-few, no spread evaluation with n2', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.observation.observed_at = '2026-10-01T00:00:00+05:00'; });
    expect(evaluate(input).insufficient_reasons).toEqual(['NO_FRESH_EVIDENCE', 'TOO_FEW_COMPARABLES']);
    const n2 = syntheticInput(2); n2.candidates[0]!.observation.price.amount_minor = 1;
    expect(evaluate(n2).insufficient_reasons).toEqual(['TOO_FEW_COMPARABLES']);
  });
  it('timestamp survivors with failed seller provenance do not fabricate all-stale reason', () => {
    const input = syntheticInput(2); input.candidates[0]!.observation.observed_at = '2026-10-01T00:00:00+05:00';
    input.candidates[1]!.sellerOwnerId = null;
    expect(evaluate(input).insufficient_reasons).toEqual(['TOO_FEW_COMPARABLES']);
  });
  it('one ultimate owner across domains contributes only one observation', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.sellerOwnerId = 'SYNTHETIC-same-owner'; });
    const p = evaluate(input); expect(p.evidence.included_count).toBe(1); expect(p.evidence.independent_sources).toBe(1); expect(p.pool).toBeNull();
  });
  it('unknown owner cannot fabricate diversity', () => {
    const input = syntheticInput(); input.candidates[0]!.sellerOwnerId = null;
    expect(evaluate(input).evidence.excluded_by_reason).toContainEqual({ code: 'UNVERIFIED_PROVENANCE', count: 1 });
  });
  it('canonical listing dedup precedes owner dedup', () => {
    const input = syntheticInput(3), [a, b, c] = input.candidates;
    a!.sellerOwnerId = b!.sellerOwnerId = 'SYNTHETIC-A'; c!.sellerOwnerId = 'SYNTHETIC-B';
    a!.canonicalListingId = 'SYNTHETIC-new-listing'; b!.canonicalListingId = c!.canonicalListingId = 'SYNTHETIC-cross-post';
    a!.observation.observed_at = new Date(now - 1000).toISOString();
    b!.observation.observed_at = new Date(now - 2000).toISOString();
    c!.observation.observed_at = new Date(now - 3000).toISOString();
    const p = evaluate(input); expect(p.included).toHaveLength(1); expect(p.included[0]?.candidate.observation.id).toBe(a!.observation.id);
  });
  it('tie uses newest retrieval before lexical canonical/id', () => {
    const input = syntheticInput(3), a = input.candidates[0]!, b = input.candidates[1]!;
    a.sellerOwnerId = b.sellerOwnerId = 'SYNTHETIC-owner';
    a.observation.retrieved_at = new Date(now - 1000).toISOString(); b.observation.retrieved_at = new Date(now).toISOString();
    expect(evaluate(input).included.map(x => x.candidate.observation.id)).toContain(b.observation.id);
    b.observation.retrieved_at = a.observation.retrieved_at;
    b.canonicalListingId = 'AAA'; a.canonicalListingId = 'ZZZ';
    expect(evaluate(input).included.map(x => x.candidate.observation.id)).toContain(b.observation.id);
    expect(evaluate({ ...input, candidates: [...input.candidates].reverse() }).included.map(x => x.candidate.observation.id)).toEqual(evaluate(input).included.map(x => x.candidate.observation.id));
  });
  it('primary order: rights then currency then price then stock then unknown/condition', () => {
    const input = syntheticInput(1), c = input.candidates[0]!;
    c.targetListing = true; c.rightsVerified = false; c.observation.price.currency = 'USD' as 'PKR'; c.comparable = false; c.inStock = false;
    c.variant.condition = 'USED'; delete c.variant.attributes.storage_gb;
    expect(evaluate(input).exclusions[0]?.reason).toBe('TARGET_LISTING');
    c.targetListing = false; expect(evaluate(input).exclusions[0]?.reason).toBe('UNVERIFIED_RIGHTS');
    c.rightsVerified = true; expect(evaluate(input).exclusions[0]?.reason).toBe('UNSUPPORTED_CURRENCY');
    c.observation.price.currency = 'PKR'; expect(evaluate(input).exclusions[0]?.reason).toBe('PRICE_NOT_COMPARABLE');
    c.comparable = true; expect(evaluate(input).exclusions[0]?.reason).toBe('NOT_IN_STOCK');
    c.inStock = true; expect(evaluate(input).exclusions[0]?.reason).toBe('UNKNOWN_CRITICAL_ATTRIBUTE');
    c.variant.attributes.storage_gb = 128; expect(evaluate(input).exclusions[0]?.reason).toBe('CONDITION_MISMATCH');
  });
  it('timestamp precedence beats unverified seller provenance', () => {
    const input = syntheticInput(1), c = input.candidates[0]!;
    c.sellerOwnerId = null; c.observation.observed_at = 'not a timestamp';
    expect(evaluate(input).exclusions[0]?.reason).toBe('INVALID_TIMESTAMP');
  });
  it('missing approved category bounds is config Error503, not market insufficiency', () => {
    const input = syntheticInput(); input.config = { ...input.config }; delete input.config.price_bounds_minor;
    expect(() => evaluate(input)).toThrow(ConfigurationRequiredError);
    expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', data: null,
      error: { code: 'CONFIGURATION_REQUIRED', http_status: 503, retryable: false, message_key: 'errors.configuration.required' } });
  });
  it('synthetic bounds cannot accidentally approve a production config', () => {
    const input = syntheticInput(); input.config = { ...input.config, version: 'production-v1' };
    input.variant.config_version = input.config.version;
    expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONFIGURATION_REQUIRED' } });
  });
  it('configured target plausibility requests confirmation, but does not guess a multiplier', () => {
    const input = syntheticInput(); input.config = { ...input.config, price_bounds_minor: { min: 9000000, max: 11000000, basis: 'SYNTHETIC' } };
    input.asking_price!.amount_minor = 50000;
    expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONFIRMATION_REQUIRED', http_status: 422 } });
    input.asking_price_confirmed = true;
    const r = evaluateCheck(input).result;
    if (r.result_state !== 'RANGE_AVAILABLE') throw new Error('Expected confirmed assessment');
    expect(r.data.asking_price?.amount_minor).toBe(50000);
  });
  it.each([0, -1, 1.1, Number.MAX_SAFE_INTEGER + 1])('invalid ask %s maps422 in both operations', amount_minor => {
    const input = syntheticInput(); input.asking_price!.amount_minor = amount_minor;
    expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', error: { code: 'INVALID_ASKING_PRICE', http_status: 422, message_key: 'errors.price.invalid' } });
    const snapshot = evaluateCheck(syntheticInput()).snapshot;
    expect(classify(snapshot, { asking_price: { amount_minor, currency: 'PKR' } }, context())).toMatchObject({ ok: false, error: { code: 'INVALID_ASKING_PRICE', http_status: 422, message_key: 'errors.price.invalid' } });
  });
  it('positive sub-paisa that rounds0 mapsZERO; technical limit is not a market cap', () => {
    expect(normalisePkr('0.004')).toEqual({ ok: false, reason: 'ZERO' });
    expect(normalisePkr('Rs 99,99,99,99,99,999')).toMatchObject({ ok: true, value: { amount_minor: 999999999999900 } });
  });
  it('API v0.4 invalidated snapshot cannot be replayed as current', () => {
    const e = evaluateCheck(syntheticInput()), ask = { asking_price: { amount_minor: 10000000, currency: 'PKR' as const } };
    const first = classify(e.snapshot, ask, context()); if (!first.ok) throw new Error('Expected success');
    expect(classify(first.snapshot, ask, context({ evidence_valid: false }))).toMatchObject({ ok: false, error: { code: 'RANGE_STALE', http_status: 409 } });
  });
  it('lean observation contains no seller, variant, source object or raw input fields', () => {
    const observation = syntheticInput().candidates[0]!.observation;
    expect(Object.keys(observation).sort()).toEqual(['id', 'listing_id', 'observed_at', 'price', 'provenance_ref', 'retrieved_at', 'source_updated_at']);
  });
});

describe('spec v0.1 §4/5/8/9 final edge audits', () => {
  it('expired rights takes primary precedence over currency/invalid time', () => {
    const input = syntheticInput(1), c = input.candidates[0]!;
    c.source.expires_at = new Date(now - 1).toISOString(); c.observation.price.currency = 'USD' as 'PKR';
    c.observation.observed_at = 'SYNTHETIC-invalid';
    expect(evaluate(input).exclusions[0]?.reason).toBe('UNVERIFIED_RIGHTS');
  });
  it('contract expiry equality admits, one millisecond later excludes rights', () => {
    const input = syntheticInput(1), c = input.candidates[0]!; c.source.expires_at = SYNTHETIC_NOW;
    expect(evaluate(input).included).toHaveLength(1);
    c.source.expires_at = new Date(now - 1).toISOString();
    expect(evaluate(input).exclusions[0]?.reason).toBe('UNVERIFIED_RIGHTS');
  });
  it('empty supplied timestamp is INVALID_TIMESTAMP, not fallback/undated', () => {
    const input = syntheticInput(1), c = input.candidates[0]!;
    c.observation.observed_at = ''; c.observation.source_updated_at = SYNTHETIC_NOW;
    expect(evaluate(input).exclusions[0]?.reason).toBe('INVALID_TIMESTAMP');
  });
  it.each([-1, 1.5, NaN, Infinity])('invalid sample count %s throws without fabricated confidence', n => {
    expect(() => scoreConfidence({ n, d: 3, recency: 1, quality: 1, wide: false, attributeMatch: false })).toThrow(RangeError);
  });
  it.each([-1, 0, 1])('near-expiry exact fractional threshold plus %sms', offset => {
    const input = syntheticInput(), threshold = 14 * 86400000 * 4 / 5;
    input.candidates[0]!.observation.observed_at = new Date(now - threshold - offset).toISOString();
    const reasons = evaluate(input).pool!.confidence.reasons.map(r => r.code);
    expect(reasons.includes('NEAR_EXPIRY')).toBe(offset >= 0);
  });
});

it('invalid injected clock is rejected even when candidate discovery is empty', () => {
  const input = syntheticInput(0);
  expect(() => evaluatePool({ target: input.variant, config: input.config, candidates: [], condition: 'NEW_SEALED', now: NaN })).toThrow(RangeError);
});
