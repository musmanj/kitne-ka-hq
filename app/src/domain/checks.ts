import { loadCategoryConfig, ownData } from './policy-validation';
import { isStrictMoney } from './money-validation';
import { askingBoundsError, bindAskingAcknowledgement, sameAskingAcknowledgement, type AskingAcknowledgement } from './asking-policy';
import type { ApiError, Assessment, CategoryConfig, CheckResult, ComparableCandidate, Confidence,
  DifferenceFraction, EvidenceSummary, Money, Product, PtaBranch, RangeData, ResultBase, Variant } from './types';
import { asNumber, PriceOutputOverflowError } from './numeric';
import { identityConfirmed } from './matching';
import { evidenceMetadata, evidenceRows, suppressEvidenceRows } from './evidence';
import { EXCLUSION_ORDER, INSUFFICIENT_REASON_ORDER, PRIVATE_CHECK_TTL_MS } from './policy';
import { METHODOLOGY_VERSION, evaluatePool, ConfigurationRequiredError, configuredPriceBounds, none, poolConfidence, timestamp, verdictFor, type PoolEvaluation } from './pricing';
/** Trusted canonical domain input AFTER all-field confirmation and server schema validation.
 * Not an HTTP body schema, rights grant, authentication or OCR endpoint. */
export type CheckInput = { check_id: string; product: Product; variant: Variant; config: CategoryConfig;
  candidates: ComparableCandidate[]; asking_price: Money | null; now: string; private_expires_at: string;
  geographicUnverified?: boolean; asking_price_confirmed?: boolean; operational_error?: ApiError };
export type StoredBranch = { pta_status: 'APPROVED' | 'NON_PTA' | null; variant: Variant;
  selected: PoolEvaluation; new_market: PoolEvaluation; used_market: PoolEvaluation };
export type CheckSnapshot = { input: CheckInput; branches: StoredBranch[]; selected_pta: 'APPROVED' | 'NON_PTA' | null;
  classification_version: number; asking_price: Money | null; asking_acknowledgement?: AskingAcknowledgement | null; result: CheckResult; replays: Record<string, { fingerprint: string; result: CheckResult }> };
export type Evaluation = { result: CheckResult; snapshot: CheckSnapshot };
/** Pure deep copy/freeze: caller cannot mutate evidence after assessment. Bigints stay internal. */
function copy<T>(value: T): T {
  if (Array.isArray(value)) return value.map(copy) as T;
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, copy(v)])) as T;
  return value;
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export const apiError = (code: string, http_status: number, key = code.toLowerCase()): ApiError => ({ code, http_status,
  message_key: `errors.${key}`, params: {}, retryable: ['VERSION_CONFLICT', 'SERVICE_UNAVAILABLE', 'ANALYSIS_TIMEOUT', 'INTERNAL_ERROR'].includes(code), request_id: 'pure-domain',
  link_failure_reason: null, fallback_actions: [] });
function confirmedContext(input: CheckInput, selectedPta: CheckSnapshot['selected_pta']): ResultBase['confirmed_context'] {
  if (!input.product.id || !input.product.brand || !input.product.model || !identityConfirmed(input.variant, input.config)) return null;
  const phonePta = input.config.attributes.some(a => a.key === 'pta_status');
  const original = input.variant.attributes.pta_status;
  const pta_status = phonePta ? selectedPta ?? (original === 'APPROVED' || original === 'NON_PTA' ? original : 'NOT_SURE') : null;
  return { product: { id: input.product.id, display_name: `${input.product.brand} ${input.product.model}` },
    variant: { config_version: input.config.version,
      attributes: Object.fromEntries(input.config.attributes.filter(a => a.key !== 'pta_status' && Object.hasOwn(input.variant.attributes, a.key)).map(a => [a.key, input.variant.attributes[a.key]!])),
      condition: input.variant.condition, used_grade: input.variant.used_grade, pta_status } };
}
export function base(input: CheckInput, version: number, now: string, validUntil: number | null, pta: CheckSnapshot['selected_pta'] = null): ResultBase {
  return { check_id: input.check_id, classification_version: version, confirmed_context: confirmedContext(input, pta), checked_at: input.now, classified_at: now,
    valid_until: validUntil === null ? null : new Date(validUntil).toISOString(), methodology_version: METHODOLOGY_VERSION,
    category_config_version: input.config.version };
}
function errorResult(input: CheckInput, error: ApiError, version = 1, now = input.now): CheckResult {
  return { ...base(input, version, now, null), confirmed_context: null, result_state: 'ERROR', error, data: null, confidence: null, low_confidence_modifier: false };
}
function assessment(input: CheckInput, b: StoredBranch, asking: Money | null, now: number, classified_at: string | null): Assessment {
  const e = b.selected, pool = e.pool!, confidence = poolConfidence(e.included, e.unrounded!, now, false, input.geographicUnverified);
  const pricing = asking ? verdictFor(asking.amount_minor, e.unrounded!.median) : null;
  const reasons = pricing?.verdict === 'UNUSUALLY_LOW' ? ['verdict.verify_condition_pta_lock_seller'] : [];
  // API v0.7 R3: hide expired optional alternative, never substitute or refresh.
  const currentPool = (value: PoolEvaluation) => value.pool && value.valid_until! >= now
    ? { ...value.pool, confidence: value === e ? confidence : poolConfidence(value.included, value.unrounded!, now, false, input.geographicUnverified) } : null;
  return { assessment_id: input.check_id, product: input.product, confirmed_variant: b.variant, asking_price: asking,
    checked_at: input.now, classified_at, methodology_version: METHODOLOGY_VERSION, config_version: input.config.version,
    verdict: pricing?.verdict ?? 'NO_ASKING_PRICE', indicative: pricing !== null && confidence.level === 'LOW', confidence,
    selected_pool: b.variant.condition === 'USED' ? 'USED' : 'NEW',
    range_low: pool.range_low, range_high: pool.range_high, median: pool.median,
    fair_band_low: pool.fair_band_low, fair_band_high: pool.fair_band_high,
    diff_absolute_minor: pricing?.diff_absolute_minor ?? null, // spec v0.1 §7/API v0.5 'Percentage unit fixed': 0.10 means10%, not10.
    diff_percent: pricing ? asNumber(pricing.diff_ratio) as DifferenceFraction : null,
    new_market: currentPool(b.new_market), used_market: currentPool(b.used_market),
    alternative_pool_unavailable: (b.variant.condition === 'USED' ? b.new_market : b.used_market).pool &&
      (b.variant.condition === 'USED' ? b.new_market : b.used_market).valid_until! < now ? 'STALE' : null,
    verified_retail: null, evidence: { ...e.evidence, new_pool_count: b.new_market.evidence.included_count,
      used_pool_count: b.used_market.evidence.included_count }, insufficient_reasons: [],
    explanation: [{ message_key: 'pricing.asking_market_not_sold', params: {} }, ...reasons.map(message_key => ({ message_key, params: {} }))],
    warnings: [...e.warnings, ...(b.variant.condition === 'USED' ? ['USED_BATTERY_REPAIR_NOT_MATCHED'] : []), 'PAKISTAN_WIDE_NO_CITY_ADJUSTMENT', ...(pricing?.verdict === 'UNUSUALLY_LOW' ? ['VERIFY_CONDITION_PTA_LOCK_SELLER_BEFORE_PAYING'] : [])] };
}
function splitEvidence(input: CheckInput, branches: StoredBranch[]): EvidenceSummary {
  // Diagnostic union, never a pool. Each raw candidate counted once in this summary.
  const allIncluded = [...new Map(branches.flatMap(b => b.selected.included).map(x => [x.candidate.observation.id, x])).values()];
  const included = allIncluded.length;
  const admittedIndexes = new Set(branches.flatMap(b => b.selected.included).map(x => x.input_index));
  const excluded = input.candidates.length - included;
  const reasons = new Map<import('./types').ExclusionReason, number>();
  for (let index = 0; index < input.candidates.length; index++) {
    if (admittedIndexes.has(index)) continue;
    const possible = branches.flatMap(b => b.selected.exclusions).filter(x => x.input_index === index);
    const reason = possible.find(x => x.reason !== 'VARIANT_MISMATCH')?.reason ?? possible[0]?.reason ?? 'DUPLICATE';
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  return { retrieved_count: input.candidates.length, included_count: included,
    used_condition_included_count: input.variant.condition === 'USED' ? included : 0, excluded_count: excluded,
    excluded_by_reason: EXCLUSION_ORDER.filter(code => reasons.has(code)).map(code => ({ code, count: reasons.get(code)! })),
    new_pool_count: input.variant.condition === 'NEW_SEALED' ? included : 0,
    used_pool_count: input.variant.condition === 'USED' ? included : 0,
    independent_sources: new Set(branches.flatMap(b => b.selected.included).map(x => x.candidate.sellerOwnerId)).size,
    ...evidenceMetadata(allIncluded, timestamp(input.now)!), observations: evidenceRows(allIncluded, input.config) };
}
export function render(input: CheckInput, branches: StoredBranch[], pta: CheckSnapshot['selected_pta'], asking: Money | null,
  version: number, nowIso: string): CheckResult {
  const now = timestamp(nowIso)!;
  const split = branches.length === 2 && pta === null;
  const b = split ? null : branches.find(x => x.pta_status === pta) ?? null;
  const passing = split ? branches.filter(x => x.selected.pool) : b?.selected.pool ? [b] : [];
  const validUntil = passing.length ? Math.min(...passing.map(x => x.selected.valid_until!)) : null;
  const header = base(input, version, nowIso, validUntil, pta);
  if (!passing.length) return { ...header, result_state: 'INSUFFICIENT_DATA', error: null, data: null,
    evidence: suppressEvidenceRows(b?.selected.evidence ?? splitEvidence(input, branches)),
    insufficient_reasons: INSUFFICIENT_REASON_ORDER.filter(reason => (b ? [b] : branches).some(x => x.selected.insufficient_reasons.includes(reason))),
    confidence: none(), low_confidence_modifier: false };
  let data: RangeData;
  if (split) {
    const ptaBranches: PtaBranch[] = branches.map(x => ({ pta_status: x.pta_status!,
      state: x.selected.pool ? 'RANGE_AVAILABLE' : 'INSUFFICIENT_DATA',
      pool: x.selected.pool ? { ...x.selected.pool, confidence: poolConfidence(x.selected.included, x.selected.unrounded!, now, true, input.geographicUnverified) } : null,
      fair_band_low: x.selected.pool?.fair_band_low ?? null, fair_band_high: x.selected.pool?.fair_band_high ?? null,
      evidence: x.selected.evidence, insufficient_reasons: x.selected.insufficient_reasons }));
    const scores = ptaBranches.flatMap(x => x.pool ? [x.pool.confidence.score!] : []);
    const confidence: Confidence = { score: Math.min(...scores), level: 'LOW',
      reasons: [{ code: 'PTA_UNCONFIRMED', message_key: 'confidence.weakest_displayed_pta_branch', params: {} }] };
    data = { mode: 'PTA_SPLIT', selected_assessment: null, pta_branches: ptaBranches, asking_price: asking,
      verdict_slot: { state: 'PTA_SELECTION_REQUIRED', verdict: null, message_key: 'verdict.confirm_pta' }, confidence, low_confidence_modifier: true };
  } else {
    const a = assessment(input, b!, asking, now, version === 1 ? null : nowIso);
    data = { mode: 'SINGLE_POOL', selected_assessment: a, pta_branches: [], asking_price: asking,
      verdict_slot: asking ? { state: 'PRICE_VERDICT', verdict: a.verdict as 'FAIR' | 'HIGH' | 'UNUSUALLY_LOW', message_key: `verdict.${a.verdict.toLowerCase()}` } :
        { state: 'NO_ASKING_PRICE', verdict: null, message_key: 'verdict.add_asking_price' },
      confidence: a.confidence, low_confidence_modifier: a.confidence.level === 'LOW' };
  }
  return { ...header, result_state: 'RANGE_AVAILABLE', error: null, data, confidence: data.confidence, low_confidence_modifier: data.low_confidence_modifier };
}
/** No failed raw config, exception message or context derived from it is retained.
 * The inert error snapshot cannot be evaluated/classified: its policy stays unapproved. */
function ingressFailure(raw:unknown,code:string,status:number,key:string):Evaluation {
  const id=ownData(raw,'check_id'), at=ownData(raw,'now');
  const now=typeof at==='string' && timestamp(at)!==null ? at : '1970-01-01T00:00:00Z';
  const input:CheckInput={check_id:typeof id==='string' ? id : 'unavailable',now,private_expires_at:now,
    product:{id:'unavailable',category_id:'unavailable',brand:'',model:'',manufacturer_model_id:null,aliases:[]},
    variant:{product_id:'unavailable',config_version:'unavailable',attributes:{},condition:'NEW_SEALED',used_grade:null,city:null},
    config:{id:'unavailable',version:'unavailable',label_key:'unavailable',attributes:[],condition_values:[],used_grade_values:[],environment:'PRODUCTION',approval_status:'PENDING'},
    candidates:[],asking_price:null};
  const result=errorResult(input,apiError(code,status,key));
  return freeze({result,snapshot:{input,branches:[],selected_pta:null,classification_version:1,asking_price:null,asking_acknowledgement:null,result,replays:{}}});
}
/** Safe error projection for other config-ingress boundaries; never raw policy data. */
export const configurationFailureEvaluation=(metadata:unknown):Evaluation=>ingressFailure(metadata,'CONFIGURATION_REQUIRED',503,'configuration.required');
export function evaluateCheck(raw: CheckInput): Evaluation {
  // Technical asking Money wins without touching config, including hostile accessors.
  const asking=ownData(raw,'asking_price');
  try {if(asking!==null && !isStrictMoney(asking)) return ingressFailure(raw,'INVALID_ASKING_PRICE',422,'price.invalid');}
  catch {return ingressFailure(raw,'INVALID_ASKING_PRICE',422,'price.invalid');}
  const config=loadCategoryConfig(ownData(raw,'config'));
  if(!config) return ingressFailure(raw,'CONFIGURATION_REQUIRED',503,'configuration.required');
  let input:CheckInput;
  try {
    // Never enumerate/read the original config during copying. The loader checked raw
    // descriptors/schema before producing a detached, deeply frozen policy.
    input={...copy(Object.fromEntries(Reflect.ownKeys(raw).filter((k):k is string=>typeof k==='string' && k!=='config').map(k=>[k,ownData(raw,k)]))),config} as CheckInput;
  } catch {return ingressFailure(raw,'CONFIGURATION_REQUIRED',503,'configuration.required');}
  const now=timestamp(input.now),expiry=timestamp(input.private_expires_at);
  let branches: StoredBranch[] = [];
  let selected_pta: CheckSnapshot['selected_pta'] = null;
  let result: CheckResult;
  if (input.operational_error) result = errorResult(input, input.operational_error); // operational precedence
  else if (now === null || expiry === null || expiry < now || !input.check_id || input.config.id !== input.product.category_id ||
    input.product.id !== input.variant.product_id) {
    result = errorResult(input, apiError('INVALID_REQUEST', 400));
  } else if (['OTHER', 'OPEN_BOX', 'KIT', 'REFURBISHED', 'REPAIRED'].includes(input.variant.condition as string)) {
    result = errorResult(input, apiError('CONDITION_NOT_SUPPORTED', 422, 'condition.not_supported'));
  } else {
    // API v0.3: fixed retention from creation; never extended by classify/replay.
    input.private_expires_at = new Date(Math.min(expiry, now + PRIVATE_CHECK_TTL_MS)).toISOString();
    const hasPta = input.config.attributes.some(a => a.key === 'pta_status' && a.unknown_policy === 'BRANCH');
    const pta = input.variant.attributes.pta_status;
    const split = hasPta && (pta === undefined || pta === null || pta === '' || pta === 'NOT_SURE');
    selected_pta = hasPta && (pta === 'APPROVED' || pta === 'NON_PTA') ? pta : null;
    const statuses = split ? ['APPROVED', 'NON_PTA'] as const : [selected_pta];
    try {
    const bounds = configuredPriceBounds(input.config);
    if (input.asking_price_confirmed !== undefined && typeof input.asking_price_confirmed !== 'boolean') throw new RangeError('INVALID_FLAG');
    const priceError = askingBoundsError(input.asking_price, bounds, input.asking_price_confirmed === true);
    if (priceError) {
      const error = priceError;
      const result = errorResult(input, error);
      return freeze({ result, snapshot: { input, branches, selected_pta, classification_version: 1, asking_price: input.asking_price, asking_acknowledgement: input.asking_price_confirmed === true ? bindAskingAcknowledgement(input.asking_price, input.product, input.config) : null, result, replays: {} } });
    }
    branches = statuses.map(status => {
      const variant = status ? { ...input.variant, attributes: { ...input.variant.attributes, pta_status: status } } : input.variant;
      const evaluate = (condition: Variant['condition']): PoolEvaluation => evaluatePool({ target: variant,
        config: input.config, candidates: input.candidates, condition, now, ptaUnconfirmed: split,
        ...(input.geographicUnverified === undefined ? {} : { geographicUnverified: input.geographicUnverified }) });
      const new_market = evaluate('NEW_SEALED'), used_market = evaluate('USED');
      return { pta_status: status, variant, new_market, used_market, selected: variant.condition === 'USED' ? used_market : new_market };
    });
    result = render(input, branches, selected_pta, input.asking_price, 1, input.now); }
    catch (e) {
      if (e instanceof ConfigurationRequiredError) result = errorResult(input, apiError('CONFIGURATION_REQUIRED', 503, 'configuration.required'));
      else if (e instanceof PriceOutputOverflowError) result = errorResult(input, apiError('PRICE_OUTPUT_OVERFLOW', 500, 'price.output_overflow'));
      else if (e instanceof RangeError) result = errorResult(input, apiError('INVALID_REQUEST', 400));
      else throw e;
    }
  }
  return freeze({ result, snapshot: { input, branches, selected_pta, classification_version: 1, asking_price: input.asking_price, asking_acknowledgement: input.asking_price_confirmed === true ? bindAskingAcknowledgement(input.asking_price, input.product, input.config) : null, result, replays: {} } });
}
export type ClassifyRequest = { asking_price?: Money | null; asking_price_confirmed?: boolean; pta_status?: 'APPROVED' | 'NON_PTA' };
export type ClassifyContext = { now: string; expected_version: number; idempotency_key: string;
  evidence_valid: boolean; capability_valid: boolean; resource_known: boolean };
export type ClassifyOutcome = { ok: true; result: CheckResult; snapshot: CheckSnapshot; replayed: boolean } |
  { ok: false; error: ApiError };
/** Pure classify transition. Caller atomically persists snapshot/replay ledger with version CAS.
 * No provider callbacks or adapters exist here; refresh requires an explicit evaluateCheck. */
export function classify(snapshot: CheckSnapshot, request: ClassifyRequest, context: ClassifyContext): ClassifyOutcome {
  const fail = (code: string, status: number): ClassifyOutcome => ({ ok: false, error: apiError(code, status,
    code === 'INVALID_ASKING_PRICE' ? 'price.invalid' : code === 'CLASSIFICATION_INPUT_REQUIRED' ? 'classify.input_required' :
    code === 'INVALID_PTA_STATUS' ? 'classify.pta_invalid' : `classify.${code.toLowerCase()}`) });
  if (!context.resource_known || !context.capability_valid) return fail('CHECK_NOT_FOUND', 404);
  const now = timestamp(context.now);
  if (now === null || !context.idempotency_key || context.idempotency_key === '__proto__' || !Number.isInteger(context.expected_version)) return fail('INVALID_REQUEST', 400);
  const storedInput=ownData(snapshot,'input');
  const privateExpiry=timestamp(ownData(storedInput,'private_expires_at'));
  if (privateExpiry!==null && now>=privateExpiry) return fail('CHECK_EXPIRED',410);
  if (Object.keys(request).some(k => k !== 'asking_price' && k !== 'asking_price_confirmed' && k !== 'pta_status')) return fail('VARIANT_CHANGE_REQUIRES_CHECK', 422);
  const hasPrice = Object.hasOwn(request, 'asking_price'), hasPtaField = Object.hasOwn(request, 'pta_status');
  if (Object.hasOwn(request, 'asking_price_confirmed') && typeof request.asking_price_confirmed !== 'boolean') return fail('INVALID_REQUEST', 400);
  if (!hasPrice && !hasPtaField) return fail('CLASSIFICATION_INPUT_REQUIRED', 422);
  if (hasPtaField && !['APPROVED', 'NON_PTA'].includes(request.pta_status as string)) return fail('INVALID_PTA_STATUS', 422);
  if (hasPrice && request.asking_price !== null && !isStrictMoney(request.asking_price)) return fail('INVALID_ASKING_PRICE', 422);
  const config=loadCategoryConfig(ownData(storedInput,'config'));
  if(!config) return {ok:false,error:apiError('CONFIGURATION_REQUIRED',503,'configuration.required')};
  if(privateExpiry===null || now<timestamp(ownData(storedInput,'now'))!) return fail('INVALID_REQUEST',400);
  snapshot={...snapshot,input:{...storedInput as CheckInput,config}};
  const hasPta = config.attributes.some(a => a.key === 'pta_status' && a.unknown_policy === 'BRANCH');
  if (!hasPta && hasPtaField) return fail('VARIANT_CHANGE_REQUIRES_CHECK', 422);
  const pta = request.pta_status ?? snapshot.selected_pta;
  if (hasPta && !pta) return fail('PTA_SELECTION_REQUIRED', 422);
  const branch = snapshot.branches.find(b => b.pta_status === pta);
  if (branch?.selected.pool && now > branch.selected.valid_until!) return fail('RANGE_STALE', 409);
  if (!context.evidence_valid) return fail('RANGE_STALE', 409);
  const fingerprint = JSON.stringify([hasPrice, hasPrice ? request.asking_price?.amount_minor ?? null : null, hasPtaField, request.pta_status ?? null, context.expected_version, Object.hasOwn(request, 'asking_price_confirmed'), request.asking_price_confirmed ?? null]);
  const previous = Object.hasOwn(snapshot.replays, context.idempotency_key) ? snapshot.replays[context.idempotency_key] : undefined;
  if (previous) return previous.fingerprint === fingerprint ? { ok: true, result: previous.result, snapshot, replayed: true } : { ok: false, error: apiError('IDEMPOTENCY_CONFLICT', 409, 'request.idempotency_conflict') };
  if (context.expected_version !== snapshot.classification_version) return fail('VERSION_CONFLICT', 409);
  const asking = hasPrice ? request.asking_price! : snapshot.asking_price;
  let bounds: { min: number; max: number };
  try { bounds = configuredPriceBounds(snapshot.input.config, 'NEW_SEALED'); configuredPriceBounds(snapshot.input.config, 'USED'); } catch { return { ok: false, error: apiError('CONFIGURATION_REQUIRED', 503, 'configuration.required') }; }
  const acknowledged = Object.hasOwn(request, 'asking_price_confirmed') ? request.asking_price_confirmed === true :
    sameAskingAcknowledgement(snapshot.asking_acknowledgement, asking, snapshot.input.product, snapshot.input.config);
  const priceError = askingBoundsError(asking, bounds, acknowledged);
  if (priceError) return { ok: false, error: priceError };
  const acknowledgement = acknowledged ? bindAskingAcknowledgement(asking, snapshot.input.product, snapshot.input.config) : null;
  let result: CheckResult = branch ? render(snapshot.input, snapshot.branches, pta, asking, snapshot.classification_version + 1, context.now) : {
    ...base(snapshot.input, snapshot.classification_version + 1, context.now, null, pta), result_state: 'INSUFFICIENT_DATA',
    error: null, data: null, confidence: none(), low_confidence_modifier: false, insufficient_reasons: ['NO_STORED_RANGE'],
    evidence: { retrieved_count: 0, included_count: 0, used_condition_included_count: 0, excluded_count: 0, excluded_by_reason: [],
      new_pool_count: 0, used_pool_count: 0, independent_sources: 0, evidence_total_included: 0, evidence_truncated: false, evidence_newest_effective_at: null, observations: [] } };
  // spec v0.1 §11/API v0.5 explicitly supersede the old422 for RETAINED insufficient branches.
  if (branch && !branch.selected.pool && result.result_state === 'INSUFFICIENT_DATA') result = { ...result,
    insufficient_reasons: ['NO_STORED_RANGE', ...result.insufficient_reasons.filter(r => r !== 'NO_STORED_RANGE')],
    evidence: suppressEvidenceRows(branch.selected.evidence) };
  const next = { ...snapshot, selected_pta: pta, asking_price: asking, asking_acknowledgement: acknowledgement, classification_version: snapshot.classification_version + 1, result,
    replays: { ...snapshot.replays, [context.idempotency_key]: { fingerprint, result } } };
  return freeze({ ok: true, result, snapshot: next, replayed: false });
}
