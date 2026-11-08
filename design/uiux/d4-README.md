> Current DD review: ready for G2, conditional on C1/C2. C1/C2 changes are documented in [c1-c2-README.md](c1-c2-README.md); Founder owns the gate.

# D4 — hi-fi revisions and G2 handoff
Review draft · 9 Nov2026 PKT · due to DD midday12 Nov2026 PKT. **Not a G2 sign-off.** Updated D3 assets in place; **D2 low-fi untouched and not reissued**. See [CHANGELOG.md](CHANGELOG.md) for every DD round and [G2 pack](g2-pack/README.md) for owners/assumptions/pending work.

## Delivered files
- `design-system/`: updated tokens.json (DTCG), tokens.css, components.css, components.html, contrast.py, contrast-pairs.json, contrast-report.md and tested range.cjs.
- `hifi/`: 25 frames, clean + magenta-margin annotated DPR2 PNGs, normal/Indicative/fallback share cards, thumbnails at180/270/320/360, browser chat-like/Status-like comparison boards/PNGs, thumbnail review plan.
- `responsive/`: Home, Confirm and Results Full at768/1280, clean+annotated PNGs, rules, metrics and index.
- `rtl/`: Confirm/Results dir=rtl layout checks (English placeholders, not translation), clean+annotated PNGs, documented LTR numeric axis decision and Urdu-user validation.
- `a11y/README.md`: focus/names/labels/roles/live regions/alt/range equivalent/48px/reduced-motion guidance, named WCAG2.2AA criteria, no audit claim.
- `handoff/`: screen/token spacing specs, component interfaces/states, actual CTO contract field mapping/mismatches, ICU-ready English strings, rounding helper/cases and test logs.
- `g2-pack/README.md`: linked review pack, all DD review rounds, assumptions register, decision owners and not-done list.
- `build-d4.py`, `render-d4.cjs`, `verify-d4.py`, `d4-frames.json`, `d4-measurements.json`, `d4-verification.md`: source/render/check evidence.
- [d4-file-manifest.txt](d4-file-manifest.txt): exhaustive current D3/D4 file paths (portable relative links).

## DD changes applied
Range-v2 has server market median/Fair band, labelled endpoints, solid track, short dashed overflow gutters and semantic18px marker+white ring (28px share). Same core inside range, mirrored below-range, no marker when no asking price. Fair108000 is above the listings range but within the server Fair band and explicitly labelled so. High115000 is +13000/+12.7% vs market median102000; Unusually Low85000 has full verification caution. UI never computes Fair thresholds or verdicts.

No-price Fair band remains; split branches stay separate, LOW, no combined median/difference/verdict and no Indicative chip. One-branch variant explains missing data. LOW price verdicts use2px outline/canvas with Indicative chip; caution neutral+info, blue reserved Unusually Low. Focus token is distinct plum **#653B75**, not blue#174F87.

Share asking120px, track28px, caption removed, evidence inside block, footer pinned with no dead lower half. Fallback safe crop removes supporting difference line without losing verdict/price/caution/footer. Home tiles44/glyph24, fully tappable dated recent row and quiet clear. Confirm has Rs prefix, muted swappable placeholder, selected/focus chips and start-aligned city disclosure; metadata is outside product in toggleable magenta margins. Results flat sections/dividers, evidence count heading/Show all N. Insufficient action hierarchy has no Check again later.

## Measurements and checks
- **33 frames:**25 hi-fi,6 responsive,2 RTL. Each clean + annotated DPR2 export. Annotated margin adds352 CSS px, product width unchanged.
- **86 current D4 PNGs nonblank.** Also decoded pixel content (nonblank RGB variation) of **all131 PNGs** including unchanged D2 exports. Clean mobile720 physical px; tablet1536; desktop2560; share2160×2700. No horizontal overflow or share/footer collision.
- **85/85 defined contrast pairs pass AA** (text4.5, non-text3); disabled also tested. Median tick two-tone separation. Pair report is not an accessibility audit.
- **17/17 geometry tests pass**, including retained above/below/in-range/clamp/no-price/server-band cases plus true-domain/5% padding/label anchors/LTR axis.
- **9/9 display tests pass**, decimal fraction + Intl1decimal, threshold hygiene0.1004 HIGH→“just over10% above the market median”; signed lower-bound case and table included. No server pricing-engine tests claimed.
- Confirm at360×740: **883px total (1.19 screens)** for Option A; **827px (1.12 screens)** for B. Sticky CTA+reason reaches bottom740 in initial viewport. Both below1110px target. Exact rects in metrics.
- Visually reviewed Insufficient, Unusually Low,1280 Results, RTL Results, share normal/Indicative +270px thumbnails; additionally split-one-branch/no-price/threshold/annotation/emulated comparison. Fixed Indicative footer overlap, long annotation-identifier overflow, and awkward English RTL compound phrasing. Final layouts pass checks; no outstanding rendering failures.

## Pending / decisions
**PENDING HUMAN DEVICE CHECK:** mid-range Android, WhatsApp chat preview + Status, photo/screen capture evidence. Emulated sizes demonstrate hero/price hierarchy, but supporting text is not guaranteed readable at180/270. No device/WhatsApp pass claim.

Founder: lean identity, PTA behavior, price A/B, conditions, English/Urdu launch and React/Vite+Hono stack. All remain assumptions. Security: rights/upload/vendor/retention/approved policy copy (placeholder retained). CTO: v0.5 confirmed context, nullable-price PTA classification and inline capped evidence, real API/config/ICU integration. DD: C1/C2 final verification and Urdu-user validation, boundary wording, device evidence and G2 review. See mapping for details.

Static review artefacts only: not production frontend/backend, not a full interaction prototype, not keyboard/TalkBack/zoom/Urdu audit. Existing D2 frames retain historical assumptions by instruction; D4 handoff overrides them for implementation.

## Reproduce
With Python3+Pillow+BeautifulSoup and installed Puppeteer/Chrome:
1. `python3 build-d4.py` (rebuild static frame sources; not low-fi)
2. `node render-d4.cjs` (set PUPPETEER_MODULE for nonstandard install; Chrome path may need adjustment)
3. `python3 hifi/make-thumbnails.py` then `node hifi/render-thumbnails.cjs`
4. `python3 verify-d4.py`, `python3 design-system/contrast.py`, `node design-system/range.cjs`, `node handoff/format-difference.cjs`
`FRAME_FILTER` can select a frame-name regex for incremental export; measurements merge by folder/name. Actual app endpoints are never called by this workflow.

## Frame list
- [hifi/home](hifi/home.html) · [clean](hifi/png/home.png) · [annotated](hifi/png/annotated/home.png)
- [hifi/confirm](hifi/confirm.html) · [clean](hifi/png/confirm.png) · [annotated](hifi/png/annotated/confirm.png)
- [hifi/confirm-option-b](hifi/confirm-option-b.html) · [clean](hifi/png/confirm-option-b.png) · [annotated](hifi/png/annotated/confirm-option-b.png)
- [hifi/results-full](hifi/results-full.html) · [clean](hifi/png/results-full.png) · [annotated](hifi/png/annotated/results-full.png)
- [hifi/results-full-low](hifi/results-full-low.html) · [clean](hifi/png/results-full-low.png) · [annotated](hifi/png/annotated/results-full-low.png)
- [hifi/results-no-price](hifi/results-no-price.html) · [clean](hifi/png/results-no-price.png) · [annotated](hifi/png/annotated/results-no-price.png)
- [hifi/results-no-price-low](hifi/results-no-price-low.html) · [clean](hifi/png/results-no-price-low.png) · [annotated](hifi/png/annotated/results-no-price-low.png)
- [hifi/results-fair](hifi/results-fair.html) · [clean](hifi/png/results-fair.png) · [annotated](hifi/png/annotated/results-fair.png)
- [hifi/results-unusually-low](hifi/results-unusually-low.html) · [clean](hifi/png/results-unusually-low.png) · [annotated](hifi/png/annotated/results-unusually-low.png)
- [hifi/results-threshold-rounding](hifi/results-threshold-rounding.html) · [clean](hifi/png/results-threshold-rounding.png) · [annotated](hifi/png/annotated/results-threshold-rounding.png)
- [hifi/results-pta-split](hifi/results-pta-split.html) · [clean](hifi/png/results-pta-split.png) · [annotated](hifi/png/annotated/results-pta-split.png)
- [hifi/results-pta-split-one](hifi/results-pta-split-one.html) · [clean](hifi/png/results-pta-split-one.png) · [annotated](hifi/png/annotated/results-pta-split-one.png)
- [hifi/results-insufficient](hifi/results-insufficient.html) · [clean](hifi/png/results-insufficient.png) · [annotated](hifi/png/annotated/results-insufficient.png)
- [hifi/results-error](hifi/results-error.html) · [clean](hifi/png/results-error.png) · [annotated](hifi/png/annotated/results-error.png)
- [hifi/offline](hifi/offline.html) · [clean](hifi/png/offline.png) · [annotated](hifi/png/annotated/offline.png)
- [hifi/search-empty](hifi/search-empty.html) · [clean](hifi/png/search-empty.png) · [annotated](hifi/png/annotated/search-empty.png)
- [hifi/link-fallback](hifi/link-fallback.html) · [clean](hifi/png/link-fallback.png) · [annotated](hifi/png/annotated/link-fallback.png)
- [hifi/recent-snapshot](hifi/recent-snapshot.html) · [clean](hifi/png/recent-snapshot.png) · [annotated](hifi/png/annotated/recent-snapshot.png)
- [hifi/share-failed](hifi/share-failed.html) · [clean](hifi/png/share-failed.png) · [annotated](hifi/png/annotated/share-failed.png)
- [hifi/confidence-info](hifi/confidence-info.html) · [clean](hifi/png/confidence-info.png) · [annotated](hifi/png/annotated/confidence-info.png)
- [hifi/share-preview](hifi/share-preview.html) · [clean](hifi/png/share-preview.png) · [annotated](hifi/png/annotated/share-preview.png)
- [hifi/share-normal](hifi/share-normal.html) · [clean](hifi/png/share-normal.png) · [annotated](hifi/png/annotated/share-normal.png)
- [hifi/share-indicative](hifi/share-indicative.html) · [clean](hifi/png/share-indicative.png) · [annotated](hifi/png/annotated/share-indicative.png)
- [hifi/share-normal-fallback](hifi/share-normal-fallback.html) · [clean](hifi/png/share-normal-fallback.png) · [annotated](hifi/png/annotated/share-normal-fallback.png)
- [hifi/share-indicative-fallback](hifi/share-indicative-fallback.html) · [clean](hifi/png/share-indicative-fallback.png) · [annotated](hifi/png/annotated/share-indicative-fallback.png)
- [responsive/home-768](responsive/home-768.html) · [clean](responsive/png/home-768.png) · [annotated](responsive/png/annotated/home-768.png)
- [responsive/confirm-768](responsive/confirm-768.html) · [clean](responsive/png/confirm-768.png) · [annotated](responsive/png/annotated/confirm-768.png)
- [responsive/results-full-768](responsive/results-full-768.html) · [clean](responsive/png/results-full-768.png) · [annotated](responsive/png/annotated/results-full-768.png)
- [responsive/home-1280](responsive/home-1280.html) · [clean](responsive/png/home-1280.png) · [annotated](responsive/png/annotated/home-1280.png)
- [responsive/confirm-1280](responsive/confirm-1280.html) · [clean](responsive/png/confirm-1280.png) · [annotated](responsive/png/annotated/confirm-1280.png)
- [responsive/results-full-1280](responsive/results-full-1280.html) · [clean](responsive/png/results-full-1280.png) · [annotated](responsive/png/annotated/results-full-1280.png)
- [rtl/confirm-rtl](rtl/confirm-rtl.html) · [clean](rtl/png/confirm-rtl.png) · [annotated](rtl/png/annotated/confirm-rtl.png)
- [rtl/results-full-rtl](rtl/results-full-rtl.html) · [clean](rtl/png/results-full-rtl.png) · [annotated](rtl/png/annotated/results-full-rtl.png)
