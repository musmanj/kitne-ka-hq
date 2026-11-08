# Accessibility annotations — WCAG 2.2 AA design coverage, NOT an audit
Static handoff annotations; no screen-reader/keyboard/device audit or functional behavior claimed. See magenta margin notes on product frames and `../handoff/components.md` for implementation requirements.

## Home
- Landmark: header, main H1, recent section H2, privacy link. Focus order: wordmark home → EN language → Upload Screenshot → Paste Product Link → Search Product → recent snapshot row → Check again → Clear recent checks → Privacy.
- Entry card accessible names use action first then descriptor, e.g. “Upload Screenshot, From a photo you can use”. Decorative glyph aria-hidden; type wordmark link named “Kitne Ka home”. Tile44 is decorative; full action target >=48.
- Recent row is one link with dated context, not nested controls; Check again is a sibling button to avoid nested interactive content. Clear only local records; announce success politely when implemented.

## Confirm
- Focus on first required uncertain field on entry; here Model “Please check”. User should not need to traverse all detected values first. DOM order: header → inline Edit → Model → PTA options → Condition → Asking → Add city → CTA when enabled. Disabled CTA is not focusable; reason visible and associated via aria-describedby.
- All real inputs have `<label for=id>`. Model includes describedby. Price Rs prefix aria-hidden, accessible label says Pakistani rupees, inputmode decimal; parsing/validation must permit configured locale format.
- Product summary is a section with H2. Edit has specific “Edit product details” accessible name. Selected chips aria-pressed; focus preview plum ring and white separation. Production use native radio group with arrow keys OR button group with normal Tab; follow documented component choice, not incomplete radio role simulation.
- PTA Not sure is a real choice; missing/skipped normalises NOT_SURE under CTO proposal; uncertainty in the model still blocks. Taxonomy is pending Founder; never silently select uncertain values.
- Optional city disclosure must expose aria-expanded/controls and move focus to new field. Placeholder is not a label. Inline errors `aria-invalid=true`, error ID describedby and polite/alert summary as appropriate. Sticky reason/CTA remain visible; scroll-padding and scroll-margin128 allow focused inputs to scroll above it. Test small landscape/zoom before acceptance.

## Results
- Focus on result H1 (`tabindex=-1` in application) after completed navigation; announce “Price check complete” in separate role=status aria-live=polite. Do not make the entire long result a live region or reannounce all evidence repeatedly.
- Logical order: product → verdict block → confidence link → new/used → evidence rows / Show all N → Share / Check another. Two-column view keeps this reading sequence in DOM. Do not reorder focus visually with CSS.
- Verdict icon+text+color; low confidence neutral info+reasons+counts. Indicative chip only when LOW price verdict; no-price/split never have one. Error is not a market finding.
- Range graphic `role=img` has text equivalent: “Market range Rs98,800 to Rs1,05,200. Market median Rs1,02,000. Fair band Rs86,700 to Rs1,12,200. Asking Rs1,15,000, above the market range.” No-price adds no asking price/no marker. Split each has separate named branch, no global median or verdict. Visible Fair108000 position line states Fair · above most listings found. Solid marker and ring are identifiable without value label.
- Evidence links include source name, variant and date context. External destination announced consistently; no inaccessible icon-only links. Use observation date for freshness, retrieval date separately, PKT formatting.
- Share dialog: labelled heading, appropriate initial focus, focus trap, Escape, return focus; explicit public consent before publication. Share-resolution does not mean delivered. Copy success role=status; persistent failures require visible fallback.

## Async and media
- Analysing: real steps as ordered list, aria-current=step for current; concise polite status updates only when stage changes, skeleton visuals aria-hidden. No invented percentages. Cancel requests announce “Cancellation requested”, not a promise all remote work stopped.
- Offline: role=status for connection change, preserve entered values, retry once per reconnect with versioned idempotency. Service Error newly occurring can use alert; do not auto-dismiss essential action/reason. No forced focus every poll.
- No product/seller photo used in current frames. If thumbnail added, informative product identity alt text when needed, empty alt if redundant. Uploaded local screenshot preview alt “Your selected screenshot” plus separate review controls, never OCR seller personal data in alt text. Share image alt includes product/verdict or insufficient status, range/median/Fair band/asking if present, confidence/date; linked HTML snapshot remains text-accessible.
- Latin system stack line-height1.6 reserves headroom, but future Noto Nastaliq font needs real rendering tests. CSS logical properties, dir=rtl, bdi isolated numbers; English placeholders are not translation. Numeric bar and labels stay LTR per DD; validate with Urdu-reading users before Urdu launch.
- Motion: prefers-reduced-motion disables animations/transitions; skeleton static, no essential animated information. 48px targets exceed AA24px minimum. Normal text16 minimum. Browser zoom and reflow still require testing.

## Criteria covered by design intent
- 1.1.1 Non-text Content: glyph hiding/alt/graphic equivalent.
- 1.3.1 Info and Relationships; 1.3.2 Meaningful Sequence; 1.3.3 Sensory Characteristics: headings/labels/logical order/icon+copy.
- 1.4.1 Use of Color; 1.4.3 Contrast (Minimum); 1.4.11 Non-text Contrast: contrast registry/report, label+shape+color. 1.4.4 Resize Text, 1.4.10 Reflow, 1.4.12 Text Spacing: responsive design intent, browser checks pending.
- 2.1.1 Keyboard; 2.1.2 No Keyboard Trap; 2.4.3 Focus Order; 2.4.6 Headings and Labels; 2.4.7 Focus Visible; 2.4.11 Focus Not Obscured (Minimum): focus plan/rings/sticky scroll clearance; functional testing pending.
- 2.5.3 Label in Name; 2.5.8 Target Size (Minimum): text action labels and >=48 controls.
- 3.1.1 Language of Page; 3.2.1 On Focus; 3.2.2 On Input: lang en, no surprise automatic submission; users initiate classify/share.
- 3.3.1 Error Identification; 3.3.2 Labels or Instructions; 3.3.3 Error Suggestion; 4.1.2 Name, Role, Value; 4.1.3 Status Messages: implementation contracts above.
No conformance claim: code integration, screen reader, keyboard, zoom400%, landscape, real Android TalkBack/WhatsApp, and Urdu tests are outstanding.

## C1 range text equivalent update
Most listings Rs98,800–1,05,200 identifies the dark segment. Fair tag identifies the tinted Fair range Rs86,700–1,12,200. Median tick is explicitly labelled Median, value Rs1,02,000. Numeric axis uniform LTR; asking Rs1,15,000 plots at true position inside its padded domain. Share omits duplicate marker price visually; SR equivalent still includes asking price.
