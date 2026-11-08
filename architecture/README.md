# Architecture

Owner: CTO · Status: **Proposed.** The stack is TBD until the product purpose is confirmed and G2 passes.

## Contents
- `adr/`: Architecture Decision Records. Start from [0000-template](adr/0000-template.md).
- `system-overview.md`: context and container diagram (**TBD**, by G2)
- `data-model.md`: ERD and indexing notes (**TBD**, by G2)
- `api/`: API contract (**TBD**, by G2)
- `threat-model.md`: STRIDE-lite (owned by SEC, **TBD**, by G2)

## Defaults (until superseded by an ADR)
- A modular monolith ([ADR-0001](adr/0001-modular-monolith-default.md))
- Layering: `ui → application (use cases) → domain ← infrastructure (adapters)`
- API-first contract, a relational DB with migrations, managed hosting with preview envs
- Separate repos: `kitne-ka-hq` (docs) and an application repo (**name TBD**, CTO recommendation)

## ADR rules
- Number them sequentially. Status is one of Proposed / Accepted / Superseded.
- Compare at least 2 options for any major choice.
- Founder approval for vendor commitments or spend, recorded in [decision-log](../ops/decision-log.md).

## ADR index
| # | Title | Status |
|---|---|---|
| 0001 | Modular monolith as default architecture | Proposed |
| 0002 | Tech stack selection | TBD |
