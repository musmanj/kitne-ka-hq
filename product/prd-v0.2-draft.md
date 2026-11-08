# PRD v0.2: Kitne Ka MVP (draft)
Owner: PM · Reviewers: CTO, Design Director, QA · **Status: Proposed** · Date: Mon 9 Nov 2026 (Day 1) · Target: G1 on 10 Nov
Inputs: Founder brief (/workspace/kitne-ka/founder-product-brief-2026-11-09.md), repo musmanj/kitne-ka-hq (PRD v0.1 template, backlog conventions, 14-day plan; read-only). The verdict and evidence rules are **CTO provisional, 9 Nov**, and every one is an ASSUMPTION until CTO methodology v0 lands.
Rule: we have no user research, interviews or baselines. Every figure without a source is labelled ASSUMPTION.

## 1. Problem
Buyers and sellers in Pakistan see prices on WhatsApp Status, OLX and social posts, and there's no quick, evidence-backed way to tell whether a price is fair. The variants are confusing (storage, RAM, PTA/non-PTA, new/used/box-pack), and prices are written in mixed notation ("1.2 lac", "85k"). Kitne Ka takes a screenshot, link or search and returns a sourced PKR range with a verdict, or says honestly that there's insufficient data.

## 2. Personas (ASSUMPTION, not validated)
- **P1 Buyer "Ali"** (primary): a Karachi or Lahore smartphone user who spots a phone or laptop on WhatsApp Status or OLX and wants to know "Is this price fair?" before messaging the seller.
- **P2 Casual seller "Sana"** (secondary): selling her used phone and wants a defensible asking price. For the MVP she uses the same flow as the buyer; there's no separate seller flow (see Q5).
- Out of MVP: dealers or shops doing bulk pricing.

## 3. Scope (MoSCoW, 14 days)
| Must (core journey) | Should | Could | Won't (MVP → Later) |
|---|---|---|---|
| Screenshot upload + OCR/vision extraction (F1) | URL paste: meta-tag prefill only for CTO-allowlisted domains; OLX/Daraz/unclear-ToS URLs get SOURCE_NOT_SUPPORTED + screenshot/manual fallback (F2) | Roman Urdu price/keyword parsing beyond numbers | Urdu UI |
| Confirm/edit screen (category, brand, model, variant, condition, PTA, price) | Search by name/model (F3) on our own catalogue | Seller "suggest asking price" framing (copy only) | Accounts, saved history, alerts |
| PKR price normaliser (k/lac/lakh/crore, commas) | New vs used shown side by side when both pools exist | "Report wrong result" feedback button | Automated scraping of OLX/Daraz/PriceOye/retailers |
| Evidence engine: user evidence + curated seed data (+ approved APIs if any) | Share via WhatsApp deep link and copyable text | PWA install prompt | Categories beyond phones, laptops and consoles; native apps |
| Verdict/range/confidence per CTO rules; "Insufficient market data" | Shareable result card image | | Price history charts, price-drop alerts |
| Sources list with retrieval date (F4/F5) | Basic analytics events | | Scam detection beyond the Unusually Low caution |
| Catalogue of top SKUs for phones (P0), plus laptops and consoles (P1, smaller set) | | | |
| Screenshot privacy: no retention beyond processing (default; see Q3) | | | |

## 4. MVP boundaries per feature
- **F1 Screenshot (IN, P0).** One image (JPG/PNG/WebP, ≤10 MB, ASSUMPTION). Extract the price, brand/model, storage/RAM, condition keywords (new, used, box pack, 10/10, PTA/non-PTA). Any field below the confidence threshold goes to the confirm screen. CUT: multi-image, video and batch.
- **F2 URL (SHOULD, thin).** No launch promise of URL support for OLX, Daraz or any site whose ToS is unclear or prohibits automated access. For those, the server does NOT fetch the page; it returns reason code `SOURCE_NOT_SUPPORTED` and asks the user for a screenshot or manual details. Only domains on the CTO-approved allowlist (initially empty until ToS is verified; Telemart/iShopping candidates pending ToS review) get an OpenGraph/meta-tag fetch (title, price if present). CUT: deep page parsing, logged-in pages, any OLX/Daraz/PriceOye page fetch. (CTO provisional, 9 Nov; needs Founder/legal sign-off.)
- **F3 Search (SHOULD).** Typeahead over our own normalised catalogue (seeded SKUs). CUT: live web search unless a paid search API is approved (Q1).
- **F4 Output (IN, P0).** Asking price, range, median, % difference from the median, verdict, confidence, evidence quality, new/used split, and a 1–2 line explanation. Never a single "original price" unless an official retail source exists, and then it's labelled "official retail (source, date)".
- **F5 Comparables (IN, minimal).** A list of up to 10 comparables, each with source, price, variant, condition, city (if known), retrieval date and link. CUT: sorting, filtering, maps.

## 5. Core journey + acceptance criteria
| # | Step | Acceptance criteria (measurable; targets are ASSUMPTION) |
|---|---|---|
| 1 | Home: 3 actions (Upload / Paste link / Search) | All 3 visible above the fold on a 360×640 viewport. LCP < 2.5 s on 4G. |
| 2 | Upload screenshot | Rejects non-image or >10 MB files with a clear message. Shows progress. |
| 3 | Extract | Returns fields within p95 ≤ 8 s. Price parsed correctly on ≥ 90% of the QA golden set (≥ 50 labelled screenshots, built by QA, ASSUMPTION). Brand+model correct on ≥ 80%. |
| 4 | Confirm | Every low-confidence field is pre-filled and editable. The user can't proceed without model and condition. PTA status is asked for phones if unknown. |
| 5 | Evidence | Only comparables matching category, model, storage/RAM variant, condition pool, PTA pool and freshness window (14 days new / 30 days used). Each has source URL and retrieval date. |
| 6 | Range | Trimmed P10–P90 (min–max if n < 5). Median shown. |
| 7 | Verdict | Follows §7 rules exactly. QA unit tests cover each boundary (−15%, +10%, n = 2/3/4/5, single source). |
| 8 | Share | Share text includes the verdict, range, confidence, date and the "estimate, not a guarantee" disclaimer. No screenshot or personal data in the share. |
| Fail | Insufficient data | n < 3 → "Insufficient market data". No range or verdict is shown. Offers the next step (try another variant / notify later = Later). |

Happy-path success: a phone screenshot gets to a verdict with sources in ≤ 60 s of user time (ASSUMPTION).

## 6. Edge cases
- **Insufficient data:** n < 3, or all evidence is stale → the explicit state; never a fabricated price.
- **Ambiguous variant** (e.g. "iPhone 13" with no storage): ask in the confirm step. If the user skips, show a per-variant table or return insufficient data. Never pool variants.
- **Used vs new / box-pack:** "box pack" or "sealed" maps to New. "Open box", "10/10" or "kit" map to Used. Unknown condition gets asked in confirm. Separate pools, always.
- **PTA vs non-PTA / JV / CPID:** separate pools. If unknown, ask. Non-PTA pricing is shown only if evidence exists.
- **Price notation:** "85k" → 85,000; "1.2 lac", "1.2 lakh" or "1.2L" → 120,000; "1,20,000" → 120,000; "Rs./PKR/₨". When there are multiple prices (e.g. strikethrough and "final"), ask the user to choose. Implausible values (<1,000) get flagged.
- **No price in the image:** prompt for manual price entry. The range is still shown, with no verdict.
- **Non-MVP category:** "We currently cover phones, laptops and consoles."
- **Foreign currency / USD prices:** out of scope. Ask for the PKR price.
- **Refurbished / China copy / "master copy":** excluded from pools. If detected, show a caution.

## 7. Verdict rules (ASSUMPTION, CTO provisional, 9 Nov; pending CTO methodology v0)
- **Source priority:** (a) user-submitted evidence (their screenshot; pasted URLs only for allowlisted domains). Screenshots: EXIF stripped, short retention, never added to a reusable price database without consent; (b) official APIs or affiliate feeds where the terms allow price display (Daraz to be verified); (c) licensed search APIs (paid, Founder approval); (d) curated manual seed data (URL, price, retrieval date, recorded by a person). No automated scraping without verified ToS and robots permission. Ambiguous sources go to legal review and aren't used.
- **Evidence:** n < 3 matched comparables → Insufficient market data. 3–4 → low-confidence range. ≥ 5 from ≥ 2 independent sources → normal confidence. Freshness is 14 days for new and 30 days for used; older evidence is excluded. Pools for new/used and PTA/non-PTA are always separate.
- **Anchor:** the median of trimmed comparables.
- **Verdict:** Fair = −15% to +10% of the median. High = more than +10%. Unusually Low = below −15%, shown with a caution (possible used, non-PTA, refurbished or scam), never labelled "bargain".
- **Range:** trimmed P10–P90, or min–max if n < 5.
- **Low confidence:** softened wording ("Looks high, limited data").

## 8. User stories (Status: Proposed for all)
| ID | Story | MoSCoW / Pri | Given / When / Then |
|---|---|---|---|
| US1 | As a buyer, I want to upload a screenshot so I can check a price without typing | Must / P0 | Given a valid phone-ad screenshot, when I upload it, then I see the extracted brand, model, variant, condition and PKR price within 8 s (p95) |
| US2 | As a buyer, I want to correct extracted details so the comparison is accurate | Must / P0 | Given the extraction is complete, when any field is low-confidence, then it's highlighted and editable, and I can't continue without model and condition |
| US3 | As a user, I want "1.2 lac" and "85k" understood so prices aren't misread | Must / P0 | Given the text "1.2 lac", when it's parsed, then the price is 120,000 PKR. "85k" → 85,000. Multiple prices → I'm asked to choose |
| US4 | As a buyer, I want a fair-price verdict so I know whether to negotiate | Must / P0 | Given ≥ 3 matched fresh comparables, when the result loads, then I see the verdict computed per §7, the % vs median, and the confidence |
| US5 | As a user, I want an honest "insufficient data" answer so I'm not misled | Must / P0 | Given < 3 matched comparables, when the result loads, then "Insufficient market data" shows with no range or verdict |
| US6 | As a buyer, I want sources with dates so I can trust the estimate | Must / P0 | Given a result, when I open the evidence, then each comparable shows source, price, variant, condition, retrieval date and a working link |
| US7 | As a buyer, I want new and used (and PTA/non-PTA) kept separate so the comparison is fair | Must / P0 | Given a used PTA phone, when evidence is gathered, then no new or non-PTA comparables are in its pool |
| US8 | As a buyer, I want a caution on very low prices so I avoid scams | Must / P1 | Given a price more than 15% below the median, when the result shows, then it's labelled Unusually Low with the caution text, never "bargain" |
| US9 | As a user, I want to paste a link so I can check an online listing | Should / P2 | Given a URL on the CTO allowlist, when I paste it, then title and price are prefilled from meta tags. Given an OLX, Daraz or other non-allowlisted URL, when I paste it, then no server-side fetch happens and within 3 s I see a SOURCE_NOT_SUPPORTED message asking for a screenshot or manual details |
| US10 | As a user, I want to search by model so I can check a price before I see an ad | Should / P2 | Given I type "Galaxy A55", when I pick a suggestion and condition, then I see the range and sources (no verdict without an asking price) |
| US11 | As a buyer, I want to share the result on WhatsApp to negotiate | Should / P2 | Given a result, when I tap Share, then WhatsApp opens with the verdict, range, date and disclaimer, and no screenshot is included |
| US12 | As a user, I want my screenshot not stored so my privacy is protected | Must / P1 | Given an upload, when processing finishes or fails, then the image is deleted within 1 h (ASSUMPTION) and is never logged |
| US13 | As an ops curator, I want to add seed prices with URL and date so the engine has evidence | Must / P0 | Given an admin CSV or form, when I submit a row without a URL or date, then it's rejected. Valid rows appear in matching within 5 min |
| US14 | As a seller, I want to see the range for my item so I can set an asking price | Could / P3 | Given search or a screenshot with no asking price, when the result shows, then I see the range plus the copy "suggested asking range" |

## 9. Success metrics (all targets ASSUMPTION; no baselines exist)
- Activation: ≥ 60% of sessions that start an upload reach a result screen.
- Coverage: ≥ 70% of checks for top-SKU phones return a range (not insufficient data).
- Extraction accuracy: price ≥ 90%, model ≥ 80% on the QA golden set.
- Trust: "Was this helpful?" yes ≥ 60%. Wrong-result reports < 10%.
- Performance: p95 time to result ≤ 15 s.
- Share rate: ≥ 10% of results shared.
- Integrity guardrail: 0 results shown without a source and date (hard requirement).
- Events: home_view, input_selected, upload_done, extract_done, confirm_submit, result_shown{verdict,confidence,n}, insufficient_data, share_clicked, feedback.

## 10. Dependencies / risks
Data-source access (the top risk) and seed-data volume (Q1, Q2) · OCR/vision vendor spend · catalogue of variants for top SKUs · legal review of sources.
