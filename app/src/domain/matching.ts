import type { AttributeValue, CategoryConfig, Condition, Variant, VariantMatch } from './types';
const unknown = (v: AttributeValue | undefined): boolean => v === undefined || v === null || v === '' || v === 'UNKNOWN' || v === 'NOT_SURE';
export function required(a: CategoryConfig['attributes'][number], v: Variant, condition: Condition): boolean {
  return a.required_for_assessment && (!a.required_when || Object.entries(a.required_when).every(([k, x]) =>
    (k === 'condition' ? condition : k === 'used_grade' ? v.used_grade : v.attributes[k]) === x));
}
function valid(a: CategoryConfig['attributes'][number], x: AttributeValue | undefined): boolean {
  if (unknown(x)) return false;
  if (a.type === 'integer') return typeof x === 'number' && Number.isSafeInteger(x) && x >= 0;
  if (a.type === 'boolean') return typeof x === 'boolean';
  return typeof x === 'string' && x.trim() !== '' && (!a.enum_values || a.enum_values.includes(x));
}
export function identityConfirmed(v: Variant, config: CategoryConfig, condition = v.condition): boolean {
  return !!v.product_id && v.config_version === config.version && config.condition_values.includes(condition) &&
    Object.keys(v.attributes).every(k => config.attributes.some(a => a.key === k)) &&
    (condition !== 'USED' || (v.used_grade !== null && config.used_grade_values.includes(v.used_grade))) &&
    config.attributes.every(a => !required(a, v, condition) ||
      (a.unknown_policy === 'BRANCH' && a.key === 'pta_status' && unknown(v.attributes[a.key])) || valid(a, v.attributes[a.key]));
}
/** Exact confirmed canonical attributes only. Alias review belongs upstream; no fuzzy matching. */
export function matchVariant(target: Variant, candidate: Variant, config: CategoryConfig, condition = target.condition): VariantMatch {
  const fail = (reason: 'VARIANT_MISMATCH' | 'CONDITION_MISMATCH' | 'UNKNOWN_CRITICAL_ATTRIBUTE'): VariantMatch => ({ matched: false, exclusion_reason: reason, quality: 0 });
  // v0.1 §5: critical unknowns precede condition and variant mismatches.
  for (const a of config.attributes) {
    if (!a.hard_match || (a.required_when && !required(a, target, condition))) continue;
    if (!valid(a, candidate.attributes[a.key]) || !valid(a, target.attributes[a.key]) ||
      unknown(candidate.attributes[a.key]) || unknown(target.attributes[a.key])) return fail('UNKNOWN_CRITICAL_ATTRIBUTE');
  }
  if (condition === 'USED' && (!candidate.used_grade || !target.used_grade ||
    !config.used_grade_values.includes(candidate.used_grade))) return fail('UNKNOWN_CRITICAL_ATTRIBUTE');
  if (candidate.condition !== condition || (condition === 'USED' && candidate.used_grade !== target.used_grade)) return fail('CONDITION_MISMATCH');
  if (candidate.product_id !== target.product_id || candidate.config_version !== config.version || target.config_version !== config.version) return fail('VARIANT_MISMATCH');
  for (const a of config.attributes) {
    if (a.hard_match && (!a.required_when || required(a, target, condition)) && target.attributes[a.key] !== candidate.attributes[a.key]) return fail('VARIANT_MISMATCH');
  }
  return { matched: true, exclusion_reason: null, quality: 1 };
}
