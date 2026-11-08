# Design changelog

## C1/C2 close-out · 9 Nov2026 PKT
**Design Director review: ready for G2, conditional on C1/C2**. Founder owns the G2 gate; this is not Founder gate approval. Changes due EOD12 Nov2026 PKT.
- C1 applied: Most listings text, Fair zone tag, Median tick micro-label; uniform domain includes asking/Fair/listings bounds +5% padding; true-position marker. Geometry tests extended, obsolete fixed-clamp assumptions revised to the new domain rule.
- C2 applied: duplicate asking marker-value label omitted on share; thumbnails re-exported.
- Numeric bar/labels stay LTR in RTL surrounds; validate with Urdu-reading users before Urdu launch. Share/snapshot canonical confirmed fields only, never OCR/listing/seller text.
- CTO v0.5 re-read: PTA+null passing→No-price, stored insufficient→Insufficient NO_STORED_RANGE (no other branch numbers). Transition notes on split frames. Inline evidence sorted match_quality/retrieved_at, cap50 with evidence_total_included/evidence_truncated and ICU notice; excluded counts only. No pagination. Safe confirmed_context and server-built snapshot confirmed.
- Per-branch PTA-unconfirmed rows removed; global caution retained. Fair range caption shortened. No identity/PTA/Option A/B rework. Human Android/WhatsApp thumbnail evidence remains pending; C1/C2 artefact verification does not close that human check.

## D4 · 9 Nov2026 PKT · DD approved D3 with changes; D4 draft pending review
- Updated D3 tokens/system/hi-fi in place; did not regenerate/modify D2 low-fi.
- Corrected all current UI verdict math to server market median/Fair band. High example115000 against median102000 is +13000/+12.7%, not earlier mislabeled +8.8%. Fair108000 above listings range has positional explanation. Unusually Low85000 uses full verification caution.
- Range-v2: separate server Fair zone, market median tick, solid market track and short dashed overflow gutters; semantic core18/28 with white ring, label, both side/inside/no-marker variants. Geometry tests expanded; no UI threshold calculations.
- Neutral info caution; focus plum#653B75 distinct from Unusually Low blue#174F87. Contrast rerun.
- LOW price verdict outlined2px/canvas fill with Indicative chip. No-price/split caution only.
- Share price120px, market track28, evidence inside block, pinned footer, normal/Indicative/fallback crops and emulated sizes. Fixed Indicative footer overlap discovered in render check. Real-device test explicitly pending.
- Result sections flat except verdict; N-source heading/Show all N. Home tile44/glyph24, dated tappable recent row, quiet clear. Confirm Rs prefix, muted placeholder, logical-start city action, selected/focus chips; developer notes moved to toggleable magenta margins.
- Added remaining states, Fair/Low, PTA split two/one branch, threshold-rounding fixture, share preview and confidence sheet. Added768/1280 Home/Confirm/Full and actual RTL mirrors.
- Added per-screen/props/API mapping/ICU/a11y/handoff/G2 pack. Rechecked amended CTO contract; decimal fraction diff_percent and paisa conversion documented; no client inferred verdict from rounded display.

## D3 · 9 Nov2026 PKT · approved with changes
- Lean identity/system, pair-based contrast tests, initial hi-fi and thumbnails; compact Confirm measured within1.5 screens. Historical d3-README lists initial work. Current assets superseded by D4 above.

## D2 · 9 Nov2026 PKT · approved with changes
- IA/flows exported to SVG/PNG; DD revisions applied before39 greyscale wireframes.
- D2 low-fi approved with changes and frozen at explicit DD instruction. Later decisions carried into D3/D4, not backported/reissued.
