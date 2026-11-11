/** SYNTHETIC canonical facts, crypto keys, timestamps and canary strings ONLY. */
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalJson, classify, classifyAtomically, cleanupHealth, configuredPriceBounds, createShareProjection, decodeRational, deserialiseSnapshot,
  encodeRational, evaluateCheck, hydrateSnapshot, InMemoryCheckStore, normalisationWarnings, normalisePkr, pktDailyWindow, PRODUCTION_CONFIG_PLACEHOLDERS,
  publicMerchantUrl, publicShareResponse, rat, redactTokenBearingHeaders, retentionMetadata, retentionState, safeOperationalLog, serialiseSnapshot,
  shareManagementRead, unavailableShare, validateAssessmentRequest, type AtomicClassifyContext, type CategoryConfig, type CheckInput, type CheckSnapshot,
  type ConfirmationRecord, type EngineSnapshotEnvelope, type SnapshotRegistry, type StoredCheck } from '../src';
import { syntheticCandidate, syntheticInput, SYNTHETIC_NOW } from '../src/fixtures/synthetic';
const NOW = new Date(SYNTHETIC_NOW).toISOString(), ms = Date.parse(NOW), day = 86400000;
const iso = (delta: number) => new Date(ms + delta).toISOString();
const hmac = { digest: (s: string) => createHmac('sha256', 'SYNTHETIC-NOT-A-SECRET').update(s).digest('hex') };
function registry(input: CheckInput): SnapshotRegistry {
  return { product: id => id === input.product.id ? input.product : null, config: v => v === input.config.version ? input.config : null,
    source: (id, p) => input.candidates.find(c => c.source_ref === id && c.source.permission_record_id === p)?.source ?? null,
    owner: id => input.candidates.some(c => c.sellerOwnerId === id), city: id => ['SYNTHETIC-city-A', 'SYNTHETIC-city-B'].includes(id) };
}
function serial(snapshot: CheckSnapshot): string { const out = serialiseSnapshot(snapshot, 'SYNTHETIC-policy-1'); expect(out.ok).toBe(true); if (!out.ok) throw new Error('serialize'); return out.value; }
function decoded(json: string, r: SnapshotRegistry): EngineSnapshotEnvelope { const out = deserialiseSnapshot(json, r); expect(out.ok).toBe(true); if (!out.ok) throw new Error('decode'); return out.value; }
function restore(snapshot: CheckSnapshot, r: SnapshotRegistry) { return hydrateSnapshot(decoded(serial(snapshot), r), r, { check_id: snapshot.input.check_id, expires_at: snapshot.input.private_expires_at }); }
const confirmation: ConfirmationRecord = { schema_version: 1, field_paths: ['product_id'], confirmed_at: NOW, category_config_version: 'synthetic-v0', notice_version: 'SYNTHETIC-notice', canonical_fields_digest: 'a'.repeat(64) };
function setup(input = syntheticInput()) {
  const snapshot = evaluateCheck(input).snapshot, snapshot_json = serial(snapshot), r = registry(input);
  decoded(snapshot_json, r);
  const row: StoredCheck = { ...retentionMetadata('PRIVATE_CHECK', 'SYNTHETIC-epoch', NOW), check_id: input.check_id, policy_version: 'SYNTHETIC-policy-1',
    config_version: input.config.version, snapshot_json, confirmation_record: confirmation, classification_versions: { '1': snapshot_json }, replay_refs: {} };
  const context: AtomicClassifyContext = { now: iso(1000), current_epoch: 'SYNTHETIC-epoch', capability_valid: true, capability_scope: 'SYNTHETIC-caller', expected_version: 1,
    idempotency_key: 'SYNTHETIC-key-1', policy_version: row.policy_version, config_version: row.config_version, evidence_valid: true, quota_available: true, registry: r, hmac };
  return { input, snapshot, row, store: new InMemoryCheckStore([row]), context };
}
const ask = { asking_price: { amount_minor: 11000000, currency: 'PKR' as const } };
describe('spec v0.1 amendment R4 exact codec1', () => {
  it.each([[1n, 2n], [-2n, 7n], [0n, 1n], [10000001n, 1n]])('rational exact %s/%s roundtrip', (n, d) => expect(decodeRational(encodeRational(rat(n, d)))).toEqual(rat(n, d)));
  it.each(['+1', '01', '-0', '1e3', 'NaN', 'Infinity', '1.0'])('rejects noncanonical numerator %s', numerator => expect(() => decodeRational({ numerator, denominator: '1' })).toThrow());
  it.each(['0', '-1', '01', '+1'])('rejects denominator %s', denominator => expect(() => decodeRational({ numerator: '1', denominator })).toThrow());
  it('rejects unreduced rational and unknown fields', () => {
    expect(() => decodeRational({ numerator: '2', denominator: '4' })).toThrow();
    expect(() => decodeRational({ numerator: '1', denominator: '2', raw_ocr: 'SYNTHETIC-CANARY' })).toThrow();
  });
  it('preserves odd half-paisa anchor, interpolated quantiles, verdict and dates through JSON', () => {
    const input = syntheticInput(4); input.candidates.forEach((c, i) => { c.observation.price.amount_minor = 10000000 + i; });
    const original = evaluateCheck(input).snapshot, r = registry(input), restored = restore(original, r);
    expect(restored.branches[0]?.selected.unrounded).toEqual(original.branches[0]?.selected.unrounded);
    expect(restored.branches[0]?.selected.unrounded?.median).toEqual(rat(20000003n, 2n));
    expect(restored.result).toMatchObject({ checked_at: NOW, classified_at: NOW, result_state: 'RANGE_AVAILABLE' });
    const a = classify(original, ask, { now: iso(1000), expected_version: 1, idempotency_key: 'SYNTHETIC-k', evidence_valid: true, capability_valid: true, resource_known: true });
    const b = classify(restored, ask, { now: iso(1000), expected_version: 1, idempotency_key: 'SYNTHETIC-k', evidence_valid: true, capability_valid: true, resource_known: true });
    expect(b.ok).toBe(true); if (a.ok && b.ok && a.result.result_state === 'RANGE_AVAILABLE' && b.result.result_state === 'RANGE_AVAILABLE') {
      expect(b.result.data.selected_assessment?.verdict).toBe(a.result.data.selected_assessment?.verdict);
      expect(b.result.data.selected_assessment?.diff_percent).toBe(a.result.data.selected_assessment?.diff_percent);
    }
    expect(JSON.parse(serial(original)).pools[0].statistics.median_minor).toEqual({ numerator: '20000003', denominator: '2' });
  });
  it('restores an already-trimmed sample without a second IQR pass or lost exclusion counts', () => {
    const input = syntheticInput(8); [100000,100000,101000,102000,103000,104000,105000,200000].forEach((p,i) => { input.candidates[i]!.observation.price.amount_minor = p*100; });
    const s = evaluateCheck(input).snapshot, restored = restore(s, registry(input));
    expect(restored.branches[0]?.selected.included).toHaveLength(7); expect(restored.branches[0]?.selected.evidence.excluded_by_reason).toContainEqual({ code: 'STATISTICAL_OUTLIER', count: 1 });
    expect(restored.branches[0]?.selected.unrounded).toEqual(s.branches[0]?.selected.unrounded);
  });
  it('preserves geographic unverified confidence cap across persistence', () => {
    const input = syntheticInput(10); input.geographicUnverified = true; const snapshot = evaluateCheck(input).snapshot;
    const restored = restore(snapshot, registry(input)); expect(restored.input.geographicUnverified).toBe(true); expect(restored.result.confidence).toEqual(snapshot.result.confidence);
  });
  it('preserves insufficient/absent branch diagnostics without other-branch values', () => {
    const input = syntheticInput(), snapshot = evaluateCheck(input).snapshot;
    const outcome = classify(snapshot, { pta_status: 'NON_PTA' }, { now: iso(1000), expected_version: 1, idempotency_key: 'SYNTHETIC-absent', evidence_valid: true, capability_valid: true, resource_known: true });
    expect(outcome.ok).toBe(true); if (outcome.ok) expect(restore(outcome.snapshot, registry(input)).result).toEqual({ ...outcome.result, checked_at: NOW });
  });
  it('preserves IQR-zero warning without repeating a trim', () => {
    const input = syntheticInput(8); input.candidates[7]!.observation.price.amount_minor = 10100000;
    const s = evaluateCheck(input).snapshot; expect(restore(s, registry(input)).branches[0]?.selected.warnings).toEqual(['IQR_ZERO_SPREAD_REVIEW']);
  });
  it.each(['codec', 'methodology', 'rational', 'unknown', 'owner', 'money', 'future', 'validity', 'large', 'display'])('fails closed on %s corruption', kind => {
    const input = syntheticInput(), value = JSON.parse(serial(evaluateCheck(input).snapshot));
    if (kind === 'codec') value.codec_version = 9;
    if (kind === 'methodology') value.methodology_version = '9';
    if (kind === 'rational') value.pools[0].statistics.median_minor.denominator = '0';
    if (kind === 'unknown') value.raw_ocr = 'SYNTHETIC-CANARY';
    if (kind === 'owner') value.pools[0].included_evidence[0].seller_owner_ref = 'UNKNOWN';
    if (kind === 'money') value.pools[0].included_evidence[0].observation.price.amount_minor = Number.MAX_SAFE_INTEGER + 1;
    if (kind === 'future') value.pools[0].included_evidence[0].observation.observed_at = iso(300001);
    if (kind === 'validity') value.pools[0].valid_until = iso(999 * day);
    if (kind === 'large') value.pools[0].included_evidence[0].observation.raw_ocr = 'X'.repeat(1048577);
    if (kind === 'display') value.confirmed_context.product.display_name = 'SYNTHETIC-UNTRUSTED';
    expect(deserialiseSnapshot(JSON.stringify(value), registry(input))).toMatchObject({ ok: false, error: { code: 'SNAPSHOT_CODEC_ERROR', http_status: 500, retryable: false } });
  });
  it('does not serialize excluded candidates, arbitrary metadata, URLs or provider payload', () => {
    const input = syntheticInput(); input.candidates[0]!.source.url = 'https://bad.invalid/?SYNTHETIC-CANARY';
    Object.assign(input.candidates[0]!, { raw_ocr: 'SYNTHETIC-CANARY' });
    const c = syntheticCandidate(99); c.rightsVerified = false; c.source.source_name = 'SYNTHETIC-CANARY'; input.candidates.push(c);
    expect(serial(evaluateCheck(input).snapshot)).not.toContain('SYNTHETIC-CANARY');
  });
});
describe('API v0.7 R5 atomic CAS and scoped HMAC replay', () => {
  it('same key/digest replays original version/date even after another commit; no TTL slide', () => {
    const { store, context, row } = setup();
    const first = classifyAtomically(store, row.check_id, ask, context); expect(first.ok).toBe(true);
    const second = classifyAtomically(store, row.check_id, { asking_price: null }, { ...context, expected_version: 2, idempotency_key: 'SYNTHETIC-key-2', now: iso(2000) }); expect(second.ok).toBe(true);
    const replay = classifyAtomically(store, row.check_id, ask, { ...context, now: iso(3000) });
    expect(classifyAtomically(store, row.check_id, ask, { ...context, quota_available: false }).ok).toBe(true); // no second admission reservation
    expect(replay).toMatchObject({ ok: true, replayed: true, result: { classification_version: 2, classified_at: iso(1000) } });
    const stored = store.atomic(row.check_id, x => ({ value: x }));
    expect(stored?.expires_at).toBe(row.expires_at); expect(stored?.replay_refs).toHaveProperty(hmac.digest(canonicalJson({ resource: row.check_id, action: 'CLASSIFY', capability_scope: context.capability_scope, epoch: context.current_epoch, key: context.idempotency_key })));
    expect(canonicalJson(stored)).not.toContain(context.idempotency_key);
  });
  it('same key changed digest/presence/expected version409 with no mutation', () => {
    const { store, context, row } = setup(); expect(classifyAtomically(store, row.check_id, { pta_status: 'APPROVED' }, context).ok).toBe(true);
    const before = store.atomic(row.check_id, x => ({ value: canonicalJson(x) }));
    expect(classifyAtomically(store, row.check_id, { pta_status: 'APPROVED', asking_price: null }, context)).toMatchObject({ ok: false, error: { code: 'IDEMPOTENCY_CONFLICT', http_status: 409 } });
    expect(classifyAtomically(store, row.check_id, { pta_status: 'APPROVED' }, { ...context, expected_version: 2 })).toMatchObject({ ok: false, error: { code: 'IDEMPOTENCY_CONFLICT' } });
    expect(store.atomic(row.check_id, x => ({ value: canonicalJson(x) }))).toBe(before);
  });
  it('concurrent distinct keys same version give one winner; concurrent same-key one commit', async () => {
    for (const sameKey of [true, false]) {
      const { store, context, row } = setup();
      const outcomes = await Promise.all([0, 1].map(i => Promise.resolve().then(() => classifyAtomically(store, row.check_id, ask, { ...context, idempotency_key: sameKey ? context.idempotency_key : `SYNTHETIC-${i}` }))));
      expect(outcomes.filter(x => x.ok && !x.replayed)).toHaveLength(1);
      if (sameKey) expect(outcomes.filter(x => x.ok && x.replayed)).toHaveLength(1);
      else expect(outcomes.find(x => !x.ok)).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT', http_status: 409 } });
    }
  });
  it.each(['ttl', 'epoch', 'auth', 'rights', 'policy', 'config', 'freshness'])('replay denied after %s guard, no mutation', kind => {
    const input = syntheticInput(); if (kind === 'freshness') input.candidates[0]!.source.expires_at = iso(1500);
    const { store, context, row } = setup(input); expect(classifyAtomically(store, row.check_id, ask, context).ok).toBe(true);
    const patch: Partial<AtomicClassifyContext> = kind === 'ttl' ? { now: iso(day) } : kind === 'epoch' ? { current_epoch: 'NEW-EPOCH' } : kind === 'auth' ? { capability_valid: false } : kind === 'rights' ? { evidence_valid: false } : kind === 'policy' ? { policy_version: 'NEW' } : kind === 'config' ? { config_version: 'NEW' } : { now: iso(1501) };
    const before = store.atomic(row.check_id, x => ({ value: canonicalJson(x) }));
    expect(classifyAtomically(store, row.check_id, ask, { ...context, ...patch }).ok).toBe(false);
    expect(store.atomic(row.check_id, x => ({ value: canonicalJson(x) }))).toBe(before);
  });
  it('missing If-Match428, unknown404, bad HMAC503 and quota failure do not write', () => {
    const { store, context, row } = setup();
    expect(classifyAtomically(store, row.check_id, ask, { ...context, expected_version: null })).toMatchObject({ ok: false, error: { code: 'PRECONDITION_REQUIRED', http_status: 428 } });
    expect(classifyAtomically(store, 'UNKNOWN', ask, context)).toMatchObject({ ok: false, error: { http_status: 404 } });
    expect(classifyAtomically(store, row.check_id, ask, { ...context, hmac: { digest: () => 'bad' } })).toMatchObject({ ok: false, error: { http_status: 503 } });
    expect(classifyAtomically(store, row.check_id, ask, { ...context, quota_available: false }).ok).toBe(false);
    expect(store.atomic(row.check_id, x => ({ value: x?.snapshot_json }))).toBe(row.snapshot_json);
  });
  it('valid absent branch200 is committed once with zero counts; never another branch value', () => {
    const { store, context, row } = setup(); const out = classifyAtomically(store, row.check_id, { pta_status: 'NON_PTA' }, context);
    expect(out).toMatchObject({ ok: true, result: { classification_version: 2, result_state: 'INSUFFICIENT_DATA', data: null,
      insufficient_reasons: ['NO_STORED_RANGE'], evidence: { included_count: 0, retrieved_count: 0, observations: [] } } });
  });
});
function confirmationFixture() {
  const input = syntheticInput();
  const config: CategoryConfig = { ...input.config, attributes: input.config.attributes.map(a => a.type === 'text' ? { ...a, type: 'enum', enum_values: [String(input.variant.attributes[a.key])] } : a.type === 'integer' ? { ...a, min: 1, max: 1024 } : a) };
  const raw = { product_id: input.product.id, variant: { ...input.variant, attributes: { ...input.variant.attributes } }, asking_price: null,
    confirmed_fields: ['product_id', 'variant.product_id', 'variant.config_version', 'variant.condition', 'variant.used_grade', 'variant.city', 'asking_price', ...Object.keys(input.variant.attributes).map(k => `variant.attributes.${k}`)] };
  const r = { products: [input.product], configs: [config], city_ids: ['SYNTHETIC-city-A'] };
  return { raw, r, context: { now: SYNTHETIC_NOW, notice_version: 'SYNTHETIC-notice-1', hmac } };
}
describe('API v0.7 R6 root all-field canonical confirmation', () => {
  it('server stamps UTC canonical HMAC and independently validates every supplied fact/null', () => {
    const { raw, r, context } = confirmationFixture(), out = validateAssessmentRequest(raw, r, context);
    expect(out).toMatchObject({ ok: true, value: { asking_price: null, confirmation_record: { schema_version: 1, confirmed_at: NOW, notice_version: context.notice_version } } });
    if (out.ok) { expect(out.value.confirmation_record.canonical_fields_digest).toMatch(/^[a-f0-9]{64}$/); expect(out.value.confirmation_record.field_paths).toContain('asking_price'); }
    raw.confirmed_fields = raw.confirmed_fields.filter(p => p !== 'asking_price'); expect(validateAssessmentRequest(raw, r, context)).toMatchObject({ ok: false, error: { code: 'CONFIRMATION_REQUIRED', http_status: 422 } });
  });
  it('bounds acknowledgement is an all-field-confirmed typed boolean included in canonical digest', () => {
    const { raw, r, context } = confirmationFixture(); const withFlag = { ...raw, asking_price_confirmed: true, confirmed_fields: [...raw.confirmed_fields, 'asking_price_confirmed'] };
    const a = validateAssessmentRequest(raw,r,context), b = validateAssessmentRequest(withFlag,r,context); expect(b).toMatchObject({ok:true,value:{asking_price_confirmed:true}});
    if(a.ok && b.ok) expect(a.value.confirmation_record.canonical_fields_digest).not.toBe(b.value.confirmation_record.canonical_fields_digest);
    expect(validateAssessmentRequest({...withFlag,asking_price_confirmed:'true'},r,context)).toMatchObject({ok:false,error:{http_status:400}});
    expect(validateAssessmentRequest({...withFlag,confirmed_fields:raw.confirmed_fields},r,context)).toMatchObject({ok:false,error:{code:'CONFIRMATION_REQUIRED'}});
    expect(validateAssessmentRequest({...raw,asking_price:'garbage'},r,context)).toMatchObject({ok:false,error:{code:'INVALID_ASKING_PRICE',http_status:422}});
  });
  it('injected HMAC failure is operational503, no raw exception', () => {
    const { raw, r, context } = confirmationFixture(); expect(validateAssessmentRequest(raw, r, { ...context, hmac: { digest: () => { throw new Error('SYNTHETIC-CANARY'); } } })).toMatchObject({ ok: false, error: { http_status: 503 } });
  });
  it('missing PTA is NOT_SURE and no invented checkbox; unknown used grade does not becomeGOOD', () => {
    const { raw, r, context } = confirmationFixture(); delete raw.variant.attributes.pta_status;
    raw.confirmed_fields = raw.confirmed_fields.filter(p => !p.endsWith('pta_status'));
    expect(validateAssessmentRequest(raw, r, context)).toMatchObject({ ok: true, value: { variant: { attributes: { pta_status: 'NOT_SURE' }, used_grade: null } } });
    raw.variant.condition = 'USED'; expect(validateAssessmentRequest(raw, r, context)).toMatchObject({ ok: false, error: { code: 'CONFIRMATION_REQUIRED' } });
  });
  it.each(['raw', 'label', 'unknownAttribute', 'duplicate', 'alias', 'unknownPath', 'pii', 'wrongProduct', 'unbounded', 'freeText', 'tooLarge', 'badPrice'])('rejects %s without echo', kind => {
    const { raw, r, context } = confirmationFixture();
    if (kind === 'raw') Object.assign(raw, { raw_ocr: 'SYNTHETIC-CANARY' });
    if (kind === 'label') Object.assign(raw.variant, { display_name: 'SYNTHETIC-CANARY' });
    if (kind === 'unknownAttribute') raw.variant.attributes.extra = 'SYNTHETIC-CANARY';
    if (kind === 'duplicate') raw.confirmed_fields.push('product_id');
    if (kind === 'alias') raw.confirmed_fields.push('condition');
    if (kind === 'unknownPath') raw.confirmed_fields.push('raw_ocr');
    if (kind === 'pii') raw.variant.attributes.region_model = 'SYNTHETIC email@example.invalid';
    if (kind === 'wrongProduct') raw.variant.product_id = 'UNKNOWN';
    if (kind === 'unbounded') r.configs[0]!.attributes = r.configs[0]!.attributes.map(a => { const copy = { ...a }; if (a.type === 'integer') { delete copy.min; delete copy.max; } return copy; });
    if (kind === 'freeText') r.configs[0]!.attributes = r.configs[0]!.attributes.map(a => a.key === 'region_model' ? { ...a, type: 'text' } : a);
    if (kind === 'tooLarge') raw.confirmed_fields.push('SYNTHETIC-CANARY'.repeat(10000));
    if (kind === 'badPrice') Object.assign(raw, { asking_price: { amount_minor: 0, currency: 'PKR' } });
    const out = validateAssessmentRequest(raw, r, context); expect(out.ok).toBe(false); expect(JSON.stringify(out)).not.toContain('SYNTHETIC-CANARY');
  });
});
function shareFixture() {
  const snapshot = evaluateCheck(syntheticInput()).snapshot;
  const args = { snapshot_id: 'SYNTHETIC-share', idHash: 'b'.repeat(64), creator_hash: 'c'.repeat(64), revoke_token: 'SYNTHETIC-token-for-tests',
    public_origin: 'https://kitne-ka.invalid', current_epoch: 'SYNTHETIC-epoch', check_birth_epoch: 'SYNTHETIC-epoch', capability_valid: true, rights_valid: true,
    now: NOW, expected_version: 1, confirm_public: true as const };
  const out = createShareProjection(snapshot, args); expect(out.ok).toBe(true); if (!out.ok) throw new Error('share');
  const context = { now: iso(2 * day), current_epoch: 'SYNTHETIC-epoch', database_reachable: true, method: 'GET' as const, rights_valid: true };
  return { snapshot, args, ...out, context };
}
describe('API v0.7 R9 shares and retention: no reason ledger', () => {
  it('create, management after private24h, public snapshot all have identical UTC lifecycle dates', () => {
    const { record, response, context } = shareFixture(), management = shareManagementRead(record, record.snapshot_id, { ...context, capability_present: true, creator_authorized: true });
    expect(management.status).toBe(200); expect(management.body).toMatchObject({ created_at: NOW, expires_at: iso(30 * day), availability: 'AVAILABLE' });
    expect(response).toMatchObject({ created_at: NOW, expires_at: iso(30 * day) }); expect(record.payload).toMatchObject({ created_at: NOW, expires_at: iso(30 * day) });
    const publicOut = publicShareResponse(record, context); expect(publicOut.status).toBe(200); expect(publicOut.body).not.toContain(response.revoke_token);
    expect(publicOut.body).not.toContain('SYNTHETIC-check');
  });
  it('default publish strips asking/verdict/difference; explicit opt-in retains them', () => {
    const { record, snapshot, args } = shareFixture();
    expect(record.payload.result).toMatchObject({ asking_price: null, verdict: 'NO_ASKING_PRICE', diff_percent: null, diff_absolute_minor: null });
    const optin = createShareProjection(snapshot, { ...args, include_asking_price: true });
    expect(optin).toMatchObject({ ok: true, record: { payload: { result: { asking_price: snapshot.asking_price, verdict: 'FAIR' } } } });
  });
  it('known expired, removed, restore invalid, rights withdrawn have byte-identical generic410; HEAD empty', () => {
    const { record, context } = shareFixture(), marker = unavailableShare(record, iso(day));
    const cases = [publicShareResponse(record, { ...context, now: iso(30 * day) }), publicShareResponse(marker, context),
      publicShareResponse(record, { ...context, current_epoch: 'NEW-EPOCH' }), publicShareResponse(record, { ...context, rights_valid: false })];
    expect(new Set(cases.map(c => c.body)).size).toBe(1);
    cases.forEach(c => { expect(c.status).toBe(410); expect(c.body).toBe('{"message_key":"errors.share.unavailable"}'); expect(c.headers).toMatchObject({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); });
    expect(publicShareResponse(marker, { ...context, method: 'HEAD' })).toMatchObject({ status: 410, body: null });
    expect(publicShareResponse(record, { ...context, method: 'HEAD' })).toMatchObject({ status: 200, body: null });
  });
  it('marker has no reason/product/payload/tombstone and drops creator hash at actual expiry; unknown404/outage503', () => {
    const { record, context } = shareFixture(), marker = unavailableShare(record, iso(30 * day));
    expect(Object.keys(marker).sort()).toEqual(['idHash', 'birth_epoch', 'created_at', 'expires_at', 'purge_at'].sort()); expect(marker.purge_at).toBe(iso(31 * day));
    expect(publicShareResponse(null, context).status).toBe(404); expect(publicShareResponse(record, { ...context, database_reachable: false }).status).toBe(503);
    expect(publicShareResponse(marker, { ...context, now: iso(31 * day) }).status).toBe(404);
  });
  it('creator wrong/missing/expired token, old epoch and lost token get no content/reissued capability', () => {
    const { record, context } = shareFixture();
    expect(shareManagementRead(record, record.snapshot_id, { ...context, capability_present: true, creator_authorized: false }).status).toBe(404);
    expect(shareManagementRead(record, record.snapshot_id, { ...context, capability_present: false, creator_authorized: false }).status).toBe(401);
    expect(shareManagementRead(record, record.snapshot_id, { ...context, now: iso(30 * day), capability_present: true, creator_authorized: true }).status).toBe(404);
    const marker = unavailableShare(record, iso(day));
    expect(shareManagementRead(marker, record.snapshot_id, { ...context, capability_present: true, creator_authorized: true })).toMatchObject({ status: 200, body: { availability: 'UNAVAILABLE', url: null } });
  });
  it('publication rejects mismatched version/epoch/rights; fixes earlier rights expiry with no sliding', () => {
    const { snapshot, args } = shareFixture();
    for (const patch of [{ expected_version: 2 }, { check_birth_epoch: 'OLD' }, { rights_valid: false }]) expect(createShareProjection(snapshot, { ...args, ...patch }).ok).toBe(false);
    const limited = createShareProjection(snapshot, { ...args, rights_expires_at: iso(day) }); expect(limited).toMatchObject({ ok: true, response: { expires_at: iso(day) } });
  });
  it.each([['UNRESOLVED', 3600000], ['PRIVATE_CHECK', day], ['PUBLIC_SHARE', 30 * day]] as const)('%s expires exactly, epoch invalidation first', (kind, ttl) => {
    const meta = retentionMetadata(kind, 'SYNTHETIC-epoch', NOW);
    expect(meta.expires_at).toBe(iso(ttl)); expect(retentionState(meta, kind, iso(ttl - 1), 'SYNTHETIC-epoch')).toBe('ACTIVE');
    expect(retentionState(meta, kind, iso(ttl), 'SYNTHETIC-epoch')).toBe('EXPIRED'); expect(retentionState(meta, kind, iso(0), 'NEW')).toBe('INVALID_EPOCH');
  });
});
describe('R1/R2/R3/R7 conservative boundaries and pure SecOps', () => {
  it('shared URL independent owners5, same owner crossURL4, identical observation dedup1 and conflicting IDs excludedALL', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.source.url = 'https://shared.invalid/feed'; });
    expect(evaluateCheck(input).snapshot.branches[0]?.selected.evidence.included_count).toBe(5);
    input.candidates[0]!.sellerOwnerId = input.candidates[1]!.sellerOwnerId; input.candidates[0]!.source.url = 'https://other.invalid/feed';
    expect(evaluateCheck(input).snapshot.branches[0]?.selected.evidence.included_count).toBe(4);
    const same = syntheticInput(); same.candidates.push(JSON.parse(JSON.stringify(same.candidates[0])));
    expect(evaluateCheck(same).snapshot.branches[0]?.selected.evidence.excluded_by_reason).toContainEqual({ code: 'DUPLICATE', count: 1 });
    same.candidates.at(-1)!.observation.price.amount_minor++;
    expect(evaluateCheck(same).snapshot.branches[0]?.selected.evidence.excluded_by_reason).toContainEqual({ code: 'UNVERIFIED_PROVENANCE', count: 2 });
  });
  it('unsafe/unapproved attribution links null without evidence loss; explicit exact rights-approved link allowed', () => {
    const input = syntheticInput(); input.candidates.forEach(c => { c.source.url = 'https://bad.invalid/?SYNTHETIC-CANARY'; });
    const result = evaluateCheck(input).result; expect(result.result_state).toBe('RANGE_AVAILABLE');
    if (result.result_state === 'RANGE_AVAILABLE') { expect(result.data.selected_assessment?.evidence.included_count).toBe(5); expect(JSON.stringify(result)).not.toContain('SYNTHETIC-CANARY'); }
    const approved = [{ source_id: 'SYNTHETIC-source-0', url: 'https://approved.invalid/item', display_rights: true as const }];
    expect(publicMerchantUrl(approved[0]!.url, approved, approved[0]!.source_id)).toBe(approved[0]!.url);
    expect(publicMerchantUrl('https://approved.invalid/item?token=canary', approved, approved[0]!.source_id)).toBeNull();
  });
  it.each(['1.2', '500', '125000', '1,25,000'])('UNMARKED_NUMBER %s advisory only', raw => {
    const out = normalisePkr(raw); expect(out.ok).toBe(true); expect(normalisationWarnings(out)).toEqual([{ code: 'UNMARKED_NUMBER', message_key: 'price.normalisation.unmarked_number', params: {} }]);
  });
  it('pending production config503; synthetic bounds explicit; no default usedGOOD', () => {
    const input = syntheticInput(); input.config = { ...input.config, environment: 'PRODUCTION', ...{ price_bounds_minor: { min: null, max: null, basis: null } } };
    expect(() => configuredPriceBounds(input.config)).toThrow(); expect(evaluateCheck(input).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONFIGURATION_REQUIRED', http_status: 503 } });
    const syntheticInProduction = syntheticInput(); syntheticInProduction.config = { ...syntheticInProduction.config, environment: 'PRODUCTION' };
    expect(evaluateCheck(syntheticInProduction).result).toMatchObject({ result_state: 'ERROR', error: { code: 'CONFIGURATION_REQUIRED' } });
    expect(PRODUCTION_CONFIG_PLACEHOLDERS.default_used_grade).toBeNull(); expect(syntheticInput().variant.used_grade).toBeNull();
  });
  it('logging allowlist/header redaction never mirrors canaries, tokens or paths; PKT daily boundary exact', () => {
    expect(redactTokenBearingHeaders({ Authorization: 'SYNTHETIC-CANARY', 'X-Revoke-Token': 'SYNTHETIC-CANARY' })).toEqual({ authorization: '[REDACTED]', 'x-revoke-token': '[REDACTED]' });
    expect(safeOperationalLog({ route_template: '/s/:id', url: '/s/SYNTHETIC-CANARY', body: 'SYNTHETIC-CANARY', token: 'SYNTHETIC-CANARY', status: 410, count: 1 })).toEqual({ route_template: '/s/:id', status: 410, count: 1 });
    expect(safeOperationalLog({ route_template: '/s/SYNTHETIC-CANARY', error: 'SYNTHETIC-CANARY' })).toEqual({});
    expect(pktDailyWindow(ms)).toEqual({ start_ms: ms, end_ms: ms + day });
  });
  it('cleanup DB/epoch/status and exact20m/15m policy; no fabricated health', () => {
    const heartbeat = { birth_epoch: 'SYNTHETIC-epoch', last_attempt_at: NOW, last_attempt_status: 'SUCCEEDED' as const, last_success_at: NOW, oldest_overdue_ms: 15 * 60000, overdue_count: 2 };
    const context = { now: iso(20 * 60000), current_epoch: 'SYNTHETIC-epoch', database_reachable: true };
    expect(cleanupHealth(heartbeat, context).status).toBe(200); expect(cleanupHealth(heartbeat, { ...context, now: iso(20 * 60000 + 1) }).status).toBe(503);
    expect(cleanupHealth({ ...heartbeat, oldest_overdue_ms: 15 * 60000 + 1 }, context).status).toBe(503);
    expect(cleanupHealth({ ...heartbeat, last_attempt_status: 'FAILED' }, context).status).toBe(503);
    expect(cleanupHealth(heartbeat, { ...context, current_epoch: 'NEW' }).status).toBe(503);
    expect(cleanupHealth(null, context).status).toBe(503); expect(cleanupHealth(heartbeat, { ...context, database_reachable: false }).status).toBe(503);
  });
});
