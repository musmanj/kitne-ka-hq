# Day 2 — IA and flows
Working tool: code-based Markdown + Mermaid, with portable SVG/PNG exports (not Figma). Prepared 9 Nov 2026, PKT. Review draft; no approval implied.

Sources read in full: Founder brief (2026-11-09), Design Director Day 1 spec §§1–4. Relative outputs in `flows/`. Diagram node IDs are stable traceability anchors. No real product prices or market evidence are supplied here.

## Assumed defaults
Each is **[ASSUMPTION – pending Founder confirmation]**, supplied by Chief of Staff, not an approved product decision:
- Phone PTA answer required: PTA approved / Non-PTA / Not sure (DD decision, pending Founder ratification). Not sure widens matching and forces low confidence.
- PKR Option A: lakh grouping Rs 1,85,000; Option B: Western Rs 185,000 + x.x lakh helper. Unresolved; swappable UI, not a fixed decision.
- Condition Option A: New/Used/Refurbished/Kit-Open box; Option B: New/Used + Like new/Good/Fair grades. Unresolved; swappable UI.
- English-only launch; Urdu architecture and RTL readiness.
- No brand assets exist; Design creates a lean identity.

Other assumptions: original compression limit/size targets and share dimensions remain provisional; DD-decided outcome order is Error → Insufficient → Range available; range has asking-price-dependent verdict slot and independent low-confidence modifier. A low-confidence range without asking price has a caution banner, reasons and evidence count; adding price produces an Indicative verdict. Retry preserves entry payload and confirmed edits in the current session; switching from failed screenshot extraction to Search retains the image only in-session, not in public output. Clipboard-denial handling, catalogue retry, share cancellation/failure handling and lightweight inline verdict reclassification is pending CTO (fallback full Analysing). No retention duration is promised.

## Diagrams

### 01-ia
```mermaid
flowchart TD
 H[Home: promise / entry cards / categories / privacy placeholder / header language control]
 H --> A[Upload Screenshot]
 H --> B[Paste Product Link]
 H --> C[Search Product]
 A --> CF[Confirm details]
 B --> CF
 C --> CF
 CF --> AN[Analysing]
 AN --> R{Results}
 R --> RF[Full]
 RF & RN --> RL[Low confidence modifier]
 R --> RN[No asking price]
 R --> RI[Insufficient data]
 R --> RE[Error]
 RF & RL & RN & RI --> SH[Share card]
 SH --> SNAP[Public read-only dated snapshot]
 SNAP -->|Check your own price| H
 H --> REC[Recent checks: device-local]
 REC --> STORED[Stored snapshot: Checked n days ago; Check again; Clear recent checks]
 STORED -->|Check again| AN
 H --> PRIV[Privacy info sheet]
 RF & RL & RN --> CONF[How confidence is calculated: info sheet]
```

[SVG](flows/01-ia.svg) · [PNG](flows/01-ia.png)

### 02-entry-a
```mermaid
flowchart TD
 A0[Pick image: gallery / camera / desktop paste or drag] --> A1{Supported and within limit?}
 A1 -->|Unsupported| A2[Unsupported file: explain / pick again]
 A1 -->|Too large| A3[Too large: state configured limit / pick again]
 A2 & A3 --> A0
 A1 -->|Yes| A4[Compress: assumed 1600px / original up to 10 MB pending confirmation]
 A4 --> A5[Preview + privacy line pending Security policy]
 A5 -->|Continue| A6[Extracting: Uploading - Reading text - Identifying product]
 A6 -->|Cancel| A5
 A6 -->|Unreadable| A7[Unreadable image: retake or Search]
 A6 -->|No text| A8[No text found: retake or Search]
 A7 & A8 --> AU[One unreadable UI; variant copy; distinct analytics codes]
 AU -->|Retake| A0
 AU -->|Search; retain image in session: ASSUMPTION| C0[Search entry]
 A6 -->|Outside MVP| A9[Phones / laptops / consoles only; Search]
 A9 --> C0
 A6 -->|Multiple products| A10[Pick one product]
 A10 --> A11{Price visible?}
 A6 -->|Single product| A11
 A11 -->|No| A12[Flag no price: optional asking-price prompt]
 A12 --> CF[Confirm details]
 A11 -->|Yes| CF
 A6 -->|Network unavailable| OFF[Global Offline: retain inputs / auto retry online / Retry]
 OFF --> A6
```

[SVG](flows/02-entry-a.svg) · [PNG](flows/02-entry-a.png)

### 03-entry-b
```mermaid
flowchart TD
 B0[URL field: paste manually or tap Paste] --> B1{Inline URL validation}
 B1 -->|Invalid| B2[Invalid URL: inline correction]
 B2 --> B0
 B1 -->|Valid| B3{Supported and permitted?}
 B3 -->|Unsupported| B4[Unsupported source: name reason]
 B3 -->|Not permitted| B5[Not permitted: name reason; no scraping implication]
 B3 -->|Yes| B6[Extracting]
 B6 -->|Success| CF[Confirm details]
 B6 -->|Fetch failed| B7[Fetch failed: plain reason]
 B6 -->|Non-product page| B8[Not a product page]
 B6 -->|Expired or removed| B9[Link expired / removed]
 B6 -->|Timeout| B10[Timeout: keep link]
 B10 -->|Retry same link| B6
 B4 & B5 & B7 & B8 & B9 & B10 --> FB[Same-screen fallbacks]
 FB -->|Upload listing screenshot| A0[Upload Screenshot]
 FB -->|Enter details manually| BM[Empty Confirm with category picker]
 BM --> CF
 B0 -->|Clipboard denied / unavailable: ASSUMPTION| BP[Keep field editable; manual paste]
 BP --> B0
 B6 -->|No connection| OFF[Global Offline: retain inputs / auto retry online / Retry]
 OFF --> B6
```

[SVG](flows/03-entry-b.svg) · [PNG](flows/03-entry-b.png)

### 04-entry-c
```mermaid
flowchart TD
 C0[Type brand / model / specs; category chips] --> C1{Catalogue search}
 C1 -->|Too short| C2[Too-short query hint]
 C2 --> C0
 C1 -->|No matches| C3[Spelling tips; try brand + model; category browse]
 C3 --> C0
 C1 -->|Unavailable| C4[Catalogue unavailable]
 C4 -->|Retry query preserved: ASSUMPTION| C1
 C1 -->|Matches| C5[Typeahead model matches]
 C5 -->|Pick model| CF[Confirm: model prefilled; asking price optional]
 C1 -->|No connection| OFF[Global Offline: retain inputs / auto retry online / Retry]
 OFF --> C1
```

[SVG](flows/04-entry-c.svg) · [PNG](flows/04-entry-c.png)

### 05-confirm-results
```mermaid
flowchart TD
 CF[Confirm: category / brand / model / variant / swappable condition and PKR / optional city and price]
 CF --> CD[Detected + Edit; Please check focused first]
 CD --> CV{Model + Condition + phone PTA answer set?}
 CV -->|No| CX[Disabled Check price; explain missing field]
 CX --> CF
 CV -->|Yes| CP[Phone PTA: approved / Non-PTA / Not sure]
 CP -->|Not sure: widen matching; force low confidence| AN
 CP -->|Check price| AN[Analysing: Finding listings - Matching variants - Building range; skeleton]
 AN -->|Long| AL[Still checking more sources]
 AL --> AN
 AN -->|Cancel; inputs preserved| CF
 AN --> RB{Layer 1 ordered outcome}
 RB -->|1 Failure or timeout| RE[Error outside verdict enum; inputs preserved]
 RE -->|Retry| AN
 RE -->|Edit| CF
 RB -->|2 Insufficient evidence| RI[Insufficient: no range or verdict; explain why]
 RI -->|Edit / nearby variant / later| CF
 RB -->|3 Range available| RA{Layer 2 verdict slot}
 RA -->|Price absent| RN[No asking price: Add asking price; range + sources]
 RA -->|Price present| RF[Full: verdict + range + sources]
 RN -->|Add asking price| VR[Recheck verdict only against existing range; pending CTO]
 VR -->|CTO accepts| RF
 VR -->|CTO declines| AN
 RF & RN --> LC{Low confidence modifier?}
 LC -->|Yes| RL[Caution + reasons + evidence count; Indicative if verdict present]
 LC -->|No| OK[Unmodified layout]
 RF & RN --> CI[Confidence sheet]
 RF & RN & RI --> SH[Share]
 RF & RN & RI --> RC[Save device-local snapshot; never save Error]
 RC --> REC[Recent: Checked n days ago; Check again; Clear recent checks]
 REC -->|Check again with saved inputs| AN
 RF & RN & RI --> H[Check another: Home]
 AN -->|No connection| OFF[Offline: preserve inputs / auto retry on reconnect / Retry]
 OFF -->|Resume pending operation| AN
```

[SVG](flows/05-confirm-results.svg) · [PNG](flows/05-confirm-results.png)

### 06-share
```mermaid
flowchart TD
 R[Results: Full / Low confidence / No asking price / Insufficient data] --> S0[Build share card + immutable dated snapshot]
 S0 --> SAFE[Product / variant / condition / checked date / confidence / estimate disclaimer; only available result values; low confidence: Indicative + caution line]
 SAFE --> REDACT[Exclude screenshot / seller name / phone / listing URL by default]
 REDACT --> S1{Web Share API available?}
 S1 -->|Yes| S2[Native share sheet; WhatsApp main target]
 S2 -->|Completed| S3[Return to result: ASSUMPTION]
 S2 -->|Cancelled| S3
 S2 -->|Failed: ASSUMPTION| S4[Fallback: Copy link / Download image]
 S1 -->|No| S4
 S4 --> S5[Copy public snapshot link]
 S4 --> S6[Download image]
 S5 --> S7[Public read-only snapshot: unguessable ID / frozen at check time / dated]
 S7 -->|Check your own price| H[Home]
 S0 -->|Insufficient data| SI[Not enough data card: no invented numbers]
 SI --> SAFE
 S0 -->|Generation failed| GF[Share generation failed: Copy link fallback]
 GF --> S5
```

[SVG](flows/06-share.svg) · [PNG](flows/06-share.png)

## State inventory and API dependencies — revised after DD review
CTO references are Design Director §4 item numbers, not existing endpoints. Entry-state rows group codes only where the visible pattern is shared.

|Screen/state|Trigger / visible content|Primary / secondary actions|Payload/API dependency|
|---|---|---|---|
|Home H|Open; three entry cards, categories, header language, privacy placeholder|Choose entry / Recent|§4.8–10|
|Recent REC/STORED/RC|Reopen stored snapshot; Checked n days ago, never current|Check again / Clear recent checks|§4.10; save Full, Low, No-price, Insufficient only; never Error|
|Privacy PRIV|Open sheet; policy placeholder only|Dismiss|§4.7 Security policy pending|
|Upload A0,A1,A4|Pick/validate/compress; limits provisional|Pick / cancel|§4.7,9 configured limits|
|Unsupported A2 / too large A3|Invalid type/size; actual limit shown|Pick again|§4.9 validation config|
|Preview A5|Valid image; [Privacy line, pending Security policy]|Continue / pick again|§4.7 no privacy promises|
|Extracting A6|Upload/read/identify progress|Cancel / wait|§4.2,4; OFF for network loss|
|Unreadable AU; codes A7/A8|Unreadable image OR no text variant copy; one UI|Retake / Search|§4.2 distinct analytics codes|
|Outside category A9|Unsupported product category|Search|§4.3 category config|
|Multiple A10|Multiple candidates|Pick one|§4.2 candidates required|
|No visible price A11/A12|Extracted product without price|Optional price / continue|§4.2 flag, §4.1 nullable asking price|
|URL B0/B1/B2/BP|Inline validation; invalid URL or clipboard unavailable [ASSUMPTION]|Correct / manual paste|§4.5 URL handling|
|Link extraction B3/B6|Supported/permitted URL|Wait|§4.2,4,5; OFF for no connection|
|B4 unsupported / B5 not permitted / B7 fetch failed|Distinct honest reason; same-screen fallback|Screenshot / Manual Confirm|§4.5 reason codes|
|B8 non-product / B9 expired-removed / B10 timeout|Distinct reason, link retained|Retry timeout / screenshot or manual|§4.5 extensions required|
|Fallback FB/BM|Cannot read source; category picker in empty Confirm|Upload / manual entry|§4.2,3|
|Search C0/C1/C5|Catalogue typeahead and category narrowing|Pick / refine|Catalogue contract + §4.3; OFF for no connection|
|C2 short / C3 no matches / C4 unavailable|Hint OR tips+browse OR service error|Type / browse or retry preserved query [ASSUMPTION]|Catalogue query/error contract missing|
|Confirm CF/CD/CV/CX/CP|Detected/Edit; Please check focus; disabled CTA with missing-field reason|Check price / edit|§4.2,3; requires model+condition+phone PTA answer; Not sure widens matching and forces low confidence|
|Confirm swappable controls|Option A/B price and condition unresolved|Edit variant|§4.3,8; no fixed taxonomy or grouping decision|
|Analysing AN/AL|Real steps, skeleton; Still checking more sources|Cancel preserves inputs|§4.4; OFF on network loss|
|Global OFF|Network unavailable; inputs retained|Retry / auto-retry when online|Job resume/retry contract needed for A6,B6,C1,AN|
|Full RF|Range available + price; verdict/range/evidence/provenance|Share / Check another|§4.1 result payload|
|Low confidence RL modifier|Range available, with or without price; banner/reasons/count; Indicative verdict if present|Share / confidence info|§4.1 confidence reasons; Not sure PTA forces modifier|
|No asking price RN|Range available; Add asking price instead of verdict|Recheck verdict only / Share|Existing-range lightweight reclassification pending CTO; fallback AN|
|Insufficient RI|No range/no verdict; evidence explanation and next steps|Edit / nearby variant, later, Share|§4.1 INSUFFICIENT_DATA; beats low confidence|
|Error RE|Failure/timeout; outside verdict enum|Retry / Confirm with inputs|§4.4 job error; no recent save|
|Confidence CI/CONF|Info sheet; methodology explanation|Dismiss|§4.1 reasons/counts; CTO methodology|
|Share SH/S0/SAFE/REDACT/SI|Only available values; insufficient no numbers; low confidence Indicative + caution|Web Share / copy or download|§4.6 immutable public snapshot, no screenshot/seller data|
|Native/fallback S1–S6/GF|Native API first; generation failed -> Copy link|Share / Copy link, Download image|§4.6 snapshot URL must survive image generation failure|
|Public S7/SNAP|Frozen dated read-only snapshot|Check your own price|§4.6 unguessable immutable server page|

## Traceability: Design Director §1 → diagram nodes
- §1.0: header/promise/three entries/category chips/privacy = 01:H; language = 01:H header control; local recent checks = 01:REC. Language is a header control, not a destination. Header logo is a content slot; identity remains assumed.
- §1.1: pick/compress/preview = 02:A0,A1,A4,A5; upload/read/identify/cancel = A6→A5; unsupported = A2; too large = A3; unreadable = A7; no text = A8; no price = A11,A12→CF; outside MVP = A9; multiple products = A10. All converge on Confirm directly or via Search.
- §1.2: paste/inline validation = 03:B0,B1,B2; supported/permitted extraction = B3,B6; unsupported/not permitted/fetch failed = B4,B5,B7; fallbacks = FB,A0,BM; non-product = B8; removed/expired = B9; timeout with preserved-link retry = B10→B6; Confirm = CF.
- §1.3: query/typeahead/category chips = 04:C0,C1,C5; picked model/optional asking price = CF; no matches/tips/browse = C3; short hint = C2; unavailable = C4.
- §1.4: shared fields = 05:CF; Detected/Edit and low-confidence focus = CD; category variants/condition/PKR = CF,CP; optional price and no-verdict outcome = RN; minimum validation/disabled reason = CV,CX.
- §1.5: steps/skeleton = 05:AN; long-running = AL; cancel preserving inputs = AN→CF.
- §1.6: Full = 05:RF; Low confidence = RL; No asking price/inline addition = RN; Insufficient/no numbers/next steps/share = RI; Error/retry/back = RE.
- §1.7: native share = 06:S1,S2; fallback = S4,S5,S6; card fields and exclusion policy = SAFE,REDACT; insufficient card = SI; dated immutable public page + own-check CTA = S7→H. Provisional image dimensions retained as [ASSUMPTION]: 1080×1350 and 1200×630 preview.

## Review log
Design Director: **APPROVED WITH CHANGES** (9 Nov 2026, PKT). Applied:
1. Two-layer result model: four outcomes (Error, Insufficient, Full, No price), plus low-confidence modifier on either range layout; Error outside enum.
2. Phone PTA answer required: approved / Non-PTA / Not sure; Not sure widens matching and forces low confidence (pending Founder ratification).
3. Conflicting price and condition defaults retained as Option A/B, swappable controls.
4. Preview/privacy copy replaced with policy placeholders; no promises.
5. Global OFF state referenced from A6, B6, C1, AN; preserve inputs, reconnect auto-retry, manual Retry.
6. Unreadable/no text share AU UI with distinct A7/A8 analytics codes.
7. Recent saves successful outcomes including Insufficient, excludes Error; stored dated snapshot, Check again, Clear recent checks.
8. Low-confidence share includes Indicative + caution; generation-failed -> Copy link.
9. Inline asking-price action rechecks verdict only against existing range, pending CTO; fallback AN.
10. Language is a Home header control, not destination.

## Open questions and gaps
- PTA DD decision awaits Founder ratification; CTO owns widened-match/forced-confidence mechanics.
- Price Option A [ASSUMPTION – pending Founder confirmation]: lakh grouping Rs 1,85,000. Option B (DD): Western Rs 185,000 + x.x lakh helper. Neither fixed in Confirm.
- Condition Option A [ASSUMPTION – pending Founder confirmation]: New/Used/Refurbished/Kit-Open box. Option B (DD): New/Used with Like new/Good/Fair grades. Neither fixed in Confirm.
- English-only launch with Urdu/RTL architecture and Design-created lean identity remain [ASSUMPTION – pending Founder confirmation]; confirm Urdu timing and brand approval.
- CTO: evidence thresholds, catalogue query/error/candidate contracts, expired/removed/timeout codes, offline retry idempotency, confidence methodology, lightweight verdict reclassification.
- Security: upload limits, actual retention, redaction enforcement, snapshot lifecycle and policy copy. No user-facing privacy promise approved.
- Share copy/download failures and invalid snapshot behavior remain unspecified. Snapshot URL availability if image generation fails needs API support.
- Compression sizing and share 1080×1350 / preview 1200×630 remain source assumptions. No numerical market claim is supplied.

Traceability addendum: OFF references A6/B6/C1/AN; AU merges A7/A8; CP includes Not sure; RA is layer-2 slot; LC/RL modifies RF or RN; VR is inline reclassification; GF is generation-failed copy fallback; STORED/REC are dated saved results. All §1 states remain covered; original §1 five result states are preserved visually but low confidence is now a modifier, not a mutually exclusive outcome.

## Wireframe node anchors

<a id="node-h"></a>
### Node H
See the Mermaid diagram node `H` above and its state inventory row.

<a id="node-a0"></a>
### Node A0
See the Mermaid diagram node `A0` above and its state inventory row.

<a id="node-a5"></a>
### Node A5
See the Mermaid diagram node `A5` above and its state inventory row.

<a id="node-a6"></a>
### Node A6
See the Mermaid diagram node `A6` above and its state inventory row.

<a id="node-a2"></a>
### Node A2
See the Mermaid diagram node `A2` above and its state inventory row.

<a id="node-a3"></a>
### Node A3
See the Mermaid diagram node `A3` above and its state inventory row.

<a id="node-au"></a>
### Node AU
See the Mermaid diagram node `AU` above and its state inventory row.

<a id="node-a9"></a>
### Node A9
See the Mermaid diagram node `A9` above and its state inventory row.

<a id="node-a10"></a>
### Node A10
See the Mermaid diagram node `A10` above and its state inventory row.

<a id="node-a12"></a>
### Node A12
See the Mermaid diagram node `A12` above and its state inventory row.

<a id="node-b0"></a>
### Node B0
See the Mermaid diagram node `B0` above and its state inventory row.

<a id="node-b6"></a>
### Node B6
See the Mermaid diagram node `B6` above and its state inventory row.

<a id="node-fb"></a>
### Node FB
See the Mermaid diagram node `FB` above and its state inventory row.

<a id="node-b2"></a>
### Node B2
See the Mermaid diagram node `B2` above and its state inventory row.

<a id="node-b8"></a>
### Node B8
See the Mermaid diagram node `B8` above and its state inventory row.

<a id="node-b9"></a>
### Node B9
See the Mermaid diagram node `B9` above and its state inventory row.

<a id="node-b10"></a>
### Node B10
See the Mermaid diagram node `B10` above and its state inventory row.

<a id="node-c0"></a>
### Node C0
See the Mermaid diagram node `C0` above and its state inventory row.

<a id="node-c5"></a>
### Node C5
See the Mermaid diagram node `C5` above and its state inventory row.

<a id="node-c3"></a>
### Node C3
See the Mermaid diagram node `C3` above and its state inventory row.

<a id="node-c2"></a>
### Node C2
See the Mermaid diagram node `C2` above and its state inventory row.

<a id="node-c4"></a>
### Node C4
See the Mermaid diagram node `C4` above and its state inventory row.

<a id="node-cf"></a>
### Node CF
See the Mermaid diagram node `CF` above and its state inventory row.

<a id="node-bm"></a>
### Node BM
See the Mermaid diagram node `BM` above and its state inventory row.

<a id="node-an"></a>
### Node AN
See the Mermaid diagram node `AN` above and its state inventory row.

<a id="node-rf"></a>
### Node RF
See the Mermaid diagram node `RF` above and its state inventory row.

<a id="node-rl"></a>
### Node RL
See the Mermaid diagram node `RL` above and its state inventory row.

<a id="node-rn"></a>
### Node RN
See the Mermaid diagram node `RN` above and its state inventory row.

<a id="node-ri"></a>
### Node RI
See the Mermaid diagram node `RI` above and its state inventory row.

<a id="node-re"></a>
### Node RE
See the Mermaid diagram node `RE` above and its state inventory row.

<a id="node-off"></a>
### Node OFF
See the Mermaid diagram node `OFF` above and its state inventory row.

<a id="node-sh"></a>
### Node SH
See the Mermaid diagram node `SH` above and its state inventory row.

<a id="node-safe"></a>
### Node SAFE
See the Mermaid diagram node `SAFE` above and its state inventory row.

<a id="node-s7"></a>
### Node S7
See the Mermaid diagram node `S7` above and its state inventory row.

<a id="node-gf"></a>
### Node GF
See the Mermaid diagram node `GF` above and its state inventory row.

<a id="node-rec"></a>
### Node REC
See the Mermaid diagram node `REC` above and its state inventory row.

<a id="node-ci"></a>
### Node CI
See the Mermaid diagram node `CI` above and its state inventory row.

<a id="node-priv"></a>
### Node PRIV
See the Mermaid diagram node `PRIV` above and its state inventory row.
