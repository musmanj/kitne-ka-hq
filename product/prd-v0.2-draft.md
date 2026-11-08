# PRD v0.2.2: Kitne Ka MVP (draft)
Owner: PM · Reviewers: CTO, Design Director, QA · **Status: Proposed** · Date: Mon 9 Nov 2026 (Day 1) · Target: G1 on 10 Nov

## Changelog
- **v0.2.2 (9 Nov 2026):**
  - CTO confirmed F1 as written. The OCR pipeline and tests stay in the build behind a **server-side flag, OFF for third-party images**, so enabling it is a config change only.
  - Added Q0b: on-device OCR for user-captured images.
  - Added Q1: retailer outreach, a critical-path G1 decision.
  - Added the phones-only scope fallback (agreed with CTO).
  - Reframed "Insufficient market data" as the honest default state, with UX copy expectations.
- **v0.2.1 (9 Nov 2026):** reconciled with CTO methodology v0 (`/workspace/kitne-ka/cto/00-summary.md`, `02-pricing-methodology-v0.md`, `03-api-contract-v0.md`, `07-prd-reconciliation.md`). Changes:
  - link reason codes: NOT_PERMITTED 403 vs SOURCE_NOT_SUPPORTED 422
  - screenshot rights gate; **F1 third-party extraction BLOCKED**
  - PTA is non-blocking, with split pools
  - confidence bands and the Insufficient gate
  - result-state precedence
  - classify endpoint
  - error contracts
  - condition mapping fix
  - privacy and retention reconciled
  - snapshot-first Share/Recent
  - seed-data rights and provenance
  - consolidated source statuses
  - The previous v0.2 is at `/tmp/prd-v0.2-pre-reconcile.md`.
- v0.2 (9 Nov 2026): first draft.

Inputs: Founder brief (`/workspace/kitne-ka/founder-product-brief-2026-11-09.md`); CTO Day 1 pack (`/workspace/kitne-ka/cto/`); repo musmanj/kitne-ka-hq (read-only).
Rule: we have no user research, interviews or baselines. Every figure without a source is an ASSUMPTION. All CTO thresholds are provisional and not yet calibrated.

## 1. Problem
Buyers and sellers in Pakistan see prices on WhatsApp Status, OLX and social posts, and there's no quick, evidence-backed way to tell whether a price is fair. The variants are confusing (storage/RAM, PTA/non-PTA, new/used/open-box), and prices are written in mixed notation ("1.2 lac", "85k"). Kitne Ka returns a sourced PKR asking-market range with a verdict, or says honestly that there's insufficient data.

## 2. Personas (ASSUMPTION, not validated)
- **P1 Buyer "Ali"** (primary): sees a phone or laptop on WhatsApp Status or OLX and wants to know whether the price is fair before messaging the seller.
- **P2 Casual seller "Sana"** (secondary): wants a defensible asking price. Same flow as the buyer. Her *own* ad image is a conditional input (see F1).
- Out of MVP: dealers and bulk pricing.

## ⚠ PM FLAG: F1 headline value is BLOCKED (G1 decision, see Q0)
The brief's headline use case is verifying screenshots of WhatsApp Status, OLX and social listings. Under CTO policy (`00-summary.md` §3, `03-api-contract-v0.md` screenshot rights, ADR-0002), **automated extraction (including browser OCR) of third-party platform screenshots stays disabled until legal review**. The API returns `INPUT_RIGHTS_UNCLEARED` (403), and the user enters product facts and the asking price manually. CTO notes this is a conservative launch policy, *not* a legal finding that private screenshot analysis is prohibited.
- **Status of "F1 automated extraction of third-party listing screenshots": BLOCKED, pending a legal opinion and Founder decision.**
- Consequence: at launch, most real-world inputs go through manual entry, and the "snap and check" promise is not delivered.
- Mitigation (Must): the manual-entry path is excellent (≤ 6 fields, prefilled from catalogue typeahead). OCR extraction is **built and tested behind a feature flag, default OFF for third-party images** (CTO allows: browser Tesseract primary OCR, disabled-by-default policy registry, rights/origin declaration before client OCR). It can be enabled the moment legal clears it, without a redeploy beyond the config change.
- **CTO confirmed (9 Nov):** the flag is server-side, OFF for third-party images; flipping it is config-only.
- **Q0b (Founder/legal):** may OCR run on device for images the user captured themselves (a shelf tag, a printed or WhatsApp quote they photographed)? These are target input only, never a comparable; the CTO sees them as lower risk. Default: **OFF** until decided.
- Own or rights-cleared ad images (e.g. Sana's own ad) are *Conditional* in CTO policy. Enabling that path at launch also needs the rights/origin declaration flow and Security approval.

## 3. Scope (MoSCoW, 14 days)
| Must (core journey) | Should | Could | Won't (MVP → Later) |
|---|---|---|---|
| **Manual entry path**: catalogue typeahead + condition + PTA (optional) + asking price | URL paste with correct reason codes: OLX/Daraz → NOT_PERMITTED (403, no fetch); unimplemented/unclear → SOURCE_NOT_SUPPORTED (422); manual fallback (F2) | Roman Urdu keyword parsing beyond numbers | Urdu UI |
| Screenshot upload UI + OCR pipeline **behind a feature flag (third-party OFF)**, rights/origin declaration, EXIF strip | Search-only result without an asking price (NO_ASKING_PRICE) + inline classify | Seller "suggested asking range" copy | Server accounts and server-side history, alerts |
| Confirm screen (model, variant, condition required; PTA non-blocking) | Native Web Share + snapshot link + PNG card | PWA install prompt | Any automated collection from Excluded sources |
| PKR normaliser (k/lac/lakh/crore, commas) | Device-local Recent (dated snapshots, no images or PII), clearable | "Report wrong result" | Categories beyond phones, laptops and consoles; native apps |
| Evidence engine on permitted evidence only (seed data with rights records; approved feeds if cleared) | Basic analytics events | | Price history, scam detection beyond the caution |
| Result states ERROR → INSUFFICIENT → RANGE_AVAILABLE; confidence bands; verdict | | | Pooling refurbished/open-box/kit with Used |
| Provenance on every comparable (source, observed_at, retrieved_at) | | | |
| Error contracts per API v0 (§9) | | | |
| Privacy controls per §10 (pending Security/Founder approval) | | | |
| Seed-data admin CSV with rights/provenance fields | | | |

Note: "device-local Recent" is a Should, explicitly included. It is not server history and doesn't contradict "no accounts".

### Scope fallback (agreed with CTO, 9 Nov)
If **no permissioned market source is confirmed by G2 (12 Nov)**, launch is **phones only**. Laptops and consoles remain in category config but are **disabled** (not deleted), so they can be re-enabled by config once sources exist. Market-source pathway: retailer outreach (Q1 in open-questions), with Daraz Open Platform/affiliate display rights verified in parallel (longer shot). Brand MSRP from official sites may be shown as a labelled **reference price**, never a comparable, and only after legal clearance.

## 4. MVP boundaries per feature
- **F1 Screenshot.**
  - The pipeline is IN, behind a flag.
  - **Third-party listing extraction is BLOCKED** and returns INPUT_RIGHTS_UNCLEARED (403), pointing the user to manual facts.
  - Own or rights-cleared ad images are Conditional: private, transient, target-only.
  - Limits: 10 MiB client original; the server proposal is 4 MiB / 4 MP normalised (CTO, pending Security).
  - CUT: multi-image, video, batch.
  - A screenshot is **only the target input. It is never a comparable** and never enters its own benchmark.
- **F2 URL (SHOULD, thin).**
  - OLX and Daraz URLs return **NOT_PERMITTED (403)**: their terms forbid automated extraction (OLX help-centre terms §4/§7; Daraz terms of use), so there's no fetch at all, not even meta tags.
  - Other unimplemented or unclear domains (PriceOye, retailers without clearance) return **SOURCE_NOT_SUPPORTED (422)**.
  - OpenGraph/meta fetching counts as automated access. The allowlist is **empty** until a source is cleared.
  - Fallback copy depends on the screenshot rights policy: offer **manual entry**, not "upload a screenshot of this listing", while F1 third-party extraction is blocked.
  - A link failure must never read as "no listings exist".
- **F3 Search (SHOULD).**
  - Typeahead over our own catalogue. No matches returns 200 with an empty list. Fewer than 2 characters is avoided client-side (400 QUERY_TOO_SHORT if submitted).
  - CUT: live web search unless a paid search API is approved (Q2). The CTO rates SerpAPI/Serper as Conditional: the contract doesn't clear downstream rights.
- **F4 Output (IN, P0).**
  - Shows the state, asking price, range, **market median** (not the arithmetic midpoint), % vs median, verdict, confidence band + reasons, n (total and displayed), and newest/oldest observation dates.
  - New and used are separate and each may be null.
  - Official retail is shown only if *verified retail* within 14 days. Aggregator quotes (WhatMobile/Hamariweb) are not verified retail.
  - It's an asking-market estimate, not a sold-price value.
- **F5 Comparables (IN, minimal).**
  - Up to 10 displayed, with the total effective sample disclosed. Each shows source, price, variant, condition, city if known, observed_at and retrieved_at, and a link.
  - **No external market integration is enabled today.** At G2 we must show one legally usable real evidence pathway, or escalate scope (CTO).

## 5. Core journey + acceptance criteria (targets are ASSUMPTION, unmeasured)
| # | Step | Acceptance criteria |
|---|---|---|
| 1 | Home: Upload / Paste link / Search | All 3 above the fold at 360×640. LCP < 2.5 s on 4G. Search/manual is the default path while F1 third-party is blocked. |
| 2a | Manual entry / search | Typeahead returns within 1 s p95 (ASSUMPTION). The user can enter model, variant, condition, optional PTA and asking price in ≤ 6 fields. |
| 2b | Upload (flagged) | Rights/origin declaration shown *before* any OCR. Third-party origin with the flag OFF → INPUT_RIGHTS_UNCLEARED and manual form prefilled with nothing extracted. Invalid type → 415; too large → 413; dimensions → 422. EXIF stripped (IMAGE_METADATA_NOT_STRIPPED 422 if not). |
| 3 | Extract (flagged path) | Per-field confidence. Fields with confidence < 0.85 or null are highlighted for review (CTO initial threshold). Accuracy targets ≥ 90% price / ≥ 80% model on a rights-cleared QA golden set of ≥ 50, signed off before G2. |
| 4 | Confirm | Model, condition and other critical category attributes are required. **PTA is optional**: Approved / Non-PTA / Not sure, and a skip maps to NOT_SURE and doesn't disable Check. |
| 5 | Evidence | Only permitted, provenance-complete comparables matching variant + condition/grade + PTA branch. Fresh means observed_at within 14 days (new) / 30 days (used), boundary inclusive. The target is never included. |
| 6 | Range | n 3–4: min–max. n ≥ 5: P10–P90 (linear quantiles). IQR trimming only when n ≥ 8. Spread (max−min)/median > 0.60 → Insufficient. |
| 7 | Verdict | §7 rules. Unit tests at −15%, +10% (inclusive), n = 2/3/4/5/8, single source, 2+2 PTA split. |
| 8 | Share | Immutable dated snapshot is created first, then the PNG. A PNG failure keeps Copy link. A snapshot failure means no link. No screenshot, seller or target URL by default. |
| — | States | ERROR (operational; never saved or shared) → INSUFFICIENT (no numbers, confidence NONE) → RANGE_AVAILABLE. A source outage is never shown as "no market data". |

## 5b. "Insufficient market data" is the honest default, not a failure
With no external integration enabled and seed data still being sourced, Insufficient will be a **common, expected** result at launch, especially for used, PTA-split and long-tail variants. Treat it as a first-class product state.
- **Tone:** neutral and confident, not an apology or error. It's styled as a result card, not an error banner (ERROR is visually distinct).
- **Copy expectations** (draft, for Design to refine; English first, ICU keys):
  - Headline: "Not enough market data yet."
  - Why: "We found {n} matching listing(s) for this exact {variant}, {condition}, and need at least 3 recent, verified ones to give a fair range. We won't guess."
  - Specific reason chips from gate enums: few comparables, stale, wide spread, variant unclear, PTA split.
- **Next steps** (at least one actionable): "Check PTA/variant details", "Try new instead of used" (only as a separate check, never mixing pools), "Check again later". There must be no fabricated number, no "estimated" fallback price, and no MSRP masquerading as a range.
- **Shareable** as an Insufficient snapshot (no numbers), because "even Kitne Ka couldn't verify this price" is useful to the buyer.
- **Metrics:** insufficient_rate is tracked per category/condition as a **coverage signal**, not a defect count. The 70% coverage target (ASSUMPTION) applies to seeded top-SKU phones only.
- **AC:** given any gate fails, the result card shows headline, reason chip(s) and ≥ 1 next step; zero PKR values are rendered; QA checks the copy for any implied price.

## 6. Edge cases
- **Insufficient data:** a gate fails (n < 3, critical identity unknown, rights/provenance unverified, stale, spread > 60%) → "Insufficient market data", no numbers, score null / level NONE.
- **Ambiguous variant:** ask in confirm. Never pool variants. Multiple candidates are a successful extraction, not an error.
- **Condition:** "box pack" or "sealed" → New. Used grades are like_new / good / fair. **Open-box, kit-only, refurbished, repaired, damaged and "10/10" are NOT automatically standard Used.** They're separate pools and unpriced in v0 until PM/Founder ratify category-specific pools. "10/10" is seller wording: ask for the grade. Battery health band for used phones where relevant.
- **PTA:** non-blocking. NOT_SURE → run the Approved and Non-PTA branches separately, each needing n ≥ 3. 2 + 2 = Insufficient. Passing branches are shown as labelled ranges, forced LOW (cap 49) with PTA_UNCONFIRMED. **No blended median and no global verdict** (verdict slot = PTA_SELECTION_REQUIRED). JV/CPID/carrier lock are separate attributes, not non-PTA.
- **Price notation:** "85k" → 85,000; "1.2 lac", "lakh" or "L" → 120,000; "1,20,000" → 120,000. Multiple prices → the user picks. Implausible targets are flagged for confirmation using **category config**, not a global PKR 1,000 rule. Factual evidence is never discarded on an unexplained global threshold.
- **No asking price:** RANGE_AVAILABLE with NO_ASKING_PRICE: "Add the asking price to get a verdict" (inline classify).
- **Non-MVP category:** CATEGORY_NOT_SUPPORTED (422). **Foreign currency and copy/"master copy" devices:** unsupported in v0.
- **Offline:** inputs preserved; retries replay idempotently; no duplicate paid calls.
- **Stale result:** classify after expiry → 409 RANGE_STALE, prompting "Check again" (a new assessment, no silent refresh).

## 7. Verdict and evidence rules (CTO methodology v0, 9 Nov; ASSUMPTION pending calibration)
- **Source policy:** separate the *target input* from *market evidence*. The target (screenshot, URL, manual price) **never** proves its own price.
  - Comparable evidence requires independently verified commercial rights, seller/time provenance and deduplication.
  - Source priority for market evidence: (1) permissioned retailer exports / direct quotes; (2) official APIs or affiliate feeds where display rights are verified (e.g. Daraz Open Platform, Conditional); (3) licensed search APIs (Conditional, paid, Founder approval, downstream rights to be cleared); (4) curated manual seed data with a rights record.
  - No automated collection from Excluded sources. Unclear sources aren't used until cleared. **No external integration is enabled today.**
- **Gates:** n ≥ 3 eligible independent comparables per pool/branch after permission, matching, freshness (14 days new / 30 days used from observed_at), independence and dedup filters, and spread ≤ 0.60. Otherwise INSUFFICIENT (a gate, not a band).
- **Confidence:** integer score. **LOW 0–49, MEDIUM 50–79, HIGH 80–100.**
  - n 3–4, or a single independent source owner, caps the score at 49.
  - Normal confidence needs n ≥ 5 AND ≥ 2 independent underlying source owners (the same merchant via two APIs is ≠ diversity).
  - The score is not a calibrated probability. Reasons are enums (FEW_COMPARABLES, SINGLE_SOURCE, NEAR_EXPIRY, WIDE_SPREAD, …).
- **Anchor:** median M. delta = 100 × (A − M) / M.
  - **FAIR** −15 ≤ delta ≤ +10.
  - **HIGH** > +10.
  - **UNUSUALLY_LOW** < −15, with "Verify condition, PTA/lock status and seller before paying" (never "bargain", never a fraud accusation).
- **LOW modifier:** indicative = true and softened copy ("Indicative: looks high, limited data"). Applies to priced, no-price and split layouts.
- **Classify:** `POST /checks/{id}/classify` (asking price, optional PTA, idempotency key) reuses the stored median, with no new collection.
  - 409 RANGE_STALE past the earliest included observation's expiry.
  - 409 EVIDENCE_INVALIDATED on a policy/config change.
  - 422 NO_STORED_RANGE / PTA_SELECTION_REQUIRED / VARIANT_CHANGE_REQUIRES_CHECK.
  - Public snapshots are unchanged.

## 8. User stories (Status: Proposed for all)
| ID | Story | MoSCoW / Pri | Given / When / Then |
|---|---|---|---|
| US1 | As a buyer, I want to upload a screenshot so I can check without typing | Must (pipeline behind flag) / P0. **Third-party extraction BLOCKED** | Given the flag is OFF and I declare the image is from another platform, when I upload, then no OCR runs and I get INPUT_RIGHTS_UNCLEARED with the manual form. Given the flag is ON (after legal clearance), when I upload a valid ad, then fields are extracted within 8 s p95 with per-field confidence |
| US1b | As a buyer, I want to enter the item and price manually so I can check any ad | Must / P0 | Given the catalogue, when I pick a model, variant, condition and enter a price, then I can run Check in ≤ 6 fields |
| US2 | As a user, I want to correct details so the comparison is accurate | Must / P0 | Given extracted or entered fields, when model, condition or another critical attribute is missing, then Check is disabled. When only PTA is missing, then Check stays enabled (NOT_SURE) |
| US3 | As a user, I want "1.2 lac" and "85k" understood | Must / P0 | Given "1.2 lac", then 120,000 PKR. "85k" → 85,000. Multiple prices → I choose. An implausible value per category config → asked to confirm |
| US4 | As a buyer, I want a verdict to know whether to negotiate | Must / P0 | Given a known PTA pool passing the gates and an asking price, when the result loads, then the verdict uses the median per §7, with the band and reasons. Given n = 3–4 or one source, then confidence ≤ 49 and indicative copy |
| US5 | As a user, I want an honest insufficient answer | Must / P0 | Given any gate fails, when the evaluation completes, then INSUFFICIENT shows with no range, median, verdict or score. Given a service failure, then ERROR (retryable) shows, not Insufficient |
| US6 | As a buyer, I want sources with dates to trust the estimate | Must / P0 | Given a result, then each displayed comparable shows source, price, variant, condition, observed_at, retrieved_at and link, plus total n vs displayed count |
| US7 | As a buyer, I want new/used and PTA kept separate | Must / P0 | Given PTA = Not sure, when evidence exists for both branches, then I see two labelled LOW ranges with PTA_UNCONFIRMED and no verdict until I pick PTA. Given 2 + 2 comparables, then Insufficient. Open-box/kit/refurbished never enter the Used pool |
| US8 | As a buyer, I want a caution on very low prices | Must / P1 | Given delta < −15%, then Unusually Low with the verification caution, never "bargain" |
| US9 | As a user, I want to paste a link | Should / P2 | Given an OLX or Daraz URL, when pasted, then no fetch occurs and I see NOT_PERMITTED (403) with the manual-entry fallback. Given another unimplemented/unclear domain, then SOURCE_NOT_SUPPORTED (422) + manual fallback. Given a cleared allowlisted domain (none today), then meta prefill. Invalid/unsafe URL → 400. Neither message says "no listings exist" |
| US10 | As a user, I want to search by model before I see an ad | Should / P2 | Given I select a model and condition with no price, then RANGE_AVAILABLE + NO_ASKING_PRICE. When I add a price, then classify returns a verdict, or 409 RANGE_STALE prompting Check again |
| US11 | As a buyer, I want to share the result | Should / P2 | Given a result, when I tap Share, then a dated immutable snapshot is created before the image. Native share is used, falling back to copy/download. Cancel is neutral. ERROR is not shareable. Insufficient shares no numbers. Unknown/revoked link → 404, expired → 410 |
| US12 | As a user, I want my screenshot handled privately | Must / P1 | Given an upload, then EXIF is stripped and the image exists only in a request-only buffer, cleared on completion/cancel/failure (proposed ≤ 15 min). Private fields expire in 24 h and sanitised public snapshots in 30 days (all pending Security/Founder approval). Images are never logged or persisted. Provider retention is disclosed separately |
| US13 | As a curator, I want to add seed prices with rights and provenance | Must / P0 | Given a CSV row, when it lacks a permission record, exact variant/condition, seller-independence ID, observed_at, retrieved_at, or stock/price basis, then it's rejected. An aggregator "official" quote is not marked verified retail |
| US14 | As a seller, I want a range to set my asking price | Could / P3 | Given NO_ASKING_PRICE, then the "suggested asking range" copy shows |
| US15 | As a user, I want Recent checks on my device | Should / P2 | Given successful or insufficient results, then dated snapshots are stored locally (no images or PII) and can be cleared. ERROR is never saved |

## 9. Error contracts (adopted from `03-api-contract-v0.md`, code / HTTP / retryable)
- **Image:**
  - INVALID_REQUEST 400 · UNSUPPORTED_IMAGE_TYPE 415 · IMAGE_TOO_LARGE 413
  - IMAGE_DIMENSIONS_EXCEEDED 422 · IMAGE_METADATA_NOT_STRIPPED 422 · **INPUT_RIGHTS_UNCLEARED 403**
  - IMAGE_UNREADABLE 422 · NO_TEXT_FOUND 422 · CATEGORY_NOT_SUPPORTED 422 · PRODUCT_NOT_IDENTIFIED 422
  - EXTRACTION_TIMEOUT 504 (retry) · EXTRACTION_PROVIDER_FAILED 502 (retry) · EXTRACTION_UNAVAILABLE 503
- **Link:**
  - INVALID_URL 400 · **SOURCE_NOT_SUPPORTED 422** · **NOT_PERMITTED 403** · UNSAFE_URL 400
  - NOT_PRODUCT_PAGE 422 · NOT_FOUND_OR_REMOVED 410/404 · FETCH_FAILED 502 (retry) · TIMEOUT 504 (retry)
- **Catalogue:**
  - QUERY_TOO_SHORT 400 · INVALID_QUERY 400 · CATEGORY_NOT_FOUND 404 · PRODUCT_NOT_FOUND 404
  - CATALOGUE_UNAVAILABLE 503 (retry) · CATALOGUE_TIMEOUT 504 (retry). No matches = 200 empty.
- **Check/classify:**
  - CONFIRMATION_REQUIRED 422 · SERVICE_UNAVAILABLE 503 (retry) · ANALYSIS_TIMEOUT 504 (retry)
  - RANGE_STALE 409 · EVIDENCE_INVALIDATED 409 · NO_STORED_RANGE 422 · PTA_SELECTION_REQUIRED 422
  - VARIANT_CHANGE_REQUIRES_CHECK 422 · VERSION_CONFLICT 409 (retry)
- **Session/other:**
  - CAPABILITY_REQUIRED 401 · CHECK_NOT_FOUND 404 · CHECK_EXPIRED 410 · RATE_LIMITED 429 (retry) · INTERNAL_ERROR 500 (retry)
- Each code has an ICU message key. No upstream HTML or provider details are exposed.

## 10. Privacy and retention (proposed by CTO; pending Security + Founder approval; not yet a user-facing promise)
- No app-persisted images.
- EXIF stripped and redacted.
- Request-only buffer, cleared on completion, cancel or failure (proposed ≤ 15 min).
- Temporary private job/fields: 24 h.
- Sanitised public snapshots: 30 days.
- Third-party provider retention is disclosed separately. "Paid API / no training" ≠ zero retention.
- No "phone number not stored" claims until controls are verified.
- No accounts. Recent is device-local only.

## 11. Source statuses (CTO consolidated list, `00-summary.md` §3; policy, not implemented connectors)
- **Excluded:** OLX website/API; Daraz storefront; Apple website; Xiaomi/MiStore; Telemart/Telex; Google Shopping website; Google Merchant API (for market search).
- **Conditional:**
  - Daraz Open Platform; SerpAPI; Serper
  - WhatMobile and Hamariweb (manual reference only)
  - own/rights-cleared ad image (target only)
  - third-party screenshots (disabled pending legal)
  - permissioned retailer export / direct quote (preferred)
- **Partnership target:** Daraz affiliate; PriceOye; Samsung PK; Mercantile; Infinix; Tecno; Mega.pk; iShopping; Games & Gears; Czone; Mobilemall.

## 12. Success metrics (all targets ASSUMPTION; no baselines)
- Activation ≥ 60% (start → result screen).
- Coverage ≥ 70% of top-SKU phone checks reach RANGE_AVAILABLE. **This is at risk:** no permitted source is enabled yet.
- Extraction ≥ 90% price / ≥ 80% model (flagged path, golden set).
- Helpful ≥ 60%.
- p95 time to result ≤ 15 s.
- Share ≥ 10%.
- Manual-entry completion ≥ 70% (new: the path is critical while F1 is blocked).
- **Guardrails:** zero comparables without provenance; zero targets counted as comparables; zero fetches to Excluded sources.
- Events: home_view, input_selected, rights_declared, upload_blocked_rights, link_rejected{code}, extract_done, confirm_submit, result_shown{state, verdict, band, n, pta_split}, classify{result}, share_clicked, feedback, error{code}.

## 13. Dependencies / risks
- **No permitted market evidence source is enabled.** Retailer outreach (open-questions Q1) needs Founder approval on 10 Nov. If nothing is confirmed by G2, the phones-only fallback applies.
- Used/PTA coverage is weak without OLX.
- F1 is legally blocked (Q0).
- Seed-data effort and rights (Q3).
- Vendor/budget approvals (Q2).
- Security approval of retention.
