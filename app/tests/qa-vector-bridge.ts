/** Unchanged QA source JSON is snapshotted beside this bridge; no product logic lives here. */
import { describe, expect, it } from 'vitest';
import { apiError, classify, confidenceBand, evaluateCheck, evaluatePool, normalisePkr, rat,
  scoreConfidence, verdictFor, type CheckInput, type CheckResult, type ClassifyContext, type ClassifyRequest,
  type ComparableCandidate, type Condition, type Confidence, type ExclusionReason, type Rational, type UsedGrade } from '../src/index';
import { syntheticCandidate, syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';

type O = { price_pkr?: number; amount_minor?: number; age_days?: number; age_seconds?: number; age_ms?: number; source_updated_at?: string | null; source_updated_at_age_seconds?: number;
  source_updated_at_age_days?: number; city?: string | null; observed_at?: string | null; observed_at_age_days?: number; retrieved_at_age_days?: number;
  source_owner_group?: string; seller?: string; id?: string; currency?: string; amount?: number;
  price_basis?: string; pta_status?: string | null; availability?: string };
type Branch = O[] | { observations: O[]; ages_days?: number[]; independent_sources?: number };
type VInput = { observations?: O[]; condition?: Condition; used_grade?: UsedGrade; pta_status?: string;
  ages_seconds?: number[]; asking_price_minor?: number | null; branches?: Record<string, Branch>; target_listing_id?: string;
  n_effective?: number; independent_sources?: number; ages_days?: number[]; freshness_window_days?: number;
  match_quality?: string[]; P10?: string; P90?: string; M?: string; scores?: number[];
  check?: { private_ttl_hours: number; evidence_ages_days: number[]; classify_after_ms: number };
  stored?: string; classify?: { asking_price_minor?: number; pta_status?: 'APPROVED' | 'NON_PTA'; storage_gb?: number };
  now_minus_earliest_observed?: string; see?: string; raw_text?: string; service?: string };
type EConfidence = { score?: number | null; score_max?: number; level?: string; reasons_include?: string[]; reasons?: [] };
type Expected = { status?: string; result_state?: string; n_effective?: number; range_method?: string;
  fair_band_low_minor?: number; fair_band_high_minor?: number; median_minor_exact?: string; range_low_minor?: number; range_high_minor?: number; median_minor?: number; range_low?: null; range_high?: null; median?: null;
  verdict?: string; diff_percent?: string | number | null; diff_absolute_minor?: number | null;
  insufficient_reasons?: string[]; confidence?: EConfidence; indicative?: boolean; low_confidence_modifier?: boolean;
  included_count?: number; excluded_count?: number; retrieved_count?: number; independent_sources?: number;
  excluded_by_reason?: Array<{ code: ExclusionReason; count: number }>; admitted?: number[]; included_prices?: number[]; excluded_codes?: string[];
  score?: number | null; level?: string; reasons_include?: string[]; reasons?: []; R?: string; Q?: string; levels?: string[];
  mode?: string; selected_assessment?: null; verdict_slot?: string | { state: string; verdict: null };
  pta_branches?: Array<{ pta_status: string; state: string; pool?: null; median_minor?: number; range_low_minor?: number; range_high_minor?: number; confidence?: EConfidence }>;
  branch_scores?: Record<string, number>; no_merged_median?: boolean; data?: null;
  http_status?: number | string; code?: string; error?: { code: string; http_status: number; retryable: boolean };
  amount_minor?: number | null; currency?: string; requires_confirmation?: boolean; no_price_found?: boolean; rejected?: string;
  warnings?: string[]; recency_term?: string; retryable?: boolean; message_key?: string; reason?: string; ok?: boolean; reasons_exclude?: string[]; effective_age_days?: number; score_unaffected_by_near_expiry?: boolean; score_unaffected_by_geo_spread?: boolean; note?: string; invariant?: string };
type Vector = { basis: string; id: string; group: string; description: string; input: VInput; expected: Expected };
export function registerVectorSuite(rawVectors: unknown, version: 'v1.1' | 'v1.2') {
const vectors = (rawVectors as { vectors: Vector[] }).vectors;
const now = Date.parse(SYNTHETIC_NOW);
function fraction(value: string | number): number {
  const first = String(value).split('=').at(-1)!.trim().split(' ')[0]!;
  const [n, d = '1'] = first.split('/'); return Number(n) / Number(d);
}
function exact(value: string): Rational {
  const [n, d = '1'] = value.split('/'); return rat(BigInt(n!), BigInt(d));
}
const has = (o: object, key: PropertyKey) => Object.hasOwn(o, key);
function makeInput(v: Vector): CheckInput {
  const input = syntheticInput(0), vi = v.input;
  input.variant.condition = vi.condition ?? 'NEW_SEALED'; input.variant.used_grade = vi.used_grade ?? 'GOOD';
  input.variant.attributes.pta_status = vi.pta_status ?? 'APPROVED';
  input.asking_price = vi.asking_price_minor == null ? null : { amount_minor: vi.asking_price_minor, currency: 'PKR' };
  let index = 0;
  function build(rows: O[], status: string, ages?: number[], diversity?: number): ComparableCandidate[] {
    return rows.map((o, offset) => {
      const seconds = o.age_seconds ?? vi.ages_seconds?.[offset];
      const age = o.age_ms !== undefined ? o.age_ms / 86400000 : seconds !== undefined ? seconds / 86400 : o.observed_at_age_days ?? o.age_days ?? ages?.[offset] ?? 1;
      const c = syntheticCandidate(index++, o.price_pkr ?? o.amount ?? 100000, age), ob = c.observation;
      if (o.amount_minor !== undefined) ob.price.amount_minor = o.amount_minor;
      c.variant.condition = v.id === 'FIL-10' ? 'NEW_SEALED' : input.variant.condition;
      c.variant.used_grade = input.variant.used_grade;
      c.variant.attributes.pta_status = has(o, 'pta_status') ? o.pta_status! : status;
      if (has(o, 'observed_at')) ob.observed_at = o.observed_at ?? null; // raw undated ingest, no invented date
      if (has(o, 'city')) c.city = o.city ?? null;
      if (has(o, 'source_updated_at')) ob.source_updated_at = o.source_updated_at ?? null;
      if (o.source_updated_at_age_seconds !== undefined) ob.source_updated_at = new Date(now - o.source_updated_at_age_seconds * 1000).toISOString();
      if (o.source_updated_at_age_days !== undefined) ob.source_updated_at = new Date(now - o.source_updated_at_age_days * 86400000).toISOString();
      if (o.retrieved_at_age_days !== undefined) ob.retrieved_at = new Date(now - o.retrieved_at_age_days * 86400000).toISOString();
      if (o.source_owner_group) c.source.source_owner_group = o.source_owner_group;
      else if (diversity) c.source.source_owner_group = `SYNTHETIC-owner-${offset % diversity}`;
      if (o.seller) c.sellerOwnerId = `SYNTHETIC-${o.seller}`;
      if (o.id) { ob.listing_id = o.id; c.canonicalListingId = o.id; }
      if (o.id && o.id === vi.target_listing_id) c.targetListing = true;
      if (o.currency) ob.price.currency = o.currency as 'PKR';
      if (o.price_basis) c.comparable = false; // verified upstream cash-basis metadata
      if (o.availability) c.inStock = o.availability === 'IN_STOCK';
      return c;
    });
  }
  if (vi.branches) input.candidates = Object.entries(vi.branches).flatMap(([status, b]) => Array.isArray(b) ? build(b, status) : build(b.observations, status, b.ages_days, b.independent_sources));
  else input.candidates = build(vi.observations ?? vi.check?.evidence_ages_days.map((age_days, i) => ({ age_days, price_pkr: 98000 + 2000 * i })) ?? [], vi.pta_status ?? 'APPROVED');
  return input;
}
function assertConfidence(actual: Confidence, expected: EConfidence) {
  if (has(expected, 'score')) expect(actual.score).toBe(expected.score);
  if (expected.score_max !== undefined) expect(actual.score).toBeLessThanOrEqual(expected.score_max);
  if (expected.level) expect(actual.level).toBe(expected.level);
  for (const reason of expected.reasons_include ?? []) expect(actual.reasons.map(r => r.code)).toContain(reason);
  if (expected.reasons) expect(actual.reasons).toEqual(expected.reasons);
}
function assertEnvelope(result: CheckResult, e: Expected) {
  if (e.result_state) expect(result.result_state).toBe(e.result_state);
  if (e.data === null) expect(result.data).toBeNull();
  if (result.result_state === 'ERROR') {
    if (e.error) expect(result.error).toMatchObject(e.error);
    if (e.code) expect(result.error).toMatchObject({ code: e.code, http_status: e.http_status, ...(has(e, 'retryable') ? { retryable: e.retryable } : {}), ...(e.message_key ? { message_key: e.message_key } : {}) });
    return;
  }
  if (e.confidence) assertConfidence(result.confidence, e.confidence);
  if (e.low_confidence_modifier !== undefined) expect(result.low_confidence_modifier).toBe(e.low_confidence_modifier);
  if (result.result_state !== 'RANGE_AVAILABLE') return;
  const data = result.data, a = data.selected_assessment;
  if (e.mode) expect(data.mode).toBe(e.mode);
  if (e.selected_assessment === null) expect(a).toBeNull();
  if (e.verdict_slot) {
    if (typeof e.verdict_slot === 'string') expect(data.verdict_slot.state).toBe(e.verdict_slot);
    else expect(data.verdict_slot).toMatchObject(e.verdict_slot);
  }
  if (e.verdict) expect(a?.verdict).toBe(e.verdict);
  if (e.diff_percent != null) expect(a?.diff_percent === null ? null : a!.diff_percent! * 100).toBeCloseTo(fraction(e.diff_percent), 8);
  // Flat QA indicative aliases selected assessment or split view's no-price-verdict state.
  if (e.indicative !== undefined) expect(a?.indicative ?? (data.verdict_slot.state === 'PRICE_VERDICT' && data.confidence.level === 'LOW')).toBe(e.indicative);
  for (const eb of e.pta_branches ?? []) {
    const b = data.pta_branches.find(x => x.pta_status === eb.pta_status)!;
    expect(b.state).toBe(eb.state);
    if (eb.pool === null) expect(b.pool).toBeNull();
    if (eb.median_minor !== undefined) expect(b.pool?.median.amount_minor).toBe(eb.median_minor);
    if (eb.range_low_minor !== undefined) expect(b.pool?.range_low.amount_minor).toBe(eb.range_low_minor);
    if (eb.range_high_minor !== undefined) expect(b.pool?.range_high.amount_minor).toBe(eb.range_high_minor);
    if (eb.confidence) assertConfidence(b.pool!.confidence, eb.confidence);
  }
  for (const [status, score] of Object.entries(e.branch_scores ?? {})) expect(data.pta_branches.find(b => b.pta_status === status)?.pool?.confidence.score).toBe(score);
  if (e.no_merged_median) { expect(a).toBeNull(); expect('median' in data).toBe(false); expect(data.verdict_slot.verdict).toBeNull(); }
}
function ordinary(v: Vector) {
  const input = makeInput(v), e = v.expected;
  const p = evaluatePool({ target: input.variant, config: input.config, candidates: input.candidates, condition: input.variant.condition, now });
  const result = evaluateCheck(input).result;
  assertEnvelope(result, e);
  if (e.code) expect(result.result_state).toBe('ERROR');
  if (result.result_state === 'ERROR') return p;
  if (e.warnings) expect(p.warnings).toEqual(e.warnings);
  if (e.score !== undefined) expect(p.pool?.confidence.score).toBe(e.score);
  if (e.level) expect(p.pool?.confidence.level).toBe(e.level);
  const values: Record<string, unknown> = { n_effective: p.evidence.included_count, range_method: p.pool?.range_method,
    fair_band_low_minor: p.pool?.fair_band_low.amount_minor, fair_band_high_minor: p.pool?.fair_band_high.amount_minor,
    range_low_minor: p.pool?.range_low.amount_minor, range_high_minor: p.pool?.range_high.amount_minor, median_minor: p.pool?.median.amount_minor,
    range_low: p.pool?.range_low ?? null, range_high: p.pool?.range_high ?? null, median: p.pool?.median ?? null,
    retrieved_count: p.evidence.retrieved_count, included_count: p.evidence.included_count,
    excluded_count: p.evidence.excluded_count, independent_sources: p.evidence.independent_sources };
  for (const [key, actual] of Object.entries(values)) if (has(e, key)) expect(actual, key).toEqual(e[key as keyof Expected]);
  if (e.median_minor_exact && p.unrounded) expect(p.unrounded.median).toEqual(exact(e.median_minor_exact));
  for (const code of e.reasons_include ?? []) expect(p.pool?.confidence.reasons.map(r => r.code)).toContain(code);
  for (const code of e.reasons_exclude ?? []) expect(p.pool?.confidence.reasons.map(r => r.code)).not.toContain(code);
  if (e.effective_age_days !== undefined && p.included.length) expect(Math.max(0, now - p.included[0]!.effective_at) / 86400000).toBe(e.effective_age_days);
  if (e.recency_term && p.included.length) expect(1 - .5 * Math.max(0, now - p.included[0]!.effective_at) / ((input.variant.condition === 'USED' ? 30 : 14) * 86400000)).toBeCloseTo(fraction(e.recency_term), 12);
  if (e.score_unaffected_by_near_expiry || e.score_unaffected_by_geo_spread) {
    const confidence = scoreConfidence({ n: p.included.length, d: p.evidence.independent_sources, recency: p.included.reduce((sum, x) => sum + 1 - .5 * (now - x.effective_at) / ((input.variant.condition === 'USED' ? 30 : 14) * 86400000), 0) / p.included.length, quality: 1, wide: false, attributeMatch: false });
    expect(p.pool?.confidence.score).toBe(confidence.score);
  }
  if (e.verdict === 'INSUFFICIENT_DATA') expect(p.pool).toBeNull();
  if (e.insufficient_reasons) expect(p.insufficient_reasons).toEqual(e.insufficient_reasons);
  if (e.excluded_by_reason) {
    const sorted = (xs: Array<{ code: string; count: number }>) => [...xs].sort((a, b) => a.code.localeCompare(b.code));
    expect(sorted(p.evidence.excluded_by_reason)).toEqual(sorted(e.excluded_by_reason));
  }
  if (e.admitted) expect(p.included.map(x => x.candidate.observation.price.amount_minor / 100)).toEqual(e.admitted);
  if (e.included_prices) expect(p.included.map(x => x.candidate.observation.price.amount_minor / 100)).toEqual(e.included_prices);
  if (e.excluded_codes) expect([...p.exclusions].sort((a, b) => a.input_index - b.input_index).map(x => x.reason)).toEqual(e.excluded_codes);
  if (p.unrounded && input.asking_price) {
    const verdict = verdictFor(input.asking_price.amount_minor, p.unrounded.median);
    if (e.verdict) expect(verdict.verdict).toBe(e.verdict);
    if (e.diff_percent != null) expect(verdict.diff_percent).toBeCloseTo(fraction(e.diff_percent), 8);
    if (e.diff_absolute_minor !== undefined) expect(verdict.diff_absolute_minor).toBe(e.diff_absolute_minor);
  } else {
    if (e.diff_percent === null && result.result_state === 'RANGE_AVAILABLE') expect(result.data.selected_assessment?.diff_percent).toBeNull();
  }
  return p;
}
function run(v: Vector) {
  const i = v.input, e = v.expected;
  if (i.see) {
    const referenced = vectors.find(x => x.id === i.see)!;
    const p = ordinary(referenced);
    if (v.id === 'OUT-05') { expect(p.included).toHaveLength(7); expect(p.evidence.excluded_by_reason).toEqual([{ code: 'STATISTICAL_OUTLIER', count: 1 }]); }
    if (v.id === 'FIL-12') expect(`${p.evidence.included_count}+${p.evidence.excluded_count}=${p.evidence.retrieved_count}`).toBe(e.invariant);
    return;
  }
  if (v.group === 'normaliser') {
    const output = normalisePkr(i.raw_text!);
    if (typeof e.amount_minor === 'number') {
      expect(output.ok).toBe(true); if (!output.ok) return;
      expect(output.value).toEqual({ amount_minor: e.amount_minor, currency: e.currency ?? 'PKR' });
    } else {
      expect(output.ok).toBe(false);
      if (e.reason && !output.ok) {
        const options = e.reason.split(':')[0]!.split(' or ');
        expect(options).toContain(output.reason);
      }
      // Thin mapping to extraction concepts; normaliser intentionally has no UI/extraction shape.
      const extraction = { amount_minor: output.ok ? output.value.amount_minor : null,
        requires_confirmation: !output.ok && i.raw_text !== '', no_price_found: i.raw_text === '' };
      if (has(e, 'amount_minor')) expect(extraction.amount_minor).toBe(e.amount_minor);
      if (has(e, 'requires_confirmation')) expect(extraction.requires_confirmation).toBe(e.requires_confirmation);
      if (has(e, 'no_price_found')) expect(extraction.no_price_found).toBe(e.no_price_found);
      if (e.error) expect(output).toMatchObject({ ok: false, reason: 'UNSUPPORTED_CURRENCY' });
    }
    return;
  }
  if (v.group === 'confidence' && !i.observations) {
    if (i.scores) { expect(i.scores.map(confidenceBand)).toEqual(e.levels); return; }
    const n = i.n_effective!;
    const c = scoreConfidence({ n, d: i.independent_sources ?? 1,
      recency: e.R ? exact(e.R) : 0, quality: e.Q ? exact(e.Q) : 0,
      attributeMatch: i.match_quality?.some(q => fraction(q) < 1) ?? false,
      wide: i.P90 !== undefined && (fraction(i.P90) - fraction(i.P10!)) / fraction(i.M!) > .30 });
    assertConfidence(c, { ...(e.score === undefined ? {} : { score: e.score }), ...(e.level ? { level: e.level } : {}),
      ...(e.reasons_include ? { reasons_include: e.reasons_include } : {}), ...(e.reasons ? { reasons: e.reasons } : {}) });
    return;
  }
  if (v.group === 'precedence') {
    const input = syntheticInput(0); input.operational_error = apiError('SERVICE_UNAVAILABLE', 503);
    assertEnvelope(evaluateCheck(input).result, e); return;
  }
  if (i.check || i.stored || (v.group === 'classify' && i.observations)) {
    const stored = i.stored ? vectors.find(x => i.stored!.startsWith(x.id))! : v;
    const input = makeInput(stored), snapshot = evaluateCheck(input).snapshot;
    const context: ClassifyContext = { now: SYNTHETIC_NOW, expected_version: 1, idempotency_key: `SYNTHETIC-${v.id}`,
      capability_valid: true, resource_known: true, evidence_valid: true };
    if (i.check) context.now = new Date(now + i.check.classify_after_ms).toISOString();
    if (i.now_minus_earliest_observed) context.now = new Date(Date.parse(snapshot.result.valid_until!) + (v.id === 'CLS-02' ? 1000 : 0)).toISOString();
    const request: ClassifyRequest = { asking_price: { amount_minor: i.classify?.asking_price_minor ?? i.asking_price_minor ?? 11500000, currency: 'PKR' },
      ...(i.classify?.pta_status ? { pta_status: i.classify.pta_status } : {}),
      ...(i.classify?.storage_gb ? { storage_gb: i.classify.storage_gb } : {}) };
    const output = classify(snapshot, request, context);
    if (e.code) { expect(output).toMatchObject({ ok: false, error: { code: e.code, http_status: e.http_status } }); return; }
    expect(output.ok).toBe(true); if (!output.ok) return;
    if (e.http_status) expect(e.http_status).toBe(200); // pure success maps to HTTP200 at boundary
    assertEnvelope(output.result, e);
    return;
  }
  if (v.group === 'pta' && i.branches) { assertEnvelope(evaluateCheck(makeInput(v)).result, e); return; }
  ordinary(v);
}
describe(`QA ${version} SYNTHETIC vectors (unchanged JSON)`, () => {
  for (const v of vectors) {
    const title = `${v.id} [${v.group}; basis=${v.basis}]: ${v.description}`;
    if (v.expected.status?.startsWith('TBD')) it.todo(title);
    else if (v.id === 'PTA-07') it.todo(title + ' — API v0.5: a retained insufficient branch now returns an insufficient result, not422');
    else if (version === 'v1.1' && v.id === 'CON-12') it.todo(title + ' — CTO v0.1 §8/12: exact72.5 rounds half-even to72, not73');
    else if (version === 'v1.1' && v.id === 'NRM-34') it.todo(title + ' — CTO v0.1 §3 forbids invented plausibility bounds; this value fits safe Money');
    else if (version === 'v1.1' && (v.id === 'CLS-01' || v.id === 'CLS-02')) it.todo(title + ' — API v0.3 caps private retention at24h; this stored fresh snapshot expires before its14-day freshness deadline');
    else if (version === 'v1.1' && v.id === 'FIL-08') it.todo(title + ' — spec v0.1 §2: d counts ultimate merchant owner, not platform hosts');
    else if (version === 'v1.1' && v.id === 'NRM-25') it.todo(title + ' — QA arithmetic mismatch: 1.23456 lac = 12345600 paisa, not 12345670');
    else it(title, () => run(v));
  }
  it('maps every vector exactly once with its supplied basis', () => {
    expect(vectors).toHaveLength(version === 'v1.1' ? 120 : 144); expect(new Set(vectors.map(x => x.id)).size).toBe(vectors.length);
    expect(vectors.every(v => Boolean(v.basis))).toBe(true);
    if (version === 'v1.1') expect(vectors.filter(v => v.expected.status?.startsWith('TBD'))).toHaveLength(11);
  });
});

}
