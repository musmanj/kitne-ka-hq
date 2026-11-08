/**
 * QA harness: runs qa/pricing-engine-test-vectors.json (v1.2) against a COPY of app/.
 * Owner: QA. Input-shape mapping is adapted from the Engineer's tests/qa-vectors.test.ts bridge (seen 9 Nov 00:54 PKT)
 * and extended for v1.2 shapes. Unlike that bridge, QA does NOT skip disputed vectors: only basis=TBD or
 * shapes this harness cannot express are it.todo (listed in the run log). SYNTHETIC DATA only.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { classify, confidenceBand, evaluateCheck, evaluatePool, freshness, normalisePkr, rat, apiError,
  scoreConfidence, verdictFor, type CheckInput, type ComparableCandidate, type Confidence, type Rational } from '../src/index';
import { syntheticCandidate, syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';

const PATH = process.env.QA_VECTORS ?? '/workspace/kitne-ka/qa/pricing-engine-test-vectors.json';
const doc = JSON.parse(readFileSync(PATH, 'utf8'));
type Any = any; // eslint-disable-line
const vectors: Any[] = doc.vectors;
const NOW = Date.parse(SYNTHETIC_NOW), DAY = 86_400_000;
const has = (o: object, k: string) => Object.hasOwn(o, k);
const exact = (v: string): Rational => { const [n, d = '1'] = String(v).split(' ')[0]!.split('/'); return rat(BigInt(n!), BigInt(d)); };
const frac = (v: string | number) => { const [n, d = '1'] = String(v).split(' ')[0]!.split('/'); return Number(n) / Number(d); };
const iso = (ms: number) => new Date(ms).toISOString();

function build(v: Any, now = NOW): CheckInput {
  const vi = v.input, input = syntheticInput(0);
  input.now = iso(now); input.private_expires_at = iso(now + DAY);
  input.variant.condition = vi.condition ?? 'NEW_SEALED'; input.variant.used_grade = vi.used_grade ?? 'GOOD';
  input.variant.attributes.pta_status = vi.pta_status ?? 'APPROVED';
  input.asking_price = vi.asking_price_minor == null ? null : { amount_minor: vi.asking_price_minor, currency: 'PKR' };
  let idx = 0;
  const mk = (rows: Any[], status: string, ages?: number[]): ComparableCandidate[] => rows.map((o: Any, off: number) => {
    const secs = o.age_seconds ?? vi.ages_seconds?.[off];
    const ageDays = o.age_ms !== undefined ? o.age_ms / DAY : secs !== undefined ? secs / 86400
      : o.observed_at_age_days ?? o.age_days ?? ages?.[off] ?? vi.check?.evidence_ages_days?.[off] ?? 1;
    const c: Any = syntheticCandidate(idx++, o.price_pkr ?? o.amount ?? 100000, 0), ob = c.observation;
    ob.observed_at = iso(now - Math.round(ageDays * DAY));
    if (o.amount_minor !== undefined) ob.price.amount_minor = o.amount_minor;
    c.variant.condition = v.id === 'FIL-10' ? 'NEW_SEALED' : input.variant.condition;
    c.variant.used_grade = input.variant.used_grade;
    c.variant.attributes.pta_status = has(o, 'pta_status') ? o.pta_status : status;
    if (has(o, 'observed_at')) ob.observed_at = o.observed_at ?? null;
    if (has(o, 'city')) { c.city = o.city ?? null; c.variant.city = o.city ?? null; }
    if (o.source_updated_at_age_days !== undefined) ob.source_updated_at = iso(now - o.source_updated_at_age_days * DAY);
    if (o.source_updated_at_age_seconds !== undefined) ob.source_updated_at = iso(now - o.source_updated_at_age_seconds * 1000);
    if (has(o, 'source_updated_at')) ob.source_updated_at = o.source_updated_at;
    if (o.retrieved_at_age_days !== undefined) ob.retrieved_at = iso(now - o.retrieved_at_age_days * DAY);
    if (o.source_owner_group) c.source.source_owner_group = o.source_owner_group;
    if (o.seller) c.sellerOwnerId = `SYNTHETIC-${o.seller}`;
    if (o.id) { ob.listing_id = o.id; c.listing_id = o.id; c.canonicalListingId = o.id; }
    if (o.id && o.id === vi.target_listing_id) c.targetListing = true;
    if (o.currency) ob.price.currency = o.currency;
    if (o.price_basis) { c.comparable = false; c.price_basis = 'NOT_COMPARABLE'; }
    if (o.availability) c.inStock = o.availability === 'IN_STOCK';
    // keep source dates consistent with observation (engine reads candidate.observation)
    c.source.observed_at = ob.observed_at; c.source.source_updated_at = ob.source_updated_at;
    return c;
  });
  if (vi.branches) input.candidates = Object.entries(vi.branches).flatMap(([s, b]: Any) => Array.isArray(b) ? mk(b, s) : mk(b.observations, s, b.ages_days));
  else if (vi.check) input.candidates = mk((vi.check.evidence_ages_days as number[]).map((a, i) => ({ price_pkr: [98000, 100000, 102000, 104000, 106000][i] ?? 100000, age_ms: Math.round(a * DAY) })), 'APPROVED');
  else input.candidates = mk(vi.observations ?? [], vi.pta_status ?? 'APPROVED', vi.ages_days);
  return input;
}
function conf(actual: Confidence, e: Any) {
  if (has(e, 'score')) expect(actual.score, 'confidence.score').toBe(e.score);
  if (e.score_max !== undefined) expect(actual.score!).toBeLessThanOrEqual(e.score_max);
  if (e.level) expect(actual.level, 'confidence.level').toBe(e.level);
  for (const r of e.reasons_include ?? []) expect(actual.reasons.map(x => x.code), 'reasons').toContain(r);
  for (const r of e.reasons_exclude ?? []) expect(actual.reasons.map(x => x.code), 'reasons').not.toContain(r);
}
function exclusions(actual: Any[], expected: Any[]) {
  for (const x of expected) expect(actual.find(a => a.code === x.code)?.count ?? 0, `excluded ${x.code}`).toBe(x.count);
}
function pool(v: Any) {
  const input = build(v), e = v.expected;
  const p: Any = evaluatePool({ target: input.variant, config: input.config, candidates: input.candidates, condition: input.variant.condition, now: NOW });
  const r: Any = evaluateCheck(input).result;
  if (e.http_status && e.code) { expect(r.result_state).toBe('ERROR'); expect(r.error.code).toBe(e.code); expect(r.error.http_status).toBe(e.http_status); return; }
  if (e.result_state) expect(r.result_state, 'result_state').toBe(e.result_state);
  const map: Record<string, unknown> = { n_effective: p.evidence.included_count, range_method: p.pool?.range_method,
    range_low_minor: p.pool?.range_low.amount_minor, range_high_minor: p.pool?.range_high.amount_minor, median_minor: p.pool?.median.amount_minor,
    fair_band_low_minor: p.pool?.fair_band_low.amount_minor, fair_band_high_minor: p.pool?.fair_band_high.amount_minor,
    independent_sources: p.evidence.independent_sources, retrieved_count: p.evidence.retrieved_count,
    included_count: p.evidence.included_count, excluded_count: p.evidence.excluded_count };
  for (const [k, val] of Object.entries(map)) if (has(e, k)) expect(val, k).toBe(e[k]);
  if (e.insufficient_reasons && r.result_state === 'INSUFFICIENT_DATA') expect(p.insufficient_reasons, 'insufficient_reasons').toEqual(e.insufficient_reasons);
  if (e.insufficient_reasons) expect(p.insufficient_reasons).toEqual(e.insufficient_reasons);
  if (e.excluded_by_reason) exclusions(p.evidence.excluded_by_reason, e.excluded_by_reason);
  if (e.admitted) expect(p.included.map((x: Any) => x.candidate.observation.price.amount_minor / 100).sort(), 'admitted').toEqual([...e.admitted].sort());
  if (e.included_prices) expect(p.included.map((x: Any) => x.candidate.observation.price.amount_minor / 100).sort(), 'included').toEqual([...e.included_prices].sort());
  if (e.warnings) expect(p.warnings, 'warnings').toEqual(e.warnings);
  if (e.effective_age_days !== undefined) {
    const f: Any = freshness(input.candidates[0]!, NOW);
    if (f.ok) expect(Math.max(0, NOW - f.effective_at) / DAY, 'effective_age_days').toBeCloseTo(e.effective_age_days, 9);
    else { const ob = input.candidates[0]!.observation; const eff = Math.min(...[ob.observed_at, ob.source_updated_at].filter(Boolean).map(t => Date.parse(t as string))); expect((NOW - eff) / DAY, 'effective_age_days (excluded)').toBeCloseTo(e.effective_age_days, 9); }
  }
  const ec = e.confidence ?? (['score', 'level', 'reasons_include', 'reasons_exclude'].some(k => has(e, k)) ? e : null);
  if (ec && p.pool) conf(p.pool.confidence, ec);
  else if (ec && has(ec, 'score') && ec.score === null) expect(r.confidence.score).toBeNull();
  if (r.result_state === 'RANGE_AVAILABLE') {
    const a = r.data.selected_assessment;
    if (e.verdict) expect(e.verdict === 'NO_ASKING_PRICE' ? r.data.verdict_slot.state : a?.verdict, 'verdict').toBe(e.verdict);
    if (e.verdict_slot) expect(r.data.verdict_slot.state).toBe(typeof e.verdict_slot === 'string' ? e.verdict_slot : e.verdict_slot.state);
    if (e.diff_percent != null) expect(a?.diff_percent, 'diff_percent').toBeCloseTo(frac(e.diff_percent), 8);
    if (e.diff_absolute_minor != null) expect(a?.diff_absolute_minor, 'diff_absolute_minor').toBe(e.diff_absolute_minor);
    if (e.indicative !== undefined) expect(a?.indicative, 'indicative').toBe(e.indicative);
    if (e.low_confidence_modifier !== undefined) expect(r.low_confidence_modifier).toBe(e.low_confidence_modifier);
    if (e.verdict && e.verdict !== 'NO_ASKING_PRICE' && p.unrounded && v.input.asking_price_minor)
      expect(verdictFor(v.input.asking_price_minor, p.unrounded.median).verdict, 'verdictFor').toBe(e.verdict);
  }
  return p;
}
function envelope(r: Any, e: Any) {
  if (e.result_state) expect(r.result_state).toBe(e.result_state);
  if (e.data === null) expect(r.data).toBeNull();
  if (r.result_state === 'ERROR') { if (e.error) expect(r.error).toMatchObject(e.error); return; }
  if (e.confidence) conf(r.confidence, e.confidence);
  if (e.low_confidence_modifier !== undefined) expect(r.low_confidence_modifier).toBe(e.low_confidence_modifier);
  if (r.result_state !== 'RANGE_AVAILABLE') return;
  const d = r.data, a = d.selected_assessment;
  if (e.mode) expect(d.mode).toBe(e.mode);
  if (e.selected_assessment === null) expect(a).toBeNull();
  if (e.verdict_slot) expect(d.verdict_slot.state).toBe(typeof e.verdict_slot === 'string' ? e.verdict_slot : e.verdict_slot.state);
  if (e.verdict) expect(a?.verdict).toBe(e.verdict);
  if (e.diff_percent != null) expect(a?.diff_percent).toBeCloseTo(frac(e.diff_percent), 6);
  if (e.indicative !== undefined) expect(a?.indicative ?? false).toBe(e.indicative);
  for (const eb of e.pta_branches ?? []) {
    const b = d.pta_branches.find((x: Any) => x.pta_status === eb.pta_status);
    expect(b.state).toBe(eb.state);
    if (eb.pool === null) expect(b.pool).toBeNull();
    if (eb.median_minor !== undefined) expect(b.pool?.median.amount_minor).toBe(eb.median_minor);
    if (eb.range_low_minor !== undefined) expect(b.pool?.range_low.amount_minor).toBe(eb.range_low_minor);
    if (eb.range_high_minor !== undefined) expect(b.pool?.range_high.amount_minor).toBe(eb.range_high_minor);
    if (eb.confidence) conf(b.pool.confidence, eb.confidence);
  }
  for (const [s, sc] of Object.entries(e.branch_scores ?? {})) expect(d.pta_branches.find((b: Any) => b.pta_status === s)?.pool?.confidence.score).toBe(sc);
  if (e.no_merged_median) { expect(a).toBeNull(); expect(d.verdict_slot.verdict).toBeNull(); }
}
function classifyCase(v: Any) {
  const vi = v.input, e = v.expected;
  let input: CheckInput, at: number;
  if (vi.check) { input = build(v); at = NOW + vi.check.classify_after_ms; }
  else { const stored = vectors.find(x => String(vi.stored).startsWith(x.id)); input = build(stored); at = NOW; }
  const snap = evaluateCheck(input).snapshot;
  const req: Any = { asking_price: { amount_minor: vi.classify?.asking_price_minor ?? 11500000, currency: 'PKR' } };
  if (vi.classify?.pta_status) req.pta_status = vi.classify.pta_status;
  if (vi.classify?.storage_gb) req.storage_gb = vi.classify.storage_gb;
  const out: Any = classify(snap, req, { now: iso(at), expected_version: 1, idempotency_key: `QA-${v.id}`, capability_valid: true, resource_known: true, evidence_valid: true });
  if (e.code) { expect(out.ok, 'ok').toBe(false); expect(out.error?.code, 'code').toBe(e.code); expect(out.error?.http_status, 'http').toBe(e.http_status); return; }
  expect(out.ok, `ok (got ${out.error?.code})`).toBe(true);
  if (out.ok) envelope(out.result, e);
  if (process.env.QA_DEBUG === v.id) console.log(JSON.stringify(out.ok ? out.result.data?.pta_branches?.map((b: Any) => [b.pta_status, b.state]) ?? out.result : out.error));
}
function run(v: Any) {
  const i = v.input, e = v.expected;
  if (i.see) {
    const p = pool(vectors.find(x => x.id === i.see));
    if (v.id === 'OUT-05') { expect(p.included).toHaveLength(7); exclusions(p.evidence.excluded_by_reason, [{ code: 'STATISTICAL_OUTLIER', count: 1 }]); }
    if (v.id === 'FIL-12') expect(`${p.evidence.included_count}+${p.evidence.excluded_count}=${p.evidence.retrieved_count}`).toBe(e.invariant);
    return;
  }
  if (v.group === 'normaliser') {
    const out: Any = normalisePkr(i.raw_text);
    if (has(e, 'ok')) {
      expect(out.ok, `ok (got ${JSON.stringify(out)})`).toBe(e.ok);
      if (e.ok && e.amount_minor !== undefined) expect(out.value.amount_minor).toBe(e.amount_minor);
      if (!e.ok && e.reason) expect(out.reason).toBe(e.reason);
    } else if (typeof e.amount_minor === 'number') {
      expect(out.ok, `ok (got ${JSON.stringify(out)})`).toBe(true); expect(out.value).toEqual({ amount_minor: e.amount_minor, currency: 'PKR' });
    } else throw new Error('normaliser vector shape not supported');
    return;
  }
  if (v.group === 'confidence' && !i.observations) {
    if (i.scores) { expect(i.scores.map(confidenceBand)).toEqual(e.levels); return; }
    if (i.n_effective < 3) { expect(scoreConfidence({ n: i.n_effective, d: 1, recency: 1, quality: 1, wide: false, attributeMatch: false })).toMatchObject({ score: null, level: 'NONE' }); return; }
    const c = scoreConfidence({ n: i.n_effective, d: i.independent_sources, recency: exact(e.R), quality: exact(e.Q),
      attributeMatch: (i.match_quality ?? []).some((q: string) => frac(q) < 1),
      wide: i.P90 !== undefined && (frac(i.P90) - frac(i.P10)) / frac(i.M) > 0.30 });
    conf(c, e); return;
  }
  if (v.group === 'precedence') { const input = syntheticInput(0); (input as Any).operational_error = apiError('SERVICE_UNAVAILABLE', 503); envelope(evaluateCheck(input).result, e); return; }
  if (v.group === 'classify' && (i.check || i.stored)) return classifyCase(v);
  if (v.group === 'pta' && i.stored) return classifyCase(v);
  if (v.group === 'pta' && i.branches) { envelope(evaluateCheck(build(v)).result, e); return; }
  if (v.id === 'PTA-04' || i.observations) { pool(v); return; }
  throw new Error('vector shape not supported by harness');
}
const UNSUPPORTED = new Set<string>(['CLS-03']); // variant-change classify needs a typed request field the pure classify() rejects by key; asserted below as todo
describe(`QA vectors ${doc._changelog?.[0]?.slice(0, 4)} (${vectors.length})`, () => {
  for (const v of vectors) {
    const title = `${v.id} [${v.basis}] ${v.description}`;
    if (v.basis === 'TBD') it.todo(`${title} — TBD`);
    else if (UNSUPPORTED.has(v.id)) it.todo(`${title} — harness-unsupported`);
    else it(title, () => run(v));
  }
});
