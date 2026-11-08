# Share thumbnail review — emulated comparison + human test PENDING
## Human acceptance (not performed)
**PENDING: a human with a mid-range Android must check both WhatsApp chat preview and Status.** Capture a photo or screen recording/screenshot as evidence, including device model, Android/WhatsApp version, display scaling/font setting, chat image unopened/opened and Status. Ask them to read product, verdict/Indicative, asking price, low-confidence caution, date/disclaimer without zoom. No physical-device evidence exists in this pack and no “WhatsApp legibility passed” claim is made.

Owner: Founder/QA human delegate; DD reviews evidence. Do not confuse local browser screenshots with app/device proof. No messages or Status were sent by this task.

## Executed emulation
Four share compositions: normal, Indicative, and fallback safe crops of each. Full source1080×1350 at DPR2. Lanczos thumbnails generated at180×225 (small chat),270×338 (typical preview),320×400 (larger preview),360×450 (full-width Status image region). Browser comparison boards render actual images at those CSS widths with DPR2; Status simulation letterboxes the360×450 image in a360×640 area. These are WhatsApp-like dimensions, not an exact app UI or a compression/device simulation.

See `thumbnail-emulation.html`, `status-emulation.html`, `png/thumbnail-emulation.png`, `png/status-emulation.png`, and thumbnails in `png/`.

|Metric|180-wide|270-wide|360-wide|Interpretation|
|---|---:|---:|---:|---|
|Asking price120px source|20px|30px|40px|Dominant, clearly separated from range values|
|Verdict64px source|10.7px|16px|21.3px|Icon + label visible; Indicative chip before verdict|
|Product48px source|8px|12px|16px|Small at180; requires human check|
|Supporting difference24px source|4px|6px|8px|Too small to guarantee reading; fallback removes this line|
|Evidence26px source|4.3px|6.5px|8.7px|Secondary, not guaranteed legible unopened|
|Footer28px source|4.7px|7px|9.3px|Secondary; full image/text snapshot required for accessible reading|

Comparison observation: hero/asking hierarchy survives downsampling much better than supporting text. Indicative + neutral caution remain adjacent; real WhatsApp resizing/compression and mid-range display need validation. Supporting text is not declared legible at smallest size. Full snapshot contains accessible text.

## Defined fallback safe crop
Use `share-normal-fallback.html` or `share-indicative-fallback.html` and their1080×1350 exports. This is a **reflowed safe crop**, not blindly cutting pixels: drop only `.supporting-line` (difference explanation), keep product, icon/verdict/Indicative+caution, asking120, Fair/range/median graphic, evidence and pinned date/URL/disclaimer. No crop through footer or low-confidence caution. Keep48px outer safe inset. If the human still cannot read the critical verdict/caution at270, DD must approve a hero-only companion/OG crop; not approved or claimed delivered here. No automatic production crop policy chosen.

## C2 refresh
C1 labels/linear domain applied; duplicate marker price removed from share images. All16 sized thumbnails,2 legacy-name previews and2 browser comparison PNGs refreshed. Viewed normal share at270px: price/label hierarchy intact; real-device evidence is still pending, not replaced by emulation.
