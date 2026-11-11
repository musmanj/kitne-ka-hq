import { loadCategoryConfigs, ownData } from '../domain/policy-validation';
import { isStrictMoney } from '../domain/money-validation';
import { canonicalId, canonicalJson, isRecord, onlyKeys, utf8Bytes, validDigest, type CanonicalHmac } from '../domain/canonical';
import { apiError } from '../domain/checks';
import { identityConfirmed, required } from '../domain/matching';
import { utc } from '../domain/retention';
import type { ApiError, AttributeValue, CategoryConfig, Money, Product, Variant } from '../domain/types';
export type ConfirmationRecord = { schema_version: 1; field_paths: string[]; confirmed_at: string;
  category_config_version: string; notice_version: string; canonical_fields_digest: string };
export type CanonicalRegistry = { products: readonly Product[]; configs: readonly CategoryConfig[]; city_ids: readonly string[]; extraction_ids?: readonly string[] };
export type ConfirmedAssessment = { product: Product; variant: Variant; asking_price: Money | null; asking_price_confirmed?: boolean; confirmation_record: ConfirmationRecord };
export type ConfirmationOutcome = { ok: true; value: ConfirmedAssessment } | { ok: false; error: ApiError };
/** API v0.7 R6/C6. Existing ROOT confirmed_fields, independently validated canonical facts.
 * No raw text, client labels, URLs, generic trust boolean or image request shape. */
export function validateAssessmentRequest(raw: unknown, registry: CanonicalRegistry,
  context: { now: string; notice_version: string; hmac: CanonicalHmac }): ConfirmationOutcome {
  const fail = (code: string, status: number, key: string): ConfirmationOutcome => ({ ok: false, error: apiError(code, status, key) });
  const malformed = () => fail('DISALLOWED_INPUT_FIELD', 400, 'request.disallowed_field');
  const invalid = () => fail('INVALID_CANONICAL_VALUE', 422, 'input.canonical');
  try {
    if (!isRecord(raw) || !onlyKeys(raw, ['extraction_id', 'product_id', 'variant', 'asking_price', 'asking_price_confirmed', 'confirmed_fields'])) return malformed();
    if(Object.hasOwn(raw,'asking_price') && raw.asking_price!==null && !isStrictMoney(raw.asking_price)) return fail('INVALID_ASKING_PRICE',422,'price.invalid');
    const configs=loadCategoryConfigs(ownData(registry,'configs'));
    if(!configs) return fail('CONFIGURATION_REQUIRED',503,'configuration.required');
    if(utf8Bytes(canonicalJson(raw))>65536) return malformed();
    if (Object.hasOwn(raw, 'asking_price_confirmed') && typeof raw.asking_price_confirmed !== 'boolean') return fail('INVALID_REQUEST', 400, 'request.invalid');
    if (isRecord(raw.variant) && ['OTHER', 'OPEN_BOX', 'KIT', 'REFURBISHED', 'REPAIRED'].includes(raw.variant.condition as string)) return fail('CONDITION_NOT_SUPPORTED', 422, 'condition.not_supported');
    if (!canonicalId(raw.product_id) || !isRecord(raw.variant) || !Array.isArray(raw.confirmed_fields) || raw.confirmed_fields.some(p => typeof p !== 'string')) return malformed();
    if (Object.hasOwn(raw, 'extraction_id') && (!canonicalId(raw.extraction_id) || !registry.extraction_ids?.includes(raw.extraction_id))) return invalid();
    const product = registry.products.find(p => p.id === raw.product_id), v = raw.variant;
    if (!product || !onlyKeys(v, ['product_id', 'config_version', 'attributes', 'condition', 'used_grade', 'city']) || !isRecord(v.attributes)) return malformed();
    const config = configs.find(c => c.id === product.category_id && c.version === v.config_version);
    if (!config || (v.product_id !== undefined && v.product_id !== product.id) || !['NEW_SEALED', 'USED'].includes(v.condition as string)) return invalid();
    if (v.used_grade !== undefined && v.used_grade !== null && !config.used_grade_values.includes(v.used_grade as never)) return invalid();
    if (v.city !== undefined && v.city !== null && (!canonicalId(v.city) || !registry.city_ids.includes(v.city))) return invalid();
    const attrs: Record<string, AttributeValue> = {};
    for (const [key, value] of Object.entries(v.attributes)) {
      const attr = config.attributes.find(a => a.key === key); if (!attr) return malformed();
      if (value === null && attr.nullable) { attrs[key] = null; continue; }
      if (attr.type === 'text') return invalid(); // v0.6 prohibits generic free-text specs
      if (attr.type === 'enum' && (typeof value !== 'string' || !canonicalId(value) || !attr.enum_values?.includes(value))) return invalid();
      if (attr.type === 'integer' && (typeof value !== 'number' || !Number.isSafeInteger(value) || attr.min === undefined || attr.max === undefined || value < attr.min || value > attr.max)) return invalid();
      if (attr.type === 'boolean' && typeof value !== 'boolean') return invalid();
      attrs[key] = value as AttributeValue;
    }
    const supplied = ['product_id', 'variant.config_version', 'variant.condition',
      ...['product_id', 'used_grade', 'city'].filter(k => Object.hasOwn(v, k)).map(k => `variant.${k}`),
      ...Object.keys(v.attributes).map(k => `variant.attributes.${k}`),
      ...(Object.hasOwn(raw, 'asking_price') ? ['asking_price'] : []), ...(Object.hasOwn(raw, 'asking_price_confirmed') ? ['asking_price_confirmed'] : []), ...(Object.hasOwn(raw, 'extraction_id') ? ['extraction_id'] : [])];
    if (config.attributes.some(a => a.key === 'pta_status' && a.unknown_policy === 'BRANCH') && !Object.hasOwn(attrs, 'pta_status')) attrs.pta_status = 'NOT_SURE';
    const variant: Variant = { product_id: product.id, config_version: config.version, attributes: attrs,
      condition: v.condition as Variant['condition'], used_grade: (v.used_grade ?? null) as Variant['used_grade'], city: (v.city ?? null) as string | null };
    if (!identityConfirmed(variant, config)) return fail('CONFIRMATION_REQUIRED', 422, 'check.confirm_fields');
    let asking_price: Money | null = null;
    if (Object.hasOwn(raw, 'asking_price') && raw.asking_price !== null) {
      if (!isStrictMoney(raw.asking_price)) return fail('INVALID_ASKING_PRICE', 422, 'price.invalid');
      asking_price = { amount_minor: raw.asking_price.amount_minor, currency: 'PKR' };
    }
    // Explicit finite list of aliases; aliases resolving to the same path are duplicates.
    const aliases: Record<string, string> = { condition: 'variant.condition', used_grade: 'variant.used_grade', city: 'variant.city',
      ...Object.fromEntries(config.attributes.map(a => [a.key, `variant.attributes.${a.key}`])) };
    const known = new Set(['extraction_id', 'product_id', 'asking_price', 'asking_price_confirmed', 'variant.product_id', 'variant.config_version', 'variant.condition', 'variant.used_grade', 'variant.city', ...config.attributes.map(a => `variant.attributes.${a.key}`)]);
    const paths = (raw.confirmed_fields as string[]).map(p => Object.hasOwn(aliases, p) ? aliases[p]! : p);
    if (paths.some(p => !known.has(p)) || new Set(paths).size !== paths.length || paths.some(p => !supplied.includes(p))) return malformed();
    const requiredPaths = ['product_id', 'variant.condition', ...(variant.condition === 'USED' ? ['variant.used_grade'] : []),
      ...config.attributes.filter(a => required(a, variant, variant.condition) && a.key !== 'pta_status').map(a => `variant.attributes.${a.key}`)];
    if ([...supplied, ...requiredPaths].some(p => !paths.includes(p))) return fail('CONFIRMATION_REQUIRED', 422, 'check.confirm_fields');
    if (!canonicalId(context.notice_version)) return invalid();
    const canonical = canonicalJson({ product_id: product.id, variant, asking_price, ...(Object.hasOwn(raw, 'asking_price_confirmed') ? { asking_price_confirmed: raw.asking_price_confirmed } : {}) });
    let digest: string;
    try { digest = context.hmac.digest(canonical); } catch { return fail('SERVICE_UNAVAILABLE', 503, 'check.unavailable'); }
    if (!validDigest(digest)) return fail('SERVICE_UNAVAILABLE', 503, 'check.unavailable');
    return { ok: true, value: { product: { ...product, aliases: [...product.aliases] }, variant, asking_price, ...(Object.hasOwn(raw, 'asking_price_confirmed') ? { asking_price_confirmed: raw.asking_price_confirmed as boolean } : {}),
      confirmation_record: { schema_version: 1, field_paths: paths.sort(), confirmed_at: utc(context.now), category_config_version: config.version,
        notice_version: context.notice_version, canonical_fields_digest: digest } } };
  } catch { return malformed(); } // fixed codes only; never echo rejected data or exceptions
}
