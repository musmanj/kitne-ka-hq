# C1/C2 artefact update
**Design Director review: ready for G2, conditional on C1/C2.** Founder owns the G2 gate. Due EOD12 Nov2026 PKT. C1/C2 implemented in place; no Founder-controlled identity/PTA/Option A/B rework, no low-fi reissue.

## Changes
- Uniform linear axis includes min/max of supplied Fair band, listings range and asking with5% span padding. Default asking always plots at true position. Explicit frozen-domain outliers alone clamp; retained regression coverage updated to distinguish these cases.
- No Low/High captions under tint at any breakpoint. Most listings text names the dark segment. Fair tag on zone top-start; Median micro-label on tick. SR equivalent updated.
- Share keeps core marker but drops duplicate price label; hero already carries asking. Normal/Indicative/fallback clean+annotated images and all thumbnails/emulations refreshed.
- Numeric bar and labels dir=ltr inside mirrored RTL UI; **to validate with Urdu-reading users before Urdu launch**.
- Share card/snapshot confirmed canonical catalogue model+variant+condition+PTA only, never raw OCR/listing/seller strings. CTO v0.5 confirmed_context and snapshot DTO mapped.
- PTA+null transition notes on split frames: passing chosen branch→No-price; stored insufficient branch→Insufficient NO_STORED_RANGE, no other branch numbers. No new frame needed.
- Evidence inline expand, sort match_quality DESC/retrieved_at DESC (deterministic source/observation ties), cap50 with evidence_total_included/evidence_truncated and ICU note; excluded counts by reason only. No pagination. Server evidence_newest_effective_at handles freshness over uncapped set.
- Per-branch PTA unconfirmed rows removed, global caution retained. Fair range caption shortened everywhere.

## Verification
- **17/17 geometry tests** pass (prior behaviors retained as appropriate to new domain; new domain/5% padding/label-anchor/LTR cases).
- **9/9 percent display tests**, **85/85 contrast pairs** pass.
- **86 current PNGs nonblank**, all131 PNGs in the UIUX tree decoded/nonblank.33 clean layouts +33 annotated layouts checked for width; no share/footer collision.
- Viewed results-full, results-fair, results-no-price, results-pta-split, share-normal,270px thumbnail and RTL Results; also inspected Indicative share. Fixed potential below-range label/Fair tag overlap by separating their vertical positions. No outstanding render collisions.
- Grep found no forbidden gate-approval wording or obsolete long Fair caption. Review wording uses exact DD verdict; no claim of Founder gate approval.

## Files
[Changed-file manifest](c1-c2-files.txt), [full verification](d4-verification.md), [contrast](design-system/contrast-report.md), [geometry log](handoff/range-test-results.txt), [payload mapping](handoff/payload-mapping.md), [review log/G2 pack](g2-pack/README.md), [changelog](CHANGELOG.md).

## Pending
Human mid-range Android WhatsApp chat/Status check + photo/screen-capture evidence remains PENDING. Urdu-reading-user axis validation required before Urdu launch. Founder assumptions, production implementation and audits remain as previously registered; no new identity/PTA/format decision made.
