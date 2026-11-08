# Revised Day 1 CTO assessment — Chief of Staff
**9 Nov 2026 PKT · Proposed G1/G2 decisions; no signup, spend, push or implementation claimed**

Reviewed PRD v0.2 and the full UI/UX state inventory. Updated methodology, API, ADR, source-policy reconciliation and foundations; detailed PM amendments are in `07-prd-reconciliation.md`.

## 1. Result states, confidence and PTA
Adopt **ERROR → INSUFFICIENT_DATA → RANGE_AVAILABLE** precedence. Error is operational, outside the market verdict enum. Low confidence modifies any range layout, including no-price results; it never overrides insufficient evidence.

**LOW 0–49; MEDIUM 50–79; HIGH 80–100**, inclusive integer scores. Insufficient is not “below Low”: it means fewer than three eligible independent comparables or another failed identity/permission/freshness/spread gate; confidence is NONE/null. Three–four comparables or one independent source caps49; normal confidence requires five-plus and two underlying independent source owners. The weighted score is not calibrated probability.

**Missing PTA does not block Check.** Ask Approved/Non-PTA/Not sure; skipped means Not sure. Search the two known-PTA pools separately; never mix their prices or counts. Each branch independently needs three comparables and all gates. Two-plus-two is insufficient. If one/both qualify, show labelled exploratory ranges, forced LOW/cap49 with PTA_UNCONFIRMED; no global verdict until PTA is selected. This safely refines Design’s “widen matching” assumption. Other critical attributes remain confirmation-gated.

Pricing otherwise unchanged: median anchor; min–max for n3–4, P10–P90 for n≥5; IQR filtering only n≥8; 14-day new/30-day used expiry; separate condition/variant pools; Fair−15% through+10%, High above+10%, Unusually Low below−15% with caution. Thresholds remain provisional.

## 2. Complete API/UX contract
The revised discriminated response includes state, confidence/reasons, branch counts/exclusions, nullable price pools and per-source provenance. The extraction/catalogue error table specifies **code, HTTP status, retryable flag and ICU key**; async jobs preserve semantic error status inside a200 polling response. Successful multiple-product/no-price extraction and200 empty catalogue results are distinct from errors.

Every inventory row is mapped: upload validation/privacy/preview, unreadable versus no text, candidates/category/price, clipboard failure, all link failures, short/empty/unavailable search, confirmation, real progress/long/cancel, offline replay, all result/confidence states, local dated Recent, native-share success/cancel/failure, copy/download failure and invalid public snapshots. Offline retry preserves inputs/idempotency; no duplicate paid operation. Snapshot creation precedes PNG rendering, so image failure retains Copy link; snapshot failure cannot invent a URL.

Added **POST /checks/{id}/classify**: positive asking price plus optional confirmed PTA; capability/version/idempotency required. Reuses stored median/evidence, no OCR/LLM/source calls. Reject409 RANGE_STALE past earliest observation’s14/30-day or contractual expiry; reject invalidated policy/config. No silent refresh/spend. Evidence dates/expiry and existing public snapshots remain unchanged.

## 3. Source policy and PRD correction
**No external market integration is enabled.** Statuses below describe launch policy, not implemented connectors. Conditional means clearance still required, not permission to collect now. Evidence URLs/quotes/retrieval dates remain in the source matrix.

| Source | Status | Reason |
|---|---|---|
| OLX website/API | Excluded | Explicit extraction/aggregation restriction absent licence |
| Daraz storefront | Excluded | Robots/data-mining/commercial collection prohibition |
| Daraz Open Platform | Conditional | Official API; authorised scope/display rights unverified |
| Daraz affiliate | Partnership target | Programme exists; comparison feed not verified |
| PriceOye | Partnership target | Bot restrictions; substantive reuse terms unresolved |
| Samsung PK | Partnership target | Personal-use/no-licence framing |
| Apple website | Excluded | Automated acquisition restriction |
| Mercantile/local Apple channel | Partnership target | Policy endpoints404; reseller/data authority unverified |
| Xiaomi/MiStore | Excluded | Unlicensed automation/republication restricted |
| Infinix | Partnership target | Terms shell, no verified commercial grant |
| Tecno | Partnership target | Device-software terms not website-data permission |
| Mega.pk | Partnership target | Robots permissive; commercial licence unverified |
| iShopping | Partnership target | Warranty terms checked; no reuse grant |
| Telemart/Telex | Excluded | Redirect observed; commercial/third-party use restricted |
| Games & Gears | Partnership target | Policy requests failed; coverage unverified |
| Czone | Partnership target |403 policy access; no clearance |
| Google Shopping website | Excluded | Crawl restrictions |
| Google Merchant API | Excluded for market search | Merchant-management API, not universal comparison feed |
| SerpAPI | Conditional | Service contract does not clear downstream rights |
| Serper | Conditional | Third-party content rights remain required |
| WhatMobile | Conditional manual reference | Not verified retail/feed permission |
| Hamariweb | Conditional manual reference | Retrieval signals not price-redistribution licence |
| Mobilemall | Partnership target | Policy fetches403; no clearance |
| Own/rights-cleared ad image | Conditional target input | Private extraction only; never own benchmark |
| OLX/Daraz/third-party screenshots | Conditional, disabled pending legal review | Consent/EXIF/retention alone insufficient |
| Permissioned retailer export/direct quote | Conditional preferred source | Written rights/provenance not yet obtained |

Keep **NOT_PERMITTED403** for OLX/Daraz links, no fetch; **SOURCE_NOT_SUPPORTED422** for unimplemented/unclear sources. PRD F2/US9 must distinguish them. PRD’s blanket approval of platform screenshots must change: legal-review gate before automated extraction, manual facts meanwhile. This is conservative launch policy, not a universal legal conclusion about screenshot analysis.

## 4. Architecture, foundations, costs and decisions
Keep modular monolith: React/Vite+Hono on one Worker, Supabase Free; browser Tesseract, optional approved paid Gemini fallback. LLMs never create market prices. Separate app repo preferred; HQ/app fallback protects Day3. Engineer can prepare pure domain/tests, disabled adapters, schemas, CI/secret/privacy scaffolding and new state/classify tests; nothing tested here.

At1,000 model calls/month with assumed3,000 input/500 output tokens: Gemini **$2.15**, Worker/Supabase **$0 target**, Worker contingency **$5**; proposed **$15 capped envelope** needs Founder approval. Alternatives: OpenAI$2; Vision first1,000 OCR units free; Vercel$20+, Supabase Pro$25; SerpAPI$25/1k monthly; Serper$50 prepaid50k/6months; licences TBD. Official fetched rates/limits remain in cost register; alternatives not automatically additive.

Founder decisions: source rights/coverage, PTA/taxonomy, vendor/budget and Security retention approval. Proposed image request-only processing,24h temporary fields and30-day sanitised shares are not approved privacy promises. G1 **10 Nov**, build **11 Nov**, G2 **12 Nov**, launch **22 Nov 2026 PKT** unchanged. Missing permitted evidence at G2 requires explicit scope escalation, never prohibited scraping.
