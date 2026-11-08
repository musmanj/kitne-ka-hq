> Historical D3 report. D4 updates these design-system/hi-fi files in place; current verdict examples, focus/marker semantics, measurements and dependencies are in [d4-README.md](d4-README.md), [CHANGELOG.md](CHANGELOG.md) and [G2 pack](g2-pack/README.md). D2 low-fi unchanged.

# D3 — Lean identity, design system v0 and hi-fi
Review draft · 9 Nov 2026, PKT. No low-fi frames reissued or modified. All product amounts and evidence are explicitly fictional examples, not a market assessment. No external publishing or commits.

## Deliverables
- [design-system/components.html](design-system/components.html): 13 component families, default/focus/disabled/error/loading previews where applicable; noninteractive N/A states explained. Range has high-clamped, low-clamped, inside and no-marker examples with accessible text.
- [design-system/tokens.json](design-system/tokens.json): DTCG format, typed sRGB colors, dimensions, fonts, shadows, motion, targets.
- [design-system/tokens.css](design-system/tokens.css): corresponding code-named CSS properties and reduced-motion duration.
- [design-system/components.css](design-system/components.css): RTL-safe logical layout, 48px controls/links, 16px minimum body, tabular numbers, 1.6 line-height, 8pt spacing, 12/16px radii, minimal elevation.
- [design-system/contrast.py](design-system/contrast.py), [contrast-pairs.json](design-system/contrast-pairs.json), [contrast-report.md](design-system/contrast-report.md): reproducible WCAG calculation and explicit pair registry.
- [design-system/range.cjs](design-system/range.cjs): logical marker clamp calculation, 5 passing tests (below/inside/above/no price/RTL).
- [hifi/index.html](hifi/index.html): navigation to Home, Confirm A/B, Full, Full+Low, No-price, No-price+Low and normal/Indicative share cards. Each has its own HTML and PNG; all are static review artefacts, not functional workflows.
- [hifi/measurements.json](hifi/measurements.json), [hifi/verification.md](hifi/verification.md), frames.json and render.cjs: reproducible exports, dimensions and checks.
- [d3-file-manifest.txt](d3-file-manifest.txt): exhaustive file list, including all 11 PNGs.

## Identity and decisions
Type-only **Kitne Ka** wordmark, system/Inter-class sans, deep teal accent on warm off-white with deep ink. **[ASSUMPTION, pending Founder approval]**. No image logo or baked-in interface text; share exports are the specified image exception. Verdict colors are semantic and separate from the brand accent: teal Fair, amber High, blue Unusually Low with “Verify before paying”, grey Insufficient. Icon + label + color always accompany verdicts. English-only launch and future Urdu architecture remain pending Founder confirmation. No font download required; Urdu font/translations not yet supplied.

DD changes applied:
1. Results use one verdict block: label/icon → asking price → labelled range + midpoint/asking marker → difference. No-price places range first and input directly beneath; low confidence is an independent modifier.
2. Every D3 result frame includes confidence level, example comparable count and newest date; indicative caution sits adjacent to verdict context.
3. Share primary / Check another secondary in mobile sticky bar.
4. Home has only three primary entry cards; descriptor/icon each; recent list, compact EN header pill, text Privacy link.
5. Confirm product details in one summary with inline Edit; only Please check field expanded. Visible PTA chips, swappable condition options, optional city disclosure control, sticky disabled CTA with reason immediately above.
6. D4 reminder: Insufficient product header, Edit details primary, Try nearby variant secondary, Share tertiary. Remove Check again later. D2 low-fi unchanged as instructed.
7. Both 1080×1350 share cards fill the composition with product, large verdict, price, range, evidence and footer band; Indicative caution adjacent to verdict. Thumbnails included.

## Confirm measurement
Measured at **360×740 CSS px**, DPR 2, system font on box Chrome:
- Option A total page height **1057px = 1.43 screens**.
- Option B total page height **1043px = 1.41 screens**.
- Sticky CTA+reason top **641.4px**, bottom **740px** at initial viewport; reachable within the first viewport. Total page is below 1.5-screen target (1110px).
- Full-page PNG capture expands viewport to page height so sticky UI does not obscure content. Live HTML retains sticky behavior. Alternative font rendering/translations may change measurements.

## Verification
**66/66 defined contrast pairs pass AA**: 4.5:1 text (also applied to all large text), 3:1 non-text UI. Includes semantic tints, labels, boundaries, disabled and focus states. Focus ring has a white separation gap. Decorative shadow/shading not treated as boundaries. This is pair-based verification, not a complete accessibility audit.
**11/11 PNGs nonblank**, decoded with Pillow; mobile 360 CSS px at DPR2, share 1080×1350 CSS px at DPR2, thumbnails 270×338. Viewed Home, Confirm, Full, Indicative share and both thumbnails. Fixed initial share overflow to exact requested dimensions and squeezed condition labels using a two-column chip grid. At thumbnail size verdict/product/asking price remain prominent; supporting source/date/disclaimer text is secondary and should be reviewed on a real WhatsApp device. No dead lower half. No outstanding render failures.

## Dependencies, assumptions and DD review questions
- CTO frontend stack unconfirmed: these are stack-independent tokens and static HTML/CSS, not framework bindings. Need adapter/integration agreement.
- Price Option A (lakh Rs 1,85,000) versus Option B (Western Rs 185,000 + 1.85 lakh helper) remains unresolved. Both Confirm variants and component previews exist; result/share Option A numerals are illustrative, not a decision.
- Condition Option A New/Used/Refurbished/Kit-Open box versus B New/Used with Like new/Good/Fair remains unresolved. B lists grades as swappable design guidance; selection interaction deferred pending taxonomy.
- PTA approved/Non-PTA/Not sure required answer is DD call pending Founder ratification; Not sure widens matching and forces low confidence. Backend implementation and tooltip copy pending CTO.
- Lightweight inline verdict reclassification against existing range pending CTO; fallback full Analysing. Thresholds/confidence method/evidence contracts still CTO-owned.
- Privacy remains exactly “[Privacy line, pending Security policy]” on Home; no retention promises. Security sign-off required.
- Is type-only identity/deep teal approved? Approve Option A/B, confirm thumbnail supporting-text legibility, confirm summary density and focus order before D4 responsive/a11y work.
- Component board is a static state catalogue. Production needs keyboard selection, error announcements, bottom-sheet focus trap/Escape/return focus, live progress and actual locale formatting; these are not claimed implemented. RTL logical layout prepared; full RTL/Urdu and screen-reader audit are D4 work.

## Reproduce
`python3 design-system/contrast.py` and `node design-system/range.cjs`.
For exports install Puppeteer and run `node hifi/render.cjs` (or set PUPPETEER_MODULE for another installed path). Chrome executable path in renderer targets the box. PNG thumbnails derived with Pillow/Lanczos. No low-fi assets regenerated.
