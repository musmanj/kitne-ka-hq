import type { ComparableCandidate, Listing, PriceObservation, Product, Variant } from '../domain/types';
export type SourcePolicy = { source_id: string; enabled: boolean; kill_switch: boolean;
  permission_record_id: string | null; allowed_methods: readonly string[]; allowed_fields: readonly string[];
  rate_cap_per_minute: number; licence_cache_limit_seconds: number; expires_at: string | null };
export interface SourceAdapter {
  readonly source_id: string;
  collect(query: { product: Product; variant: Variant }, context: { now: string; policy: SourcePolicy }): Promise<readonly ComparableCandidate[]>;
}
/** No implementations, imports, HTTP clients, discovery or fallback fetches. */
export const SOURCE_POLICIES: readonly Readonly<SourcePolicy>[] = Object.freeze(
  ['olx', 'daraz-storefront', 'daraz-open-platform', 'priceoye', 'permissioned-retailer'].map(source_id => Object.freeze({
    source_id, enabled: false, kill_switch: true, permission_record_id: null,
    allowed_methods: Object.freeze([]), allowed_fields: Object.freeze([]),
    rate_cap_per_minute: 0, licence_cache_limit_seconds: 0, expires_at: null
  })));
/** spec v0.1 §2: explicit join; all verification comes from trusted ingestion, not user facts. */
export function candidateFromListing(listing: Listing, observation: PriceObservation,
  metadata: Pick<ComparableCandidate, 'variantMatch' | 'comparable' | 'rightsVerified' | 'canonicalListingId' | 'targetListing' | 'verification' | 'evidence_hash'>): ComparableCandidate {
  if (listing.id !== observation.listing_id || listing.advertised_price.currency !== observation.price.currency ||
      listing.advertised_price.amount_minor !== observation.price.amount_minor || listing.source.source_id !== observation.provenance_ref) throw new Error('Listing/observation mismatch');
  return { observation, listing_id: listing.id, canonicalListingId: metadata.canonicalListingId,
    sellerOwnerId: listing.seller_independence_group, inStock: listing.availability === 'IN_STOCK', city: listing.variant.city,
    variant: listing.variant, source: listing.source, source_ref: observation.provenance_ref,
    rights_status: metadata.rightsVerified ? 'PERMITTED' : 'UNVERIFIED', price_basis: 'FULL_CASH_TAX_INCLUSIVE',
    variantMatch: metadata.variantMatch, comparable: metadata.comparable, rightsVerified: metadata.rightsVerified,
    targetListing: metadata.targetListing, verification: metadata.verification, evidence_hash: metadata.evidence_hash };
}
