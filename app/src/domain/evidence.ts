import { INLINE_EVIDENCE_LIMIT } from './policy';
import type { CategoryConfig, EvidenceObservation, EvidenceSummary } from './types';
import type { Included } from './pricing';
const ordinal = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
/** API v0.7 R3: display permission is independent of evidence admission. Empty by default.
 * Registry supplies exact source_id+URL entries after host/path/display-rights review. */
export type MerchantLinkApproval = Readonly<{ source_id: string; url: string; display_rights: true }>;
export const APPROVED_MERCHANT_LINKS: readonly MerchantLinkApproval[] = Object.freeze([]);
export function publicMerchantUrl(value: string | null, approvals: readonly MerchantLinkApproval[] = APPROVED_MERCHANT_LINKS, sourceId = ''): string | null {
  return value !== null && /^https:\/\/[^/@?#\\\s]+(?:\/[^?#\\\s]*)?$/.test(value) &&
    approvals.some(a => a.display_rights === true && a.source_id === sourceId && a.url === value) ? value : null;
}
/** API v0.5: build a safe projection, never spread internal provenance/owner records. */
export function evidenceRows(included: Included[], config: CategoryConfig): EvidenceObservation[] {
  return [...included].sort((a, b) => b.candidate.variantMatch.quality - a.candidate.variantMatch.quality ||
    Date.parse(b.candidate.observation.retrieved_at) - Date.parse(a.candidate.observation.retrieved_at) ||
    ordinal(a.candidate.source.source_id, b.candidate.source.source_id) || ordinal(a.candidate.observation.id, b.candidate.observation.id))
    .slice(0, INLINE_EVIDENCE_LIMIT).map(({ candidate: c }) => ({ observation_id: c.observation.id,
      price: { ...c.observation.price }, match_quality: c.variantMatch.quality,
      variant: { product_id: c.variant.product_id, config_version: c.variant.config_version,
        attributes: Object.fromEntries(config.attributes.filter(a => Object.hasOwn(c.variant.attributes, a.key)).map(a => [a.key, c.variant.attributes[a.key]!])),
        condition: c.variant.condition, used_grade: c.variant.used_grade, city: c.city },
      source: { source_id: c.source.source_id, source_name: c.source.source_name, url: publicMerchantUrl(c.source.url),
        observed_at: c.observation.observed_at, source_updated_at: c.observation.source_updated_at, retrieved_at: c.observation.retrieved_at } }));
}
export function evidenceMetadata(included: Included[], now: number) {
  return { evidence_total_included: included.length, evidence_truncated: included.length > INLINE_EVIDENCE_LIMIT,
    evidence_newest_effective_at: included.length ? new Date(Math.min(now, Math.max(...included.map(x => x.effective_at)))).toISOString() : null };
}
/** Insufficient UI never receives even eligible price rows; counts are not price estimates. */
export const suppressEvidenceRows = (e: EvidenceSummary): EvidenceSummary => ({ ...e, observations: [], evidence_truncated: false });
