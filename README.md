# Kitne Ka HQ

Single source of truth for the Kitne Ka MVP: requirements, plan, architecture, design, decisions, risks and status. Every AI specialist bot works from this repo. Application code lives in a separate repo (see [ADR-0001](architecture/adr/0001-modular-monolith-default.md)), with the name **TBD by the CTO**.

**Founder & CEO:** Muhammad Usman Javed (Asia/Karachi, PKT)
**Goal:** a deployed, functional, responsive, security-reviewed MVP with a live URL, source code and docs in **14 calendar days**.
**Product purpose:** **TBD.** It is not yet confirmed by the Founder, so don't assume anything about it.

## Navigate
| Area | Start here |
|---|---|
| How we work | [docs/00-operating-model.md](docs/00-operating-model.md) |
| 14-day plan and gates | [docs/01-14-day-plan.md](docs/01-14-day-plan.md) |
| Definition of Done / Ready | [docs/02-definition-of-done.md](docs/02-definition-of-done.md) |
| Engineering standards | [docs/03-engineering-standards.md](docs/03-engineering-standards.md) |
| Discovery brief | [product/discovery-brief.md](product/discovery-brief.md) |
| PRD | [product/prd.md](product/prd.md) |
| Backlog and labels | [product/backlog.md](product/backlog.md) |
| Architecture and ADRs | [architecture/README.md](architecture/README.md) |
| Design | [design/README.md](design/README.md) |
| Decisions | [ops/decision-log.md](ops/decision-log.md) |
| Risks | [ops/risk-register.md](ops/risk-register.md) |
| Daily report | [ops/daily-report-template.md](ops/daily-report-template.md) |
| Release checklist | [ops/release-checklist.md](ops/release-checklist.md) |
| Bot charters | [agents/](agents/) |

## Rules of the road
- The live Kanban board is **GitHub Issues and a Project board**. Markdown here holds decisions, not task state.
- Anything not written here or in an issue isn't approved.
- Approval from the Founder is required for the items listed in the [operating model](docs/00-operating-model.md#founder-approval-required).
- Never commit secrets, credentials or personal data.
