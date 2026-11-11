import { describe, expect, it, vi } from 'vitest';
import { classify, evaluateCheck } from '../src/domain/checks';
import { syntheticCandidate, syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
import { normalisePkr } from '../src/domain/normalise-pkr';
import { timestamp } from '../src/domain/pricing';
import { DAY_MS } from '../src/domain/policy';
describe('safety and failure regressions', () => {
  it('evaluation and classify use no runtime network or ambient clock', () => {
    const input = syntheticInput(); // fixture generation is outside the guarded production code
    const network = vi.fn(() => { throw new Error('Network forbidden'); });
    vi.stubGlobal('fetch', network); vi.stubGlobal('XMLHttpRequest', network); vi.stubGlobal('WebSocket', network);
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Ambient clock forbidden'); });
    let ok = false;
    try {
      const e = evaluateCheck(input);
      ok = classify(e.snapshot, { asking_price: { amount_minor: 10000000, currency: 'PKR' } }, {
        now: SYNTHETIC_NOW, expected_version: 1, idempotency_key: 'synthetic', resource_known: true,
        capability_valid: true, evidence_valid: true }).ok;
    } finally { clock.mockRestore(); vi.unstubAllGlobals(); }
    expect(ok).toBe(true); expect(network).not.toHaveBeenCalled();
  });
  it.each([[1e-10, 'ZERO'], [-1e-10, 'NEGATIVE'], [1e30, 'TOO_LARGE']])('finite numeric exponent %s rejection reason', (value, reason) => {
    expect(normalisePkr(value)).toEqual({ ok: false, reason });
  });
  it('required output overflow is500 PRICE_OUTPUT_OVERFLOW, not invalid input', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.observation.price.amount_minor = Number.MAX_SAFE_INTEGER; });
    expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', error: { code: 'PRICE_OUTPUT_OVERFLOW', http_status: 500, retryable: false } });
  });
  it('rejects non-RFC3339 rollover times', () => {
    expect(timestamp('2026-11-09T24:00:00Z')).toBeNull();
    expect(timestamp('2026-11-09T00:60:00Z')).toBeNull();
  });
  it('no valid rights and no fresh evidence emit structured insufficiency reasons', () => {
    const rights = syntheticInput(); rights.candidates.forEach(c => { c.rightsVerified = false; });
    const result = evaluateCheck(rights).result;
    expect(result.result_state).toBe('INSUFFICIENT_DATA');
    if (result.result_state === 'INSUFFICIENT_DATA') expect(result.insufficient_reasons).toContain('NO_PERMITTED_SOURCE');
    const stale = syntheticInput(); stale.candidates.forEach(c => { c.observation.observed_at = new Date(Date.parse(SYNTHETIC_NOW) - 15 * DAY_MS).toISOString(); });
    const s = evaluateCheck(stale).result;
    if (s.result_state !== 'INSUFFICIENT_DATA') throw new Error('expected insufficient');
    expect(s.insufficient_reasons).toContain('NO_FRESH_EVIDENCE');
  });
  it('no price numbers escape insufficient unknown-PTA result; counts reconcile', () => {
    const input = syntheticInput(4); delete input.variant.attributes.pta_status;
    input.candidates.forEach((c, i) => { c.variant.attributes.pta_status = i < 2 ? 'APPROVED' : 'NON_PTA'; });
    const e = evaluateCheck(input).result;
    expect(e.result_state).toBe('INSUFFICIENT_DATA');
    if (e.result_state !== 'INSUFFICIENT_DATA') return;
    expect(e.data).toBeNull();
    expect(e.evidence.included_count + e.evidence.excluded_count).toBe(e.evidence.retrieved_count);
    expect(e.evidence.excluded_by_reason.reduce((a, b) => a + b.count, 0)).toBe(e.evidence.excluded_count);
  });
  it('unknown PTA diagnostic union preserves primary rights exclusions', () => {
    const input = syntheticInput(3); input.variant.attributes.pta_status = 'NOT_SURE';
    input.candidates[0]!.rightsVerified = false;
    input.candidates[1]!.variant.attributes.pta_status = 'NON_PTA';
    const e = evaluateCheck(input).result;
    if (e.result_state !== 'INSUFFICIENT_DATA') throw new Error('expected insufficient');
    expect(e.evidence.excluded_by_reason).toContainEqual({ code: 'UNVERIFIED_RIGHTS', count: 1 });
  });
  it('candidate admission cannot override an actual critical mismatch', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.variantMatch = { matched: true, exclusion_reason: null, quality: 1 }; c.variant.attributes.region_model = 'wrong'; });
    expect(evaluateCheck(input).result.result_state).toBe('INSUFFICIENT_DATA');
  });
  it('0.9 reviewed identity quality limits score to79; mismatched quality is excluded', () => {
    const input = syntheticInput(10); input.candidates[0]!.variantMatch.quality = .9;
    const e = evaluateCheck(input).result;
    if (e.result_state !== 'RANGE_AVAILABLE') throw new Error('expected range');
    expect(e.confidence.score).toBe(79); expect(e.confidence.reasons.map(x => x.code)).toContain('ATTRIBUTE_MATCH_NOT_SKU');
  });
  it('expired alternative-condition pool is hidden at classify; selected snapshot stays intact', () => {
    const input = syntheticInput(5); input.variant.used_grade = 'GOOD';
    input.candidates.push(...Array.from({ length: 3 }, (_, i) => { const c = syntheticCandidate(i + 5); c.variant.condition = 'USED'; c.variant.used_grade = 'GOOD'; c.source.expires_at = SYNTHETIC_NOW; return c; }));
    const original = evaluateCheck(input);
    const result = classify(original.snapshot, { asking_price: { amount_minor: 10000000, currency: 'PKR' } }, {
      now: new Date(Date.parse(SYNTHETIC_NOW) + 1).toISOString(), expected_version: 1, idempotency_key: 'next',
      resource_known: true, capability_valid: true, evidence_valid: true });
    if (!result.ok || result.result.result_state !== 'RANGE_AVAILABLE') throw new Error('expected classify');
    expect(result.result.data.selected_assessment?.used_market).toBeNull();
    expect(original.snapshot.branches[0]?.used_market.pool).not.toBeNull();
  });
});
describe('QA format, tie and magnitude regressions', () => {
  it.each([['1.2L', 12000000], ['1.2l', 12000000], ['PKR 125000/-', 12500000], ['₨ 120,000', 12000000], ['1 cr', 1000000000], ['Rs. 1.2 lakh /-', 12000000]])('required format %s', (text, amount_minor) => {
    expect(normalisePkr(text)).toMatchObject({ ok: true, value: { amount_minor, currency: 'PKR' } });
  });
  it.each([['1.2', 120], ['500', 50000]])('bare %s unchanged but warns', (text, amount_minor) => {
    expect(normalisePkr(text)).toMatchObject({ ok: true, value: { amount_minor }, warnings: ['UNMARKED_NUMBER'] });
  });
  it('explicit currency or multiplier does not produce bare-magnitude warning', () => {
    for (const raw of ['Rs 500', 'PKR 1.2', '1.2L', '₨ 1.2']) {
      const r = normalisePkr(raw); if (!r.ok) throw new Error('Expected parsed price');
      expect(r.warnings ?? []).not.toContain('UNMARKED_NUMBER');
    }
  });
  it('QA NRM-25 arithmetic is recorded without changing the vector', () => {
    expect(normalisePkr('1.23456 lac')).toMatchObject({ ok: true, value: { amount_minor: 12345600 } });
    expect(normalisePkr('1.234567 lac')).toMatchObject({ ok: true, value: { amount_minor: 12345670 } });
  });
});
