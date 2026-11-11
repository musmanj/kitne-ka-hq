/** SYNTHETIC policy tests. No approval or numeric value is a production artifact. */
import { describe, expect, it } from 'vitest';
import { classify, evaluateCheck, normalisePkr, normalisationWarnings, validateAssessmentRequest, serialiseSnapshot, deserialiseSnapshot, hydrateSnapshot,
  EXCLUSION_ORDER, publicShareResponse, type ClassifyContext, type ClassifyRequest, type Variant } from '../src';
import { syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
const context: ClassifyContext = { now: SYNTHETIC_NOW, expected_version: 1, idempotency_key: 'SYNTHETIC-bounds', capability_valid: true, evidence_valid: true, resource_known: true };
function input() { const x = syntheticInput(); x.config = { ...x.config, price_bounds_minor: { min: 150000, max: 150000000, basis: 'SYNTHETIC' } }; return x; }
const price = (n: number) => ({ amount_minor: n, currency: 'PKR' as const });
describe('PENDING Founder approval, gated by503: soft bounds and exact10x ceiling', () => {
  it.each([0, -1, 0.1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])('technical %s first, even missing config/confirmed', amount => {
    const x = input(); x.asking_price = price(amount); x.asking_price_confirmed = true; x.config.price_bounds_minor = { min: null, max: null, basis: null };
    expect(evaluateCheck(x).result).toMatchObject({ result_state: 'ERROR', error: { code: 'INVALID_ASKING_PRICE', http_status: 422 } });
  });
  it.each([false, true])('more than10x rejects immediately regardless confirmation%s', confirmed => {
    const x = input(); x.asking_price = price(1500000001); x.asking_price_confirmed = confirmed;
    expect(evaluateCheck(x).result).toMatchObject({ result_state: 'ERROR', error: { code: 'ASKING_PRICE_IMPLAUSIBLE', http_status: 422 } });
    expect(classify(evaluateCheck(input()).snapshot, { asking_price: x.asking_price, asking_price_confirmed: confirmed }, context)).toMatchObject({ ok: false, error: { code: 'ASKING_PRICE_IMPLAUSIBLE' } });
  });
  it.each([149999, 150000001, 1500000000])('outsidebounds %s through EXACT10x soft-confirmable', amount => {
    const x = input(); x.asking_price = price(amount);
    expect(evaluateCheck(x).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONFIRMATION_REQUIRED', http_status: 422, message_key: 'errors.check.confirm_fields', details: { fields: ['asking_price'], reason: 'OUT_OF_CATEGORY_BOUNDS' } } });
    x.asking_price_confirmed = true; expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');
  });
  it.each([150000, 150000000])('inclusive endpoint %s needs no extra acknowledgement', amount => {
    const x = input(); x.asking_price = price(amount); expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');
  });
  it('proposed numeric values WITHOUT approval metadata still503, no fabricated approval', () => {
    const x = input(); x.config.environment = 'PRODUCTION'; x.config.price_bounds_minor!.basis = 'APPROVED'; x.asking_price = price(1500000001); x.asking_price_confirmed = true;
    expect(evaluateCheck(x).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONFIGURATION_REQUIRED', http_status: 503 } });
    x.config.approval_status = 'APPROVED'; // STILL no actual scope/approver/source/time
    expect(evaluateCheck(x).result).toMatchObject({ error: { code: 'CONFIGURATION_REQUIRED' } });
  });
  it('confirmation bound to exact price/config; PTA-only may reuse, changed price may not; false revokes', () => {
    const x = input(); x.asking_price = price(50000); x.asking_price_confirmed = true; const s = evaluateCheck(x).snapshot;
    expect(classify(s, { pta_status: 'APPROVED' }, context).ok).toBe(true);
    expect(classify(s, { asking_price: price(50001) }, context)).toMatchObject({ ok: false, error: { code: 'CONFIRMATION_REQUIRED' } });
    expect(classify(s, { asking_price: price(50001), asking_price_confirmed: true }, context).ok).toBe(true);
    expect(classify(s, { pta_status: 'APPROVED', asking_price_confirmed: false }, context)).toMatchObject({ ok: false, error: { code: 'CONFIRMATION_REQUIRED' } });
    expect(classify(s, { asking_price_confirmed: true }, context)).toMatchObject({ ok: false, error: { code: 'CLASSIFICATION_INPUT_REQUIRED' } });
    expect(classify(s, { asking_price_confirmed: 'true' } as unknown as ClassifyRequest, context)).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST', http_status: 400 } });
    const json = serialiseSnapshot(s, 'SYNTHETIC-policy'); expect(json.ok).toBe(true);
    if (!json.ok) return;
    const registry = { product: () => x.product, config: () => x.config, source: (id: string) => x.candidates.find(c => c.source_ref === id)?.source ?? null, owner: () => true, city: () => false };
    const decoded = deserialiseSnapshot(json.value, registry); expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(classify(hydrateSnapshot(decoded.value, registry, { check_id: x.check_id, expires_at: x.private_expires_at }), { pta_status: 'APPROVED' }, context).ok).toBe(true);
  });
  it('economic vs technical/noncash exclusion order and count invariants are preserved', () => {
    const x = input(); x.candidates[0]!.observation.price.amount_minor = 0; x.candidates[0]!.inStock = false;
    x.candidates[1]!.comparable = false; x.candidates[1]!.observation.price.amount_minor = 50000;
    x.candidates[2]!.observation.price.amount_minor = 50000; x.candidates[2]!.inStock = false;
    const e = evaluateCheck(x).snapshot.branches[0]!.selected.evidence;
    expect(e.excluded_by_reason).toEqual([{ code: 'PRICE_NOT_COMPARABLE', count: 2 }, { code: 'OUT_OF_CATEGORY_BOUNDS', count: 1 }]);
    expect(e.included_count + e.excluded_count).toBe(e.retrieved_count);
    expect(EXCLUSION_ORDER.indexOf('OUT_OF_CATEGORY_BOUNDS')).toBe(EXCLUSION_ORDER.indexOf('PRICE_NOT_COMPARABLE') + 1);
  });
});
describe('CTO/Addendum B parser mapping and explicit mixed-ASCII confirmation', () => {
  it.each([['۱,۲۵,۰۰۰',12500000], ['١٢٥٠٠٠',12500000], ['۱٢٥٠٠٠',12500000], ['۱۲٬۵۰۰٫۵۰',1250050], ['۱٫۵ lac',15000000], ['2 crores',2000000000], ['1.5 CRORES',1500000000], ['2 LACS',20000000], ['1.5 LAKHS',15000000]] as const)('%s exact value, no silent script guessing', (raw, minor) => {
    expect(normalisePkr(raw)).toMatchObject({ ok: true, value: price(minor) }); const r = normalisePkr(raw); if (r.ok) expect(r.requires_confirmation).not.toBe(true);
  });
  it.each(['۱25k','١٢٬500','۱٬25,000','۱٢٥000'])('%s cannot be silently accepted: advisory+explicit confirmation', raw => {
    const r = normalisePkr(raw); expect(r).toMatchObject({ ok: true, requires_confirmation: true, warnings: expect.arrayContaining(['MIXED_DIGIT_SCRIPTS']) });
    if (r.ok) expect(r.value.amount_minor).toBe(raw === '١٢٬500' ? 1250000 : 12500000);
  });
  it.each(['۱٬۲۵۰٬۰۰','۱٬۲٬۳۴۵','1 lakh 20k','۱ لاکھ','crores'])('%s malformed/out-of-scope gives no partial amount', raw => expect(normalisePkr(raw)).toEqual({ ok: false, reason: 'NOT_A_NUMBER' }));
  it('public mixed-script advisory examines digits only, not Arabic decimal punctuation', () => {
    const ascii = normalisePkr('1٫5 lac'); expect(ascii).toMatchObject({ok:true,value:price(15000000)});
    expect(normalisationWarnings(ascii).map(w=>w.code)).not.toContain('MIXED_DIGIT_SCRIPTS'); if(ascii.ok) expect(ascii.requires_confirmation).not.toBe(true);
    const mixed = normalisePkr('۱25k'); expect(mixed).toMatchObject({ok:true,requires_confirmation:true});
    expect(normalisationWarnings(mixed)).toContainEqual({code:'MIXED_DIGIT_SCRIPTS',message_key:'price.normalisation.mixed_digit_scripts',params:{}});
  });
  it('160 mapped codepoints accepted/161 rejected; sub-paisa half-even ties unchanged', () => {
    expect(normalisePkr('۰'.repeat(159)+'۱')).toMatchObject({ ok: true, value: price(100) }); expect(normalisePkr('۰'.repeat(160)+'۱')).toEqual({ ok: false, reason: 'TOO_LARGE' });
    expect(normalisePkr('۱٫۰۰۵')).toMatchObject({ ok: true, value: price(100) }); expect(normalisePkr('۱٫۰۱۵')).toMatchObject({ ok: true, value: price(102) });
  });
});
describe('API v0.7 cleanup and unsupported conditions', () => {
  it.each(['OPEN_BOX','KIT','REFURBISHED','REPAIRED','OTHER'])('%s never becomes a pricedUsed/insufficient pool', condition => {
    const x = input(); x.variant.condition = condition as Variant['condition'];
    expect(evaluateCheck(x).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONDITION_NOT_SUPPORTED', http_status: 422, message_key: 'errors.condition.not_supported' } });
    const raw = { product_id: x.product.id, variant: x.variant, confirmed_fields: [] };
    expect(validateAssessmentRequest(raw, { products: [x.product], configs: [x.config], city_ids: [] }, { now: SYNTHETIC_NOW, notice_version: 'SYNTHETIC', hmac: { digest: () => 'a'.repeat(64) } })).toMatchObject({ ok: false, error: { code: 'CONDITION_NOT_SUPPORTED' } });
  });
  it('malformedPTA422 INVALID_PTA_STATUS; generic public404 and503 SNAPSHOT_UNAVAILABLE', () => {
    expect(classify(evaluateCheck(input()).snapshot, { pta_status: 'wrong' } as unknown as ClassifyRequest, context)).toMatchObject({ ok: false, error: { code: 'INVALID_PTA_STATUS', http_status: 422 } });
    const c = { now: SYNTHETIC_NOW, current_epoch: 'SYNTHETIC', database_reachable: true, method: 'GET' as const, rights_valid: true };
    expect(publicShareResponse(null,c)).toMatchObject({ status:404,body:'{"message_key":"errors.share.unavailable"}' });
    const failure = publicShareResponse(null,{...c,database_reachable:false}); expect(failure.status).toBe(503); expect(JSON.parse(failure.body!)).toMatchObject({ code:'SNAPSHOT_UNAVAILABLE', retryable:true });
  });
  it('used battery/repair optional, not matched/score-penalised, disclosed; grade remainsrequired', () => {
    const x = input(); x.variant.condition = 'USED'; x.variant.used_grade = 'GOOD'; delete x.variant.attributes.battery_health_band; delete x.variant.attributes.repair_status;
    x.candidates.forEach(c => { c.variant.condition = 'USED'; c.variant.used_grade = 'GOOD'; c.variant.attributes.battery_health_band = 'UNKNOWN'; c.variant.attributes.repair_status = 'REPAIRED'; });
    const r = evaluateCheck(x).result; expect(r.result_state).toBe('RANGE_AVAILABLE'); if(r.result_state==='RANGE_AVAILABLE') expect(r.data.selected_assessment?.warnings).toContain('USED_BATTERY_REPAIR_NOT_MATCHED');
    x.variant.used_grade = null; expect(evaluateCheck(x).result.result_state).toBe('INSUFFICIENT_DATA');
  });
});
describe('CTO approver-id allowlist gate,9Nov01:33PKT', () => {
  function approvedInput() {
    const x = input(); x.config = {...x.config, version:'1.0.0'}; x.variant.config_version='1.0.0'; x.candidates.forEach(c=>{c.variant.config_version='1.0.0';}); x.config.environment = 'PRODUCTION'; x.config.approval_status = 'APPROVED'; x.config.price_bounds_minor!.basis = 'APPROVED';
    x.config.approval_scope = { category_id: x.config.id, conditions: ['NEW_SEALED','USED'], approved_by: 'SYNTHETIC-approver-1', approved_at: '2026-11-08T19:00:00Z', source_ref: 'qa/SYNTHETIC-policy.md' }; return x;
  }
  it.each(['<Founder>', 'TBD', 'TODO', 'tbd', 'SYNTHETIC-TODO', '', '   '])('placeholder %s rejected EVEN if allowlisted', id => {
    const x = approvedInput(); x.config.approval_scope!.approved_by = id; x.config.approver_allowlist = [id];
    expect(evaluateCheck(x).result).toMatchObject({ result_state:'ERROR',error:{code:'CONFIGURATION_REQUIRED',http_status:503} });
  });
  it.each([[], ['SYNTHETIC-someone-else'], null])('missing/empty/unlisted gate stays503: %s', allowlist => {
    const x = approvedInput(); x.config.approver_allowlist = allowlist;
    expect(evaluateCheck(x).result).toMatchObject({ error:{code:'CONFIGURATION_REQUIRED',http_status:503} });
  });
  it('valid matching SYNTHETIC test-only approver with all metadata permits test evaluation, never production approval', () => {
    const x = approvedInput(); x.config.approver_allowlist = ['SYNTHETIC-approver-1']; expect(evaluateCheck(x).result.result_state).toBe('RANGE_AVAILABLE');
  });
});
