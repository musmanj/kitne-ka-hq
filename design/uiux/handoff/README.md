# D4 implementation handoff — framework agnostic
Review draft, not production component code. CSS custom properties + DTCG JSON are the sources. CTO proposes React/Vite + Hono (TypeScript), **pending Founder approval**. No React bindings are included. All frame values are examples; no product facts or live offers asserted.

- [Screen specs](screens.md)
- [Component props/states](components.md)
- [Actual CTO payload mapping + mismatches](payload-mapping.md)
- [English ICU-ready strings](strings.en.json)
- [Rounding cases](rounding-cases.md) and [tested display helper](format-difference.cjs)
- [A11y annotations](../a11y/README.md)
- [Responsive rules](../responsive/README.md)
- [RTL mirror decisions](../rtl/README.md)
- [Thumbnail evidence plan](../hifi/thumbnail-review.md)
- [G2 review/dependencies register](../g2-pack/README.md)

## Implementation invariants
Error > Insufficient > Range. Low confidence modifies any Range layout; Indicative only for price verdict. Server verdict, market median, Fair-band Money fields and difference fraction are authoritative. Never use market-range endpoints as verdict thresholds. No-price retains Fair band and has no asking marker. Split has independent labelled branches, no merged median/verdict and no Indicative label.

All public publishing requires explicit share-preview consent and returned snapshot URL. These artefacts do not create public snapshots or call service endpoints. Never show seller identity, uploaded screenshot or target listing URL by default. Privacy placeholder awaits Security.

## Open integration dependencies
Founder: lean identity, PTA behavior, price Option A/B, conditions, English-only launch/Urdu timing, proposed stack.
CTO: category config, implementation of v0.5 inline capped evidence and nullable-price PTA classify, versioned ICU reason resources, job/offline behavior and API implementation.
Security: upload-origin rights gate, policy/retention/privacy copy, public snapshot lifecycle, vendor posture. PM/Legal source permissions remain blocking, not a UI bypass.
DD: RTL axis direction, threshold-boundary phrasing, annotated handoff and thumbnail human check. No G2 sign-off implied.

## DD C1/C2 decisions and CTO v0.5 closure
Share card/snapshot use confirmed canonical catalogue model + variant + condition + PTA only; never raw OCR/listing title/seller-entered strings. Numeric axis always LTR, surrounding UI mirrors; validate with Urdu-reading users before Urdu launch. PTA chosen with null price: passing branch No-price; stored insufficient branch Insufficient/NO_STORED_RANGE, no fallback to other branch. Inline included observations sorted by match quality then retrieved_at, cap50, evidence_total_included/evidence_truncated notice; excluded counts only. No pagination. These contract decisions are resolved in v0.5; implementation/integration tests remain pending.
