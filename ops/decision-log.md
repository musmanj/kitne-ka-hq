# Decision Log

Append-only. Newest at the top. Times in PKT (UTC+5).

| # | Date | Decision | Options considered | Rationale | Decided by | Links |
|---|---|---|---|---|---|---|
| D-007 | 2026-11-09 | Design Director review: G2 design pack ready, conditions C1/C2 closed; Founder G2 decision due 2026-11-12. | — | — | Design review complete | — |
| D-006 | 2026-11-09 | CTO and SecOps reconciled: launch OCR is browser-local Tesseract only, Gemini/remote models off, no raw OCR stored, retention 1h unresolved / 24h sanitised checks / 30d consented shares; launch model cost $0 (optional $5 Worker contingency). Pending Founder at G1. | — | — | Proposed | — |
| D-005 | 2026-11-09 | Day 1 joint assessment: no broad PK marketplace source cleared for automated ingestion; CTO recommends React/Vite + Hono on Cloudflare Workers + Supabase, browser Tesseract OCR with an optional paid Gemini Flash-Lite fallback; pending Founder decision at G1. | — | — | Proposed | — |
| D-004 | 2026-11-09 | Founder product brief received and accepted as the basis for discovery. Sprint Day 1 = 2026-11-09. G1 = 2026-11-10, G2 = 2026-11-12, G3 = 2026-11-18, G4 = 2026-11-21, launch = 2026-11-22. | — | The brief is the Founder's product input. The deadline cannot move without Founder approval. | Founder | [Brief](../product/founder-brief-2026-11-09.md) |
| D-003 | TBD | Modular monolith default (ADR-0001) | Monolith / microservices / serverless | Speed, simplicity | CTO (pending) | [ADR-0001](../architecture/adr/0001-modular-monolith-default.md) |
| D-002 | 2026-11-08 | Timeline is 14 calendar days to a live MVP, with discovery and build overlapping (progressive elaboration) | 1–2 week discovery first / overlapped | Founder priority is execution | Founder | [Plan](../docs/01-14-day-plan.md) |
| D-001 | 2026-11-08 | Create the private `kitne-ka-hq` repo as the shared knowledge base. The app repo is separate if the CTO recommends it. | — | A single source of truth for all bots | Founder | — |
