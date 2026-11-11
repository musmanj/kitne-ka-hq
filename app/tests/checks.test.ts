import { describe, expect, it } from 'vitest';
import { apiError, classify, evaluateCheck, type CheckInput, type ClassifyContext, type ClassifyRequest } from '../src/domain/checks';
import { syntheticCandidate, syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
import { DAY_MS } from '../src/domain/policy';
import type { CheckResult } from '../src/domain/types';
function range(r: CheckResult) { expect(r.result_state).toBe('RANGE_AVAILABLE'); if (r.result_state !== 'RANGE_AVAILABLE') throw new Error('Expected range'); return r.data; }
const ctx = (patch: Partial<ClassifyContext> = {}): ClassifyContext => ({ now: SYNTHETIC_NOW, expected_version: 1,
  idempotency_key: 'SYNTHETIC-key', evidence_valid: true, capability_valid: true, resource_known: true, ...patch });
const ask: ClassifyRequest = { asking_price: { amount_minor: 11_000_000, currency: 'PKR' } };
function split(a: number, b: number): CheckInput {
  const input = syntheticInput(0); input.variant.attributes.pta_status = 'NOT_SURE';
  input.candidates = Array.from({ length: a + b }, (_, i) => {
    const c = syntheticCandidate(i, i < a ? 100000 : 80000);
    c.variant.attributes.pta_status = i < a ? 'APPROVED' : 'NON_PTA'; return c;
  }); return input;
}
describe('contract envelope and state precedence', () => {
  it('insufficient hides all market numbers even with valid opposite pool', () => {
    const input = syntheticInput(2); input.variant.used_grade = 'GOOD';
    const used = Array.from({ length: 5 }, (_, i) => { const c = syntheticCandidate(i + 2); c.variant.condition = 'USED'; c.variant.used_grade = 'GOOD'; return c; });
    input.candidates.push(...used); input.asking_price = null;
    const { result, snapshot } = evaluateCheck(input);
    expect(snapshot.branches[0]?.used_market.pool).not.toBeNull();
    expect(result).toMatchObject({ result_state: 'INSUFFICIENT_DATA', data: null, confidence: { score: null, level: 'NONE', reasons: [] }, low_confidence_modifier: false });
    expect(JSON.stringify(result)).not.toContain('range_low');
  });
  it('operational Error overrides no evidence, is never market verdict', () => {
    const input = syntheticInput(0); input.operational_error = apiError('SERVICE_UNAVAILABLE', 503);
    expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', error: { http_status: 503 }, confidence: null, data: null });
  });
  it.each([0, -1, 1.1, NaN, Infinity])('invalid asking %s is Error not insufficient', amount => {
    const input = syntheticInput(0); input.asking_price!.amount_minor = amount;
    expect(evaluateCheck(input).result.result_state).toBe('ERROR');
  });
  it('new and used evaluated independently with counts and no cross-pool filling', () => {
    const input = syntheticInput(5); input.variant.used_grade = 'GOOD';
    input.candidates.push(...Array.from({ length: 3 }, (_, i) => { const c = syntheticCandidate(i + 5, 75000); c.variant.condition = 'USED'; c.variant.used_grade = 'GOOD'; return c; }));
    const a = range(evaluateCheck(input).result).selected_assessment!;
    expect(a.new_market?.median.amount_minor).toBe(10000000); expect(a.used_market?.median.amount_minor).toBe(7500000);
    expect(a.evidence).toMatchObject({ included_count: 5, excluded_count: 3, retrieved_count: 8, new_pool_count: 5, used_pool_count: 3, used_condition_included_count: 0 });
    const usedInput = syntheticInput(0); usedInput.variant.condition = 'USED'; usedInput.variant.used_grade = 'GOOD'; usedInput.candidates = input.candidates;
    expect(range(evaluateCheck(usedInput).result).selected_assessment?.evidence.used_condition_included_count).toBe(3);
  });
  it('valid evidence absent ask keeps low modifier, but not indicative verdict', () => {
    const input = syntheticInput(3); input.asking_price = null;
    const data = range(evaluateCheck(input).result);
    expect(data.verdict_slot).toMatchObject({ state: 'NO_ASKING_PRICE', verdict: null });
    expect(data.low_confidence_modifier).toBe(true);
    expect(data.selected_assessment).toMatchObject({ verdict: 'NO_ASKING_PRICE', indicative: false, diff_absolute_minor: null, diff_percent: null });
  });
  it('low priced verdict is indicative, unusual low always carries caution', () => {
    const input = syntheticInput(3); input.asking_price!.amount_minor = 8_000_000;
    const a = range(evaluateCheck(input).result).selected_assessment!;
    expect(a).toMatchObject({ verdict: 'UNUSUALLY_LOW', indicative: true });
    expect(a.warnings).toContain('VERIFY_CONDITION_PTA_LOCK_SELLER_BEFORE_PAYING');
  });
  it('missing required non-PTA field suppresses range', () => {
    const input = syntheticInput(); delete input.variant.attributes.storage_gb;
    const result = evaluateCheck(input).result;
    expect(result.result_state).toBe('INSUFFICIENT_DATA');
    if (result.result_state === 'INSUFFICIENT_DATA') expect(result.insufficient_reasons).toContain('IDENTITY_UNCONFIRMED');
  });
  it('snapshot protects against both caller and result mutation', () => {
    const input = syntheticInput(); const e = evaluateCheck(input);
    input.candidates[0]!.observation.price.amount_minor = 1;
    expect(e.snapshot.input.candidates[0]!.observation.price.amount_minor).toBe(10000000);
    expect(Object.isFrozen(e.snapshot.branches[0]?.selected.included)).toBe(true);
    expect(() => { range(e.result).selected_assessment!.median!.amount_minor = 1; }).toThrow();
  });
  it('output fair bands are Money, half-even only after exact median', () => {
    const input = syntheticInput(4);
    [100, 100, 101, 101].forEach((v, i) => { input.candidates[i]!.observation.price.amount_minor = v; });
    const a = range(evaluateCheck(input).result).selected_assessment!;
    expect(a.median?.amount_minor).toBe(100); expect(a.fair_band_low?.amount_minor).toBe(85);
    expect(a.fair_band_high?.amount_minor).toBe(111);
  });
});
describe('PTA routing, never combined counts or global verdict', () => {
  it('n2+n2 insufficient', () => expect(evaluateCheck(split(2, 2)).result.result_state).toBe('INSUFFICIENT_DATA'));
  it.each([[3, 2], [2, 3], [5, 5]])('n%s+n%s exploratory split', (a, b) => {
    const e = evaluateCheck(split(a, b)), data = range(e.result);
    expect(data).toMatchObject({ mode: 'PTA_SPLIT', selected_assessment: null, verdict_slot: { state: 'PTA_SELECTION_REQUIRED', verdict: null }, low_confidence_modifier: true });
    expect(data.pta_branches).toHaveLength(2);
    for (const branch of data.pta_branches) {
      expect(branch.evidence.included_count + branch.evidence.excluded_count).toBe(a + b);
      expect(branch.evidence.excluded_by_reason.reduce((n, r) => n + r.count, 0)).toBe(branch.evidence.excluded_count);
      if (branch.pool) {
        expect(branch.pool.confidence.level).toBe('LOW'); expect(branch.pool.confidence.score).toBeLessThanOrEqual(49);
        expect(branch.pool.confidence.reasons.map(x => x.code)).toContain('PTA_UNCONFIRMED');
      }
    }
    expect(data.confidence.score).toBe(Math.min(...data.pta_branches.flatMap(x => x.pool ? [x.pool.confidence.score!] : [])));
  });
  it('skipped PTA normalises routing, no-price still selection required', () => {
    const input = split(3, 3); delete input.variant.attributes.pta_status; input.asking_price = null;
    expect(range(evaluateCheck(input).result).verdict_slot.state).toBe('PTA_SELECTION_REQUIRED');
  });
  it('unknown candidate PTA never enters either branch', () => {
    const input = split(3, 3); input.candidates[0]!.variant.attributes.pta_status = 'NOT_SURE';
    const branches = range(evaluateCheck(input).result).pta_branches;
    expect(branches[0]?.state).toBe('INSUFFICIENT_DATA');
    expect(branches[1]?.pool?.n_effective).toBe(3);
  });
  it('known PTA never shows other branch as selected value', () => {
    const input = split(2, 5); input.variant.attributes.pta_status = 'APPROVED';
    expect(evaluateCheck(input).result.result_state).toBe('INSUFFICIENT_DATA');
  });
});
describe('classify-only immutable, versioned state transitions', () => {
  it('new price uses original median/evidence time, not rounded range midpoint', () => {
    const input = syntheticInput(5); input.asking_price = null;
    [98000, 100000, 102000, 104000, 106000].forEach((v, i) => { input.candidates[i]!.observation.price.amount_minor = v * 100; });
    const e = evaluateCheck(input), before = JSON.stringify(e.result);
    const outcome = classify(e.snapshot, { asking_price: { amount_minor: 11500000, currency: 'PKR' } }, ctx({ now: new Date(Date.parse(SYNTHETIC_NOW) + DAY_MS / 24).toISOString() }));
    expect(outcome.ok).toBe(true); if (!outcome.ok) return;
    expect(outcome.result).toMatchObject({ checked_at: SYNTHETIC_NOW, classification_version: 2, valid_until: e.result.valid_until });
    const a = range(outcome.result).selected_assessment!;
    expect(a.verdict).toBe('HIGH'); expect(a.median?.amount_minor).toBe(10200000); expect(a.evidence).toEqual(range(e.result).selected_assessment?.evidence);
    expect(JSON.stringify(e.result)).toBe(before); expect(e.snapshot.classification_version).toBe(1);
    expect(outcome.result.classified_at).not.toBe(outcome.result.checked_at);
  });
  it('exact expiry passes, +1ms returns RANGE_STALE, no filtering to refresh', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.observation.observed_at = new Date(Date.parse(SYNTHETIC_NOW) - 13.5 * DAY_MS).toISOString(); });
    const e = evaluateCheck(input); const expiry = Date.parse(e.result.valid_until!);
    expect(classify(e.snapshot, ask, ctx({ now: new Date(expiry).toISOString() })).ok).toBe(true);
    expect(classify(e.snapshot, ask, ctx({ now: new Date(expiry + 1).toISOString() }))).toMatchObject({ ok: false, error: { code: 'RANGE_STALE', http_status: 409 } });
  });
  it('contractual earlier expiry respected', () => {
    const input = syntheticInput(); input.candidates[0]!.source.expires_at = new Date(Date.parse(SYNTHETIC_NOW) + 1000).toISOString();
    const e = evaluateCheck(input);
    expect(classify(e.snapshot, ask, ctx({ now: new Date(Date.parse(SYNTHETIC_NOW) + 1001).toISOString() }))).toMatchObject({ ok: false, error: { code: 'RANGE_STALE' } });
  });
  it.each([
    [{ evidence_valid: false }, 'RANGE_STALE', 409], [{ expected_version: 0 }, 'VERSION_CONFLICT', 409],
    [{ capability_valid: false }, 'CHECK_NOT_FOUND', 404], [{ resource_known: false }, 'CHECK_NOT_FOUND', 404],
    [{ now: '2026-12-16T00:00:00+05:00' }, 'CHECK_EXPIRED', 410], [{ now: 'bad' }, 'INVALID_REQUEST', 400],
    [{ idempotency_key: '' }, 'INVALID_REQUEST', 400], [{ now: '2026-11-08T00:00:00+05:00' }, 'INVALID_REQUEST', 400]
  ])('failure %j => %s', (patch, code, status) => expect(classify(evaluateCheck(syntheticInput()).snapshot, ask, ctx(patch))).toMatchObject({ ok: false, error: { code, http_status: status } }));
  it('no stored qualifying range and unknown PTA fail correctly', () => {
    expect(classify(evaluateCheck(syntheticInput(2)).snapshot, ask, ctx())).toMatchObject({ ok: true, result: { result_state: 'INSUFFICIENT_DATA', insufficient_reasons: ['NO_STORED_RANGE', 'TOO_FEW_COMPARABLES'] } });
    expect(classify(evaluateCheck(split(3, 3)).snapshot, ask, ctx())).toMatchObject({ ok: false, error: { code: 'PTA_SELECTION_REQUIRED' } });
    expect(classify(evaluateCheck(split(3, 2)).snapshot, { ...ask, pta_status: 'NON_PTA' }, ctx())).toMatchObject({ ok: true, result: { result_state: 'INSUFFICIENT_DATA', insufficient_reasons: ['NO_STORED_RANGE', 'TOO_FEW_COMPARABLES'] } });
  });
  it('PTA choice removes uncertainty cap and uses only stored selected branch expiry', () => {
    const input = split(5, 5);
    input.candidates.filter(c => c.variant.attributes.pta_status === 'NON_PTA').forEach(c => { c.source.expires_at = SYNTHETIC_NOW; });
    const e = evaluateCheck(input);
    const chosen = classify(e.snapshot, { ...ask, pta_status: 'APPROVED' }, ctx({ now: new Date(Date.parse(SYNTHETIC_NOW) + 1).toISOString() }));
    expect(chosen.ok).toBe(true); if (!chosen.ok) return;
    const data = range(chosen.result);
    expect(data.mode).toBe('SINGLE_POOL'); expect(data.confidence.score).toBeGreaterThan(49);
    expect(data.confidence.reasons.map(r => r.code)).not.toContain('PTA_UNCONFIRMED');
    expect(data.selected_assessment?.median?.amount_minor).toBe(10000000);
  });
  it('idempotent replay returns same version/result; key reuse body mismatch fails', () => {
    const first = classify(evaluateCheck(syntheticInput()).snapshot, ask, ctx());
    expect(first.ok).toBe(true); if (!first.ok) return;
    const replay = classify(first.snapshot, ask, ctx({ now: new Date(Date.parse(SYNTHETIC_NOW) + 1000).toISOString() }));
    expect(replay).toMatchObject({ ok: true, replayed: true, result: first.result });
    expect(classify(first.snapshot, { asking_price: { amount_minor: 1, currency: 'PKR' } }, ctx())).toMatchObject({ ok: false, error: { code: 'IDEMPOTENCY_CONFLICT' } });
    expect(classify(first.snapshot, ask, ctx({ idempotency_key: 'other' }))).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
  });
  it('rejects changed variant, invalid price and known PTA switching', () => {
    const e = evaluateCheck(syntheticInput());
    expect(classify(e.snapshot, { ...ask, model: 'other' } as ClassifyRequest, ctx())).toMatchObject({ ok: false, error: { code: 'VARIANT_CHANGE_REQUIRES_CHECK' } });
    expect(classify(e.snapshot, { asking_price: { amount_minor: 0, currency: 'PKR' } }, ctx())).toMatchObject({ ok: false, error: { code: 'INVALID_ASKING_PRICE', http_status: 422 } });
    expect(classify(e.snapshot, { ...ask, pta_status: 'NON_PTA' }, ctx())).toMatchObject({ ok: true, result: { result_state: 'INSUFFICIENT_DATA', insufficient_reasons: ['NO_STORED_RANGE'] } });
  });
});
describe('labelled SYNTHETIC policy fixtures', () => {
  it('labels agree with actual deterministic assessment output', async () => {
    const { labelledSyntheticCases } = await import('../src/fixtures/synthetic');
    for (const fixture of labelledSyntheticCases()) {
      expect(fixture.label).toContain('SYNTHETIC'); expect(fixture.name).toContain('SYNTHETIC');
      const result = evaluateCheck(fixture.input).result;
      expect(result.result_state).toBe(fixture.expected_result_state);
      const verdict = result.result_state === 'RANGE_AVAILABLE' ? result.data.selected_assessment?.verdict ?? null : null;
      expect(verdict).toBe(fixture.expected_verdict);
    }
  });
});
describe('API v0.3 retention guards', () => {
  it('caps private check at24h and rejects exact logical expiry before replay', () => {
    const input = syntheticInput(); input.private_expires_at = '2027-01-01T00:00:00Z';
    const e = evaluateCheck(input);
    const request = { asking_price: { amount_minor: 10000000, currency: 'PKR' as const } };
    const deadline = Date.parse(SYNTHETIC_NOW) + DAY_MS;
    expect(Date.parse(e.snapshot.input.private_expires_at)).toBe(deadline);
    const first = classify(e.snapshot, request, ctx());
    if (!first.ok) throw new Error('expected success');
    expect(classify(first.snapshot, request, ctx({ now: new Date(deadline - 1).toISOString() })).ok).toBe(true);
    expect(classify(first.snapshot, request, ctx({ now: new Date(deadline).toISOString() }))).toMatchObject({ ok: false, error: { code: 'CHECK_EXPIRED', http_status: 410 } });
  });
  it('24h retention never extends on price classification', () => {
    const e = evaluateCheck(syntheticInput());
    const next = classify(e.snapshot, ask, ctx({ now: new Date(Date.parse(SYNTHETIC_NOW) + 3600000).toISOString() }));
    if (!next.ok) throw new Error('expected success');
    expect(next.snapshot.input.private_expires_at).toBe(e.snapshot.input.private_expires_at);
  });
});
