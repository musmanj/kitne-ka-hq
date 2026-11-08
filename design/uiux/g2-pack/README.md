# Kitne Ka — G2 design handoff pack

**Design Director review: ready for G2, conditional on C1/C2.** Founder owns the G2 gate. C1/C2 artefact changes applied; due EOD12 Nov2026 PKT.
**Review draft, NOT sign-off.** Prepared9 Nov2026 PKT for DD review due **12 Nov2026 midday PKT**. No deadline change, no claim of product/API implementation. All market data in frames is fictional and marked Example.

## Navigation
- [C1/C2 applied + checks](../c1-c2-README.md)
- [IA and flows](../d2-ia-and-flows.md) · [flow export evidence](../render-verification.md)
- [D2 low-fi board](../wireframes/index.html) · [wireframe README](../wireframes/README.md) — unchanged historical artefacts, NOT reissued
- [Design system v0](../design-system/components.html) · [DTCG JSON](../design-system/tokens.json) · [CSS tokens](../design-system/tokens.css) · [contrast report](../design-system/contrast-report.md)
- [D4 hi-fi board](../hifi/index.html) · [thumbnail review](../hifi/thumbnail-review.md) · [WhatsApp-like emulation](../hifi/thumbnail-emulation.html)
- [Responsive768/1280](../responsive/index.html) · [rules](../responsive/README.md)
- [RTL mirrors](../rtl/index.html) · [RTL issues](../rtl/README.md)
- [A11y annotations](../a11y/README.md)
- [Handoff](../handoff/README.md) · [payload mapping](../handoff/payload-mapping.md) · [English ICU source](../handoff/strings.en.json) · [rounding cases](../handoff/rounding-cases.md)
- [D4 README/check summary](../d4-README.md) · [verification](../d4-verification.md) · [changelog](../CHANGELOG.md) · [complete file manifest](../d4-file-manifest.txt)

## Review log — every DD round

## C1/C2 close-out · 9 Nov2026 PKT
**Design Director review: ready for G2, conditional on C1/C2**. Founder owns the G2 gate; this is not Founder gate approval. Changes due EOD12 Nov2026 PKT.
- C1 applied: Most listings text, Fair zone tag, Median tick micro-label; uniform domain includes asking/Fair/listings bounds +5% padding; true-position marker. Geometry tests extended, obsolete fixed-clamp assumptions revised to the new domain rule.
- C2 applied: duplicate asking marker-value label omitted on share; thumbnails re-exported.
- Numeric bar/labels stay LTR in RTL surrounds; validate with Urdu-reading users before Urdu launch. Share/snapshot canonical confirmed fields only, never OCR/listing/seller text.
- CTO v0.5 re-read: PTA+null passing→No-price, stored insufficient→Insufficient NO_STORED_RANGE (no other branch numbers). Transition notes on split frames. Inline evidence sorted match_quality/retrieved_at, cap50 with evidence_total_included/evidence_truncated and ICU notice; excluded counts only. No pagination. Safe confirmed_context and server-built snapshot confirmed.
- Per-branch PTA-unconfirmed rows removed; global caution retained. Fair range caption shortened. No identity/PTA/Option A/B rework. Human Android/WhatsApp thumbnail evidence remains pending; C1/C2 artefact verification does not close that human check.

|Round|Verdict / changes|Evidence/status|
|---|---|---|
|D2 IA/flows|Approved with changes: two-layer outcomes, LOW modifier, PTA options, A/B alternatives, privacy placeholder, global Offline, merged unreadable UI, dated local Recent, share failure fallback, lightweight classify, header language|Applied before low-fi; D2 source/export set exists. Later CTO contract supersedes old PTA-required/unknown-widens wording; see mapping.|
|D2 low-fi|Approved with changes; do not reissue|39 frames remain unchanged. D3 addressed density/visual refinements; D4 insufficient CTA notes below supersede earlier later-retry suggestion.|
|D3 initial hi-fi/system|Approved with changes: unified verdict block, confidence evidence summary, sticky actions, Home hierarchy, compact Confirm, share hierarchy/thumbs|D3 artefacts updated in place; D3 README retained as history with D4 override notice.|
|D4 fixes to D3|Solid marker/ring in dashed overflow, 120px share asking, neutral info caution, distinct focus token, outlined Indicative, flat result sections/count affordance, margin annotations/clean exports, Home/Confirm refinements|Applied in design system and D4 clean+annotated frames; not yet reviewed by DD.|
|D4 addendum1|Median-based verdict; −15%/+10% inclusive Fair; Fair band separate from market range; corrected CTO numerical example; Fair-above-range; split/two-one branch; Indicative only price verdict|Applied; server bands only, actual contract mapped; no browser threshold engine.|
|D4 addendum2|Actual fair_band_low/high; diff_percent fraction, paisa amount; no-price Fair band; branch informational bands; one-decimal Intl with threshold exception copy|Applied; 0.1004 HIGH frame, rounding table/helper tests. Contract rechecked after amendments.|

## Assumptions register
|ID|Assumption|Owner / needed action|
|---|---|---|
|A1|Type-only Kitne Ka identity and deep teal accent; no assets existed|Founder ratify; DD identity review|
|A2|PTA approved/Non-PTA/Not sure; unknown explores separate branches, no blending; missing PTA does not block under CTO draft|Founder ratify; DD reconcile earlier required-answer assumption with CTO nonblocking policy|
|A3|Price Option A lakh vs Option B Western + lakh helper unresolved; clean examples illustrate lakh but do not decide|Founder choose; CTO locale formatter + config|
|A4|Condition A New/Used/Refurbished/Kit-Open box vs B New/Used + grades unresolved|Founder/PM choose; CTO Condition enum currently supports B only|
|A5|Privacy copy is placeholder only; no retention promises approved|Security policy/vendor/rights review|
|A6|English launch, Urdu architecture/RTL readiness; actual translations not supplied|Founder launch-language decision, DD localized typography later|
|A7|React/Vite + Hono TypeScript proposed, no approval|Founder stack approval; CTO integrates agnostic CSS/JSON|
|A8|C1 uniform true-position axis with5% padding, numeric axis stays LTR|DD decision; validate with Urdu-reading users before Urdu launch|

## Open decisions and owners
- **Founder:** A1–A4, A6–A7; no approved brand/taxonomy/grouping assumed.
- **CTO:** v0.5 confirmed context, nullable-price PTA classify and capped inline evidence implementation, contract/schema integration, versioned ICU messages, job retries and matching gates. Field mapping identifies concrete gaps.
- **Security:** origin/rights gating, upload limits, approved policy copy, vendor retention, public consent/expiry/revocation. UI never promises “nothing stored”.
- **DD:** C1/C2 verification/Urdu-user axis validation, threshold wording, density, review all annotated responsive/RTL exports; approve visual pack. G2 sign-off still required.
- **Human QA / Founder delegate:** mid-range Android WhatsApp chat preview + Status thumbnail check, photo/screen-capture evidence.

## Not done / pending
1. **PENDING real-device thumbnail validation:** no human/device evidence available. Emulated image-size checks are NOT a substitute or pass claim.
2. DD review/sign-off of D4, Founder ratification, PM/CTO contract approval.
3. Frontend/backend implementation, live data/source permissions, parsing/schema integration and production regressions.
4. Functional keyboard/screen-reader/TalkBack audit, zoom/reflow/landscape, actual Urdu translation/font/linguistic test.
5. Endpoint behavior tests (classify/branch/offline/consent/etc.) are specified, NOT run. Executed tests here are only contrast pairs, geometry, display strings and image/layout checks.
6. Earlier D2 flows/low-fi remain historical and contain superseded assumptions/numerical language. D4 mapping/handoff is authoritative; do not implement old CTA/unknown-PTA or verdict math from archived artefacts. Low-fi intentionally not reissued.
