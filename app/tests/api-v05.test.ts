/** The CTO published v0.5 in the same API file during implementation; these keep
 * current wire safety separate from unchanged QA v1.1 percent-point fixtures. */
import { describe, expect, it } from 'vitest';
import { classify, evaluateCheck, publicMerchantUrl, type CheckResult, type ClassifyContext, type ClassifyRequest } from '../src/index';
import { syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
const now = Date.parse(SYNTHETIC_NOW);
const context = (patch: Partial<ClassifyContext> = {}): ClassifyContext => ({ now: SYNTHETIC_NOW, expected_version: 1,
  idempotency_key: 'SYNTHETIC-v05', evidence_valid: true, resource_known: true, capability_valid: true, ...patch });
function assessment(result: CheckResult) {
  if (result.result_state !== 'RANGE_AVAILABLE' || !result.data.selected_assessment) throw new Error('Expected selected range');
  return result.data.selected_assessment;
}
function split() {
  const i = syntheticInput(7); i.variant.attributes.pta_status = 'NOT_SURE';
  i.candidates.forEach((c, index) => { c.variant.attributes.pta_status = index < 5 ? 'APPROVED' : 'NON_PTA'; });
  return i;
}
describe('API v0.5 pure selected context and classify', () => {
  it('no-price PTA selection returns only selected range with safe confirmed header', () => {
    const input = split(); input.asking_price = null; const e = evaluateCheck(input);
    const result = classify(e.snapshot, { pta_status: 'APPROVED' }, context());
    if (!result.ok) throw new Error('Expected success');
    const a = assessment(result.result);
    expect(a).toMatchObject({ verdict: 'NO_ASKING_PRICE', indicative: false, diff_absolute_minor: null, diff_percent: null });
    expect(a.fair_band_low).not.toBeNull(); expect(result.result.confirmed_context?.variant.pta_status).toBe('APPROVED');
    expect(result.result.confirmed_context?.variant.attributes).not.toHaveProperty('pta_status');
    expect(result.result.confirmed_context?.product.display_name).toBe('SYNTHETIC SYNTHETIC Model A');
  });
  it('explicit null clears price; omission preserves most recently classified price', () => {
    const e = evaluateCheck(split());
    const selected = classify(e.snapshot, { pta_status: 'APPROVED', asking_price: { amount_minor: 11500000, currency: 'PKR' } }, context());
    if (!selected.ok) throw new Error('Expected select');
    const preserve = classify(selected.snapshot, { pta_status: 'APPROVED' }, context({ expected_version: 2, idempotency_key: 'preserve' }));
    if (!preserve.ok) throw new Error('Expected preserve');
    expect(assessment(preserve.result).asking_price?.amount_minor).toBe(11500000);
    const clear = classify(preserve.snapshot, { asking_price: null }, context({ expected_version: 3, idempotency_key: 'clear' }));
    if (!clear.ok) throw new Error('Expected clear');
    expect(assessment(clear.result).asking_price).toBeNull(); expect(assessment(clear.result).verdict).toBe('NO_ASKING_PRICE');
  });
  it('stored insufficient branch is a new insufficient version, not other PTA substitution', () => {
    const e = evaluateCheck(split());
    const next = classify(e.snapshot, { pta_status: 'NON_PTA', asking_price: null }, context());
    if (!next.ok) throw new Error('Expected stored branch result');
    expect(next.result).toMatchObject({ result_state: 'INSUFFICIENT_DATA', classification_version: 2, data: null,
      confidence: { score: null, level: 'NONE' }, insufficient_reasons: ['NO_STORED_RANGE', 'TOO_FEW_COMPARABLES'], evidence: { observations: [] } });
    expect(next.result.confirmed_context?.variant.pta_status).toBe('NON_PTA');
    expect(next.snapshot.selected_pta).toBe('NON_PTA'); expect(next.snapshot.asking_price).toBeNull();
  });
  it.each([[{}, 'CLASSIFICATION_INPUT_REQUIRED'], [{ pta_status: null }, 'INVALID_PTA_STATUS'], [{ pta_status: 'NOT_SURE' }, 'INVALID_PTA_STATUS']])('rejects invalid transition %j', (request, code) => {
    expect(classify(evaluateCheck(split()).snapshot, request as ClassifyRequest, context())).toMatchObject({ ok: false, error: { code, http_status: 422 } });
  });
  it('null-only request on unselected PTA remains selection-required', () => {
    expect(classify(evaluateCheck(split()).snapshot, { asking_price: null }, context())).toMatchObject({ ok: false, error: { code: 'PTA_SELECTION_REQUIRED' } });
  });
  it('null asking never waives stale selected-branch validity', () => {
    const input = split(); input.candidates.forEach(c => { c.source.expires_at = SYNTHETIC_NOW; });
    expect(classify(evaluateCheck(input).snapshot, { asking_price: null, pta_status: 'APPROVED' }, context({ now: new Date(now + 1).toISOString() }))).toMatchObject({ ok: false, error: { code: 'RANGE_STALE' } });
  });
  it('wire diff_percent is a fraction; internal QA percent points do not leak to DTO', () => {
    const input = syntheticInput(); input.asking_price!.amount_minor = 11000000;
    expect(assessment(evaluateCheck(input).result).diff_percent).toBeCloseTo(.10, 12);
  });
});
describe('API v0.5 inline safe evidence boundary', () => {
  it.each([0, 2, 50, 51])('evidence n%s counts and cap, no pre-pricing truncation', n => {
    const result = evaluateCheck(syntheticInput(n)).result;
    if (result.result_state === 'INSUFFICIENT_DATA') {
      expect(result.evidence.observations).toEqual([]); expect(result.evidence.evidence_truncated).toBe(false);
      expect(result.evidence.evidence_total_included).toBe(n); return;
    }
    const a = assessment(result);
    expect(a.evidence.included_count).toBe(n); expect(a.new_market?.n_effective).toBe(n);
    expect(a.evidence.observations).toHaveLength(Math.min(n, 50));
    expect(a.evidence.evidence_total_included).toBe(n); expect(a.evidence.evidence_truncated).toBe(n > 50);
  });
  it('newest effective date comes from full set, even when newest is outside match-sorted50', () => {
    const input = syntheticInput(51), last = input.candidates[50]!;
    last.variantMatch.quality = .9; last.observation.observed_at = SYNTHETIC_NOW;
    const a = assessment(evaluateCheck(input).result);
    expect(a.evidence.observations.map(o => o.observation_id)).not.toContain(last.observation.id);
    expect(a.evidence.evidence_newest_effective_at).toBe(new Date(now).toISOString());
    expect(a.confidence.score).toBeLessThanOrEqual(79); // all51 still influence confidence
  });
  it('safe projection removes owner/policy/hash/extra attrs and private URL queries', () => {
    const input = syntheticInput(), c = input.candidates[0]!;
    c.variant.attributes.seller_phone = 'SYNTHETIC-SECRET-CANARY'; c.source.permission_record_id = 'SYNTHETIC-PRIVATE-POLICY-CANARY';
    c.source.url = 'https://merchant.invalid/item?token=SYNTHETIC-SECRET-CANARY';
    const result = evaluateCheck(input).result, a = assessment(result), encoded = JSON.stringify(result);
    expect(encoded).not.toContain('SYNTHETIC-SECRET-CANARY'); expect(encoded).not.toContain('SYNTHETIC-PRIVATE-POLICY-CANARY');
    expect(a.evidence.observations.find(o => o.observation_id === c.observation.id)?.source.url).toBeNull();
    expect(encoded).not.toContain('sellerOwnerId'); expect(encoded).not.toContain('evidence_hash');
    expect(encoded).not.toContain('source_owner_group');
  });
  it('excluded prices and publisher URLs never appear as returned evidence rows', () => {
    const input = syntheticInput(); input.candidates[0]!.rightsVerified = false;
    input.candidates[0]!.source.source_name = 'SYNTHETIC-EXCLUDED-CANARY';
    expect(JSON.stringify(evaluateCheck(input).result)).not.toContain('SYNTHETIC-EXCLUDED-CANARY');
  });
  it.each(['http://merchant.invalid', 'https://user:password@merchant.invalid', 'https://merchant.invalid/?token=secret', 'https://merchant.invalid/#fragment', 'javascript:alert(1)'])('withholds unsafe/unknown public URL %s', url => {
    expect(publicMerchantUrl(url)).toBeNull();
  });
  it('source rows order is quality DESC, retrieval DESC, source id ASC, observation id ASC', () => {
    const input = syntheticInput(4), [a, b, c, d] = input.candidates;
    a!.variantMatch.quality = .9; b!.source.source_id = 'Z'; c!.source.source_id = 'A'; d!.source.source_id = 'A';
    b!.observation.retrieved_at = c!.observation.retrieved_at = d!.observation.retrieved_at = new Date(now - 1).toISOString();
    c!.observation.id = 'SYNTHETIC-Z'; d!.observation.id = 'SYNTHETIC-A';
    const ids = assessment(evaluateCheck(input).result).evidence.observations.map(o => o.observation_id);
    expect(ids).toEqual(['SYNTHETIC-A', 'SYNTHETIC-Z', b!.observation.id, a!.observation.id]);
  });
});

describe('spec verification of QA 01:01 PKT legacy-contract failures', () => {
  it('0.10 wire fraction means10%; independent utility exposes explicitly named points', async () => {
    const { verdictFor, rat, asNumber } = await import('../src/index');
    const v = verdictFor(11000000, rat(10000000n));
    expect(v.verdict).toBe('FAIR'); expect(asNumber(v.diff_ratio)).toBe(.10);
    expect(v.diff_percentage_points).toBe(10); expect(v.diff_percent).toBe(10); // legacy primitive alias only
    const input = syntheticInput(); input.asking_price!.amount_minor = 11000000;
    expect(assessment(evaluateCheck(input).result).diff_percent).toBe(.10);
  });
  it('v0.7 valid absent/unevaluated and retained insufficient PTA branches are successful versions', () => {
    const known = evaluateCheck(syntheticInput()).snapshot;
    expect(classify(known, { pta_status: 'NON_PTA' }, context())).toMatchObject({ ok: true, result: { result_state: 'INSUFFICIENT_DATA', insufficient_reasons: ['NO_STORED_RANGE'], evidence: { included_count: 0, observations: [] } } });
    const retained = classify(evaluateCheck(split()).snapshot, { pta_status: 'NON_PTA' }, context());
    expect(retained).toMatchObject({ ok: true, result: { result_state: 'INSUFFICIENT_DATA', classification_version: 2,
      insufficient_reasons: ['NO_STORED_RANGE', 'TOO_FEW_COMPARABLES'], evidence: { observations: [] } } });
  });
});
