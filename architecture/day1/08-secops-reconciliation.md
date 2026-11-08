# SecOps reconciliation — CTO position
9 Nov2026 PKT. All three SecOps proposals read during assessment. Decisions are design commitments, **not implemented controls**. CTO accepts all six challenges; no substantive disagreement. SecOps concurrence and Founder policy/vendor approvals still pending, not asserted received.

|Point|SecOps position|CTO position|Proposed reconciled outcome pending confirmation|Files|
|---|---|---|---|---|
|1 Raw data|No stored raw OCR/provider response|Accept|No raw persistence incl logs/cache/telemetry/backups. Stronger launch: images/raw OCR never leave device; canonical allowlisted facts only, mandatory confirmation.|ADR,03,02,05,00|
|2 Short retention|Unresolved1h/checks24h|Accept|Creation-based non-sliding maximum TTL; cancel/confirm delete unresolved sooner; query-time expiry, cleanup monitoring. Sanitised canonical facts only. Vendor backups/logs cannot silently retain private content past promised lifecycle; actual compliance is release gate.|ADR,03,02,06,00|
|3 Shares|Consent30d/revoke|Accept|Sanitised immutable safe snapshot max30d or earlier display-right expiry; separate creator capability, DELETE/shares/{id}204 idempotent; revoked/expired HTML+PNG410 while minimal tombstone retained. Unknown404. No-store/state gate/CDN purge; already-downloaded copies unrecoverable.|ADR,03,02,00|
|4 Images|Client EXIF stripping not server boundary|Accept with technical clarification, not disagreement|Launch no image ingress. Future path only: byte/magic/MIME/frame/size/pixel validation, bounded safe decode/orientation and server re-encoding/metadata stripping, no original persistence; not just trusting client MIME or stripped EXIF.|ADR,03,05,00|
|5 Environments|Preview URL not isolation|Accept|Distinct staging/prod Workers/deploy keys, Supabase projects preferred (minimum actual separate DB/roles/secrets if SecOps-approved); no prod secrets/data in previews or untrusted PRs; verify free allocations/CI entitlements.|ADR,03,05,06,00|
|6 Gemini|55day abuse retention/age limits; reconsider launch|Accept|Local browser Tesseract +mandatory confirmation, all remote image/models OFF, no model credentials/fallback. Launch model usage$0. Reactivation requires Founder+privacy decision, legal/18+ audience/age-gate assessment, disclosure, vendor retention terms, explicit consent/budget.|ADR,03,02,05,06,00|

## Official terms independently retrieved9 Nov2026 PKT
- https://aistudio.google.com/docs/terms — **“You must be 18 years of age or older”** and API clients must not be directed towards or likely accessed by under18s; paid data treatment differs from unpaid. Paid status does not by itself mean zero retention.
- https://aistudio.google.com/docs/usage-policies — prompts/context/output abuse monitoring **“fifty-five (55) days”**; human review possible; no training/fine-tuning except policy-enforcement models. Detailed receipt/citations in ADR-0002 SecOps section. Do not promise provider24h deletion.
- https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/ — version URL uses existing configuration/resources **“instead of creating a separate environment”**. Separate named Worker environments/resources required.
- https://supabase.com/pricing — free quota is not proof of account availability or backup/erase compliance. No claim existing quotas/entitlements were inspected.

No vendor/customer data sent; no signup/account/API call using private input; no repo push. Outstanding verification: processor backups/PITR/log expiry; cleanup on free-plan pause; HTML/PNG cache revocation; capability redaction; secrets/DB boundaries; rights expiry vs share lifetime. CTO does not waive these controls for Day14.


## Send-ready message to Security & DevOps (not sent)
Please confirm agreement with CTO's reconciliation in `/workspace/kitne-ka/cto/08-secops-reconciliation.md` and ADR-0002/API v0.3–v0.4. I accept all six challenges; no substantive security disagreement remains.

Launch is **browser-only Tesseract plus mandatory user confirmation**, including manual corrections. Remote models, Gemini fallback and image uploads are OFF; no image/raw OCR/provider response/diagnostic payload reaches the server or persistent logs. Only explicit canonical fields cross the boundary. This makes launch model usage cost $0, not a new vendor commitment.

Server TTLs are unresolved fields1h, sanitised checks24h, explicit sanitised shares30d maximum. GET/query authorisation enforces expiry even if cleanup lags. Creator capability revocation is idempotent, destroys snapshot/media and returns410 on HTML and PNG; cache purge/no-store prevents served stale copies. Backups/telemetry cannot bypass retention; no production launch until Supabase backup/recovery and any access-log handling actually meet that requirement.

If image ingress is ever enabled, magic-byte/allowlist, actual-byte/pixel/frame limits, safe decoding, orientation normalisation and server re-encoding/metadata stripping are mandatory. Client EXIF stripping is not a server control. Remote images/models additionally need Founder/privacy approval, vendor age/18+ assessment and a disclosure/consent decision.

Staging/prod need separate Workers, Supabase projects/DB boundaries and secrets; production secrets/data never enter previews. CI/release blocks cover security scan, RLS, expiry/revoke, secret isolation and raw-data absence. Gemini official terms were checked:55-day abuse-monitoring retention is incompatible with our short-retention default without a separate decision. Please confirm these controls and flag implementation-level gaps, especially backups, CDN revocation, capability logging and cleanup verification. Nothing was provisioned, sent, signed up or paid.
