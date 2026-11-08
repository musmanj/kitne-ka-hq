# Kitne Ka: Day 1 Core UX, Design Direction, Designer Plan, CTO Constraints
Owner: Design Director · Date: Mon 9 Nov 2026 · Status: In Review (for joint PM + CTO + Design assessment) · Source: founder-product-brief-2026-11-09.md (§1, §3, §5, §7)
No design files or prototypes exist yet. Everything below is a written spec. Items marked [ASSUMPTION] need PM, CTO or Founder confirmation.

## 1. Core UX flow

### 1.0 Home
- Header: logo, language switch (EN only at launch, placeholder for اردو / Roman Urdu), no sign-in needed.
- One-line promise: "Know the real market price before you buy or sell."
- Three primary actions as equal-weight, full-width cards (thumb zone): Upload Screenshot (camera/gallery icon), Paste Product Link (shows a "Paste" button that reads the clipboard on tap), Search Product (search field opens typeahead).
- Below: supported categories chips (Phones · Laptops · Consoles), "Recent checks" stored on this device only, a one-line privacy note ("Screenshots are used only to check the price").

### 1.1 Entry A: Upload Screenshot
1. Pick image (gallery, camera, or paste/drag on desktop). Client compresses before upload [ASSUMPTION: max ~1600px long edge, ≤10 MB original].
2. Preview with privacy reminder ("Phone numbers or names in the screenshot aren't stored or shared") and Continue.
3. Extracting state: step list with live status (Uploading → Reading text → Identifying product). Cancel always available.
4. → Confirm details (1.4).
States: unsupported file / too large (say limit, offer pick again); unreadable image, no text found (offer retake, or switch to Search with nothing lost); product found but no price visible (Confirm screen asks for asking price, marked optional); product outside MVP categories ("We currently check phones, laptops and consoles" + Search); multiple products in one image (ask user to pick one).

### 1.2 Entry B: Paste Product Link
1. Paste field with Paste button; validate URL inline (not on submit only).
2. If the source is supported and permitted: Extracting state → Confirm details.
3. If the source can't be read (not supported, not permitted, or fetch failed): honest message that names the reason in plain words, never implies we scraped it. Two fallbacks, same screen: "Upload a screenshot of the listing" or "Enter details manually" (opens Confirm details empty, with category picker).
States: invalid URL; link to a non-product page; link expired/removed; timeout (retry keeps the link).

### 1.3 Entry C: Search Product
1. Typeahead over the product catalogue (brand, model, specs), category chips to narrow.
2. Pick a model → Confirm details with model prefilled; asking price optional.
States: no matches (empty state with spelling tips, "Try brand + model, e.g. iPhone 13 128GB", and a category browse); too-short query hint; catalogue unavailable error.

### 1.4 Confirm details (shared by all three entries)
- One card per field: Category, Brand, Model, Variant specs, Condition, Asking price (PKR), City (optional).
- Fields detected by AI show "Detected" with Edit; low-confidence fields are highlighted "Please check" and focused first. Nothing is silently assumed.
- Variant specs are category-driven [ASSUMPTION, needs PM]: Phones = storage, RAM, PTA approved / non-PTA, Laptops = CPU, RAM, storage, GPU, Consoles = model/edition, storage, disc/digital.
- Condition: New (sealed) / Used, with Used sub-grade (Like new, Good, Fair) [ASSUMPTION: taxonomy to confirm with PM].
- Asking price: numeric keypad, Rs prefix, live grouping; optional. Without it we show the market range only, no verdict.
- Primary CTA "Check price" (sticky bottom); disabled until Model + Condition are set, with a plain reason shown.

### 1.5 Analysing
Progressive steps (Finding listings → Matching variants → Building price range). Skeleton of the results layout so the page doesn't jump. If it runs long, say so ("Still checking more sources…") rather than spinning silently. Cancel returns to Confirm with inputs intact.

### 1.6 Results states
- Full result (default): see §2 layout.
- Low confidence: verdict shown as "Indicative" with a caution banner explaining why (few listings, old data, wide spread) and evidence count. Verdict never presented with the same visual weight as high confidence.
- No asking price: market range, new vs used, sources. Verdict slot replaced by "Add the asking price to get a verdict" (inline input).
- Insufficient market data: no range, no verdict, no number invented. Explain what we found ("2 listings, both over 60 days old"), why it's not enough, and next steps: edit details, try a nearby variant, check again later. Share still possible as "Not enough data" so the user isn't stuck.
- Error (service failure/timeout): keep inputs, Retry, and a route back to Confirm.

### 1.7 Share card
- Triggered from results; Web Share API first (WhatsApp is the main target), fallback Copy link + Download image.
- Image card [ASSUMPTION: 1080×1350 for WhatsApp/Status, plus 1200×630 link preview]: product + variant + condition, asking price, market range bar, verdict with icon + label, confidence level, "Checked on <date>", kitneka URL, short "Estimate, not a guarantee" line.
- Never includes the uploaded screenshot, seller name, phone number, or listing URL by default.
- Shared link opens a read-only snapshot page (frozen at check time, clearly dated) with CTA "Check your own price".

## 2. Design direction: premium, simple, trust-forward results

### Principles
1. Answer first, proof one tap away. Verdict and numbers lead; evidence is always attached, never on a separate hunt.
2. Honest uncertainty. Confidence and evidence quality are first-class UI, never fine print. No number without evidence.
3. Neutral to buyer and seller. Factual wording ("Above market range"), never accusatory ("Scam", "Rip-off").
4. One job per screen. Each step asks one question; nothing decorative competes with the price.
5. Built for real phones and networks. Mid-range Android, patchy 4G: fast first paint, small bundles, skeletons not spinners.
6. Language-ready from day one. RTL-safe layouts, no baked-in text in images, local number formats.
7. Accessible by default. WCAG 2.2 AA is an acceptance criterion, not a polish step.

### Results screen anatomy (top to bottom, mobile)
1. Product header: name, variant line, chips for condition and PTA status, thumbnail only if from user's own image/catalogue.
2. Verdict block: label with icon (Fair / High / Unusually Low), asking price, and a horizontal range bar showing low–high, midpoint tick and the asking-price marker. Text line: "Rs 18,000 (12%) above the market midpoint". The bar always has a text equivalent.
3. Confidence row: level (High/Medium/Low) + evidence quality summary ("14 comparable listings · newest 2 days ago") with an info sheet explaining how it's calculated.
4. Explanation: 2–3 plain sentences.
5. New vs used: new-market range and used-market range as separate rows; official retail price only when verified and labelled as such. Never a single "original price".
6. Sources: rows with source, price, variant, condition, city, retrieval date, outbound link. Footnote of excluded listings and why ("3 excluded: different storage").
7. Sticky bottom bar: Share (primary), Check another.
8. Footer: "Estimate based on listings found on <date>, not a guarantee."

### Visual direction
- Calm, factual, premium: warm off-white background, deep ink text, one confident brand accent, generous whitespace, soft 12–16px radii, minimal shadows.
- Verdict colours never carry meaning alone (icon + text + colour): Fair = green/teal, High = amber (not alarm red), Unusually Low = blue with "Verify before paying" caution, Insufficient = neutral grey. All AA contrast.
- Type: system/Inter-class sans for Latin, tabular figures for all prices; reserve line-height headroom for Noto Nastaliq Urdu later.
- 8pt spacing grid, 16px minimum body, 48px touch targets, 360px minimum width, single column on mobile, two-column results (verdict | sources) from tablet up.
- Motion: subtle, purposeful (range marker settles into place), respects prefers-reduced-motion.

## 3. UI/UX Designer Day 2–4 plan (to G2, Wed 12 Nov)
Owner of all tasks: UI/UX Designer. Reviewer: Design Director. Evidence = real file links (Figma or repo design/), nothing claimed until it exists. [ASSUMPTION: tool is Figma if Founder has a workspace; otherwise exported frames committed to kitne-ka-hq/design/. Designer to confirm Day 2 AM.]

| Day | Task | Acceptance criteria | Dependencies | Status |
|---|---|---|---|---|
| D2 Tue 10 Nov | IA + flow diagrams for 3 entries, Confirm, Analysing, Results, Share | Every state in §1 appears; reviewed by Design Director by EOD | This doc; PM G1 scope | Ready |
| D2 | Low-fi wireframes: Home, 3 entry screens, Confirm, Results (all 5 states), Share card | Mobile 360px; all states framed; review notes resolved | IA above | Ready |
| D3 Wed 11 Nov | Lean design system v0: tokens (colour, type, spacing, radius, elevation) + components (button, input, chip, segmented control, card, range bar, verdict badge, confidence indicator, source row, banner, bottom sheet, skeleton, toast) | Tokens named for code use; every colour pair passes AA; component states (default, focus, disabled, error, loading) | CTO confirms front-end stack for token format | Proposed |
| D3 | Hi-fi: Home, Confirm, Results (Full), Share card | Matches §2 principles; reviewed by Design Director | DS v0; CTO results payload draft | Proposed |
| D4 Thu 12 Nov | Hi-fi remaining states (low confidence, no asking price, insufficient data, errors, empty search, link fallback) + responsive 360/768/1280 | No missing state vs §1 inventory | Above | Proposed |
| D4 | RTL mirror check (Confirm + Results), a11y annotations (focus order, labels, alt text), handoff specs | Annotated; Engineer can build without guessing | Above | Proposed |
| D4 | Design review + fixes → G2 design sign-off pack | Design Director approval recorded; PM confirms scope fit | All above | Proposed |

## 4. Design constraints for the CTO
1. Results payload: asking price (nullable), range low/high, midpoint, diff absolute + %, verdict enum {FAIR, HIGH, UNUSUALLY_LOW, INSUFFICIENT_DATA, NO_ASKING_PRICE}, confidence level + machine-readable reasons, evidence counts (used / excluded with reasons), separate new-market / used-market / verified official retail values each nullable with provenance, sources [name, url, price, variant, condition, city, retrieved_at], explanation text, checked_at.
2. Extraction returns per-field values with confidence so Confirm can flag "Please check" fields; plus a flag for "no price found" and "multiple products".
3. Category-config-driven variant schema (phones need PTA status), so forms render from config and stay extensible.
4. Long jobs expose step-level progress (polling or SSE) so the UI can show real steps; first visual feedback under 1s. [ASSUMPTION: target p50 under ~10s end to end; CTO to set.]
5. Link analysis returns a distinct reason: unsupported source vs not permitted vs fetch failed vs not a product page, so the UI can be honest.
6. Share: server-rendered public snapshot page with unguessable ID, immutable and dated, OG image generation per locale; no screenshot or seller personal data in shared artefacts.
7. Screenshot privacy: strip EXIF, defined retention (Security to set) which the UI will state.
8. i18n: all strings externalised (ICU), dir attribute + CSS logical properties, PKR via Intl (en-PK, ur-PK), no text in images except the server-rendered share card.
9. Performance for low-end Android: client-side image compression before upload, small JS budget [ASSUMPTION ~200 KB gz initial], PWA installable. Android share target (share a screenshot from WhatsApp/gallery straight into Kitne Ka) is high value; flag as post-MVP candidate unless cheap.
10. Recent checks stored locally on device only (no account).

## Open questions (for PM / Founder)
- PTA approved vs non-PTA as a required phone variant? (big price driver in Pakistan)
- Number format: "Rs 125,000" vs lakh grouping "1,25,000"? Recommend Rs with Western grouping plus "1.25 lakh" helper, test with users.
- Condition taxonomy and whether "Refurbished/Kit" is a separate condition.
- Urdu: architecture-only at launch, or a translated UI at launch?
- Brand assets (logo, colours) exist, or does Design define them in D3?
