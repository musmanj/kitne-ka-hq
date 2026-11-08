# Day 2 low-fi wireframes
Against DD-reviewed flows: approved with changes, all changes applied before framing. These are static greyscale review wireframes, not working product screens or a hi-fi identity. Open index.html as the board; per-frame HTML and PNG links below.

## Layout and export
System font, greyscale, 8pt spacing, 48px controls, tabular figures and logical CSS properties. Screens use 360 CSS px at DPR 2 (720 physical PNG px); share card is the explicit exception: 1080×1350 CSS px at DPR 2 (2160×2700 PNG). Content scrolls; Confirm CTA uses sticky bottom positioning. Flow node links resolve to explicit anchors in ../d2-ia-and-flows.md.

## Assumptions / unresolved decisions
- Phone PTA DD decision pending Founder ratification: approved / Non-PTA / Not sure; required answer; Not sure widens matching and forces low confidence.
- Price controls swappable: Option A lakh Rs 1,85,000 [ASSUMPTION – pending Founder confirmation]; Option B Western Rs 185,000 + 1.85 lakh helper. Result numerals illustrate Option A only, explicitly fake, not adoption of that default.
- Condition controls swappable: Option A New/Used/Refurbished/Kit-Open box; Option B New/Used with Like new/Good/Fair. Neither fixed.
- English launch, Urdu architecture and no existing brand assets remain assumptions pending Founder confirmation. CSS is RTL-ready structurally; no claim of completed Urdu translation or full RTL/a11y audit.
- Compression limits, catalogue thresholds and confidence thresholds not invented. Policy placeholder only, no privacy promises.
- Inline asking price: recheck verdict only against existing range pending CTO, otherwise full Analysing.
- Static controls and disabled reason are illustrative. No scripts submit or publish anything. Fake example source domain is nonresolving example.invalid. PNG rendering is local only.

## Review questions / gaps
1. Ratify PTA rules, Option A/B condition taxonomy and PKR format; agree validation contract.
2. CTO: confidence thresholds, Not sure matching, lightweight reclassification, offline resume/idempotency, source/catalogue reason codes.
3. Security: approved policy copy, retention, redaction and upload limits.
4. Snapshot URL must remain available if share-image generation fails. Copy/download failure and invalid snapshot behavior remain undefined in spec.
5. Static wireframes group unreadable/no-text and source-fallback variants with clearly marked variant copy; production shows only actual returned reason. No browser/network integration or functional focus behavior is claimed.
6. All requested states are framed. Dedicated mobile Full and No-price low-confidence modifier frames are included; share card uses indicative example. Hi-fi, interaction prototype and formal accessibility review remain later work.

## Frames
- [Home](01-home.html) · [PNG](png/01-home.png) · node H
- [Upload — picker](02-upload.html) · [PNG](png/02-upload.png) · node A0
- [Upload — preview](03-preview.html) · [PNG](png/03-preview.png) · node A5
- [Upload — extracting](04-extracting.html) · [PNG](png/04-extracting.png) · node A6
- [Unsupported file](05-file-unsupported.html) · [PNG](png/05-file-unsupported.png) · node A2
- [File too large](06-file-large.html) · [PNG](png/06-file-large.png) · node A3
- [Unreadable / no text — shared UI](07-unreadable.html) · [PNG](png/07-unreadable.png) · node AU
- [Outside MVP categories](08-outside.html) · [PNG](png/08-outside.png) · node A9
- [Multiple products](09-multiple.html) · [PNG](png/09-multiple.png) · node A10
- [No price visible — Confirm prompt](10-no-visible-price.html) · [PNG](png/10-no-visible-price.png) · node A12
- [Paste Product Link](11-link.html) · [PNG](png/11-link.png) · node B0
- [Link — extracting](12-link-extract.html) · [PNG](png/12-link-extract.png) · node B6
- [Link — source fallback variants](13-link-fallback.html) · [PNG](png/13-link-fallback.png) · node FB
- [Invalid URL](14-invalid-url.html) · [PNG](png/14-invalid-url.png) · node B2
- [Not a product page](15-non-product.html) · [PNG](png/15-non-product.png) · node B8
- [Expired / removed link](16-expired.html) · [PNG](png/16-expired.png) · node B9
- [Link timeout](17-link-timeout.html) · [PNG](png/17-link-timeout.png) · node B10
- [Search — entry](18-search.html) · [PNG](png/18-search.png) · node C0
- [Search — typeahead](19-typeahead.html) · [PNG](png/19-typeahead.png) · node C5
- [Search — no matches](20-no-matches.html) · [PNG](png/20-no-matches.png) · node C3
- [Search — too short](21-short.html) · [PNG](png/21-short.png) · node C2
- [Search — catalogue unavailable](22-catalogue-error.html) · [PNG](png/22-catalogue-error.png) · node C4
- [Confirm — disabled CTA](23-confirm.html) · [PNG](png/23-confirm.png) · node CF
- [Confirm — empty manual fallback](24-manual-confirm.html) · [PNG](png/24-manual-confirm.png) · node BM
- [Analysing — long running](25-analysing.html) · [PNG](png/25-analysing.png) · node AN
- [Results — Full](26-full.html) · [PNG](png/26-full.png) · node RF
- [Results — Full + low-confidence modifier](27-full-low.html) · [PNG](png/27-full-low.png) · node RL
- [Results — No asking price](28-no-price.html) · [PNG](png/28-no-price.png) · node RN
- [Results — No price + low-confidence modifier](29-no-price-low.html) · [PNG](png/29-no-price-low.png) · node RL
- [Results — Insufficient data](30-insufficient.html) · [PNG](png/30-insufficient.png) · node RI
- [Results — Error](31-error.html) · [PNG](png/31-error.png) · node RE
- [Global — Offline](32-offline.html) · [PNG](png/32-offline.png) · node OFF
- [Share — options](33-share.html) · [PNG](png/33-share.png) · node SH
- [Share card — indicative example](34-share-card.html) · [PNG](png/34-share-card.png) · node SAFE
- [Public snapshot — frozen read-only](35-snapshot.html) · [PNG](png/35-snapshot.png) · node S7
- [Share — generation failed](36-share-failed.html) · [PNG](png/36-share-failed.png) · node GF
- [Recent — stored snapshot](37-recent.html) · [PNG](png/37-recent.png) · node REC
- [Confidence — info sheet](38-confidence.html) · [PNG](png/38-confidence.png) · node CI
- [Privacy — policy placeholder](39-privacy.html) · [PNG](png/39-privacy.png) · node PRIV

## Rendering verification
See [verification.md](verification.md). All 39 PNGs are nonblank. Confirm and Share card visually reviewed. For portable re-rendering install puppeteer, then run `node render.cjs`; set `PUPPETEER_MODULE` only if using a nonstandard installation. Chrome executable is configured for the box and may need adjustment elsewhere.
