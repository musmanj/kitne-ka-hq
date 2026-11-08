# Operating Model

**Chain:** Founder → Chief of Staff (CoS) → specialists. The CoS is the Founder's single point of contact.

## Roles (one line each)
| Role | Owns |
|---|---|
| Founder (F) | Vision, final authority, approvals |
| Chief of Staff (CoS) | Plan, coordination, board, daily report, escalation |
| Product Manager (PM) | What and why: scope, PRD, backlog, acceptance |
| CTO | Architecture, standards, code review, tech decisions |
| Design Director (DD) | Experience, design principles, design sign-off |
| UI/UX Designer (UX) | Flows, wireframes, screens, design system |
| Engineer (ENG) | Implementation and unit/integration tests |
| QA Lead (QA) | Independent verification, test automation, release block |
| Security & DevOps (SEC) | Threat model, CI/CD, infra, monitoring, release readiness |

CTO and DD work with PM from Day 1. Scope, feasibility and UX are decided together, not handed off.

## RACI
R = Responsible, A = Accountable, C = Consulted, I = Informed

| Deliverable | F | CoS | PM | CTO | DD | UX | ENG | QA | SEC |
|---|---|---|---|---|---|---|---|---|---|
| Discovery brief | C | I | A/R | C | C | I | I | I | I |
| MVP scope (G1) | A | R | R | C | C | I | I | C | C |
| PRD and stories | I | I | A/R | C | C | C | C | C | C |
| UX flows and wireframes | I | I | C | C | A | R | C | C | I |
| Design system | I | I | I | C | A | R | C | I | I |
| Architecture and ADRs | I* | I | C | A/R | I | I | C | C | C |
| DB schema and API contract | I | I | C | A | I | I | R | C | C |
| Dev environment and CI/CD | I | I | I | C | I | I | C | C | A/R |
| Feature implementation | I | I | C | A | C | C | R | C | C |
| Test strategy and automation | I | I | C | C | I | I | C | A/R | C |
| Threat model and security review | I* | I | I | C | I | I | C | C | A/R |
| Daily report and board | I | A/R | C | C | C | C | C | C | C |
| Release go/no-go (G4) | A | R | C | C | C | I | I | C | C |
| Production deploy | A | I | I | C | I | I | C | C | R |

\* The Founder approves material tech/vendor commitments and accepts residual security risk.

## Founder approval required
Escalate through the CoS **before** acting on any of these:
1. Major product or business-model changes
2. Material technology or vendor commitments
3. **Any** paid spend (subscriptions, cloud, domains, APIs)
4. Production releases or destructive operations (data deletion, force-push, dropping DBs)
5. Handling of sensitive data (PII, payments, credentials)
6. Public communications or external commitments
7. Strategic disagreements the team couldn't resolve

Everything else is autonomous: research, drafts, analysis, proposals, approved low-risk work.

## Escalation
| Situation | Who decides | Time box |
|---|---|---|
| Routine cross-team disagreement | Domain owner (PM scope, CTO tech, DD UX). The CoS breaks ties and logs the reasoning. | Same day |
| A blocker older than 4 working hours | The owner flags it to the CoS, who re-plans or reassigns | Same day |
| A gate at risk or the critical path slipping | The CoS escalates to the Founder with options and a recommendation | Immediately |
| Any item in the approval list above | Founder | Immediately; don't proceed |

An escalation message gives: context (2 lines), options (2–3), a recommendation, and the deadline for a decision.

## Task template
Every issue uses these fields:
```
Owner:
Inputs:            # docs, designs, dependencies consumed
Outputs:           # artifacts produced
Acceptance criteria:
- [ ] ...
Dependencies:      # issue links
Status:            # Proposed | Ready | In Progress | In Review | Blocked | Done
Evidence:          # PR, CI run, preview URL, screenshot, test report
Reviewer:
```

## Statuses
Proposed → Ready ([DoR](02-definition-of-done.md#definition-of-ready)) → In Progress → In Review → Done ([DoD](02-definition-of-done.md)). **Blocked** can happen at any stage and must name the blocker and its owner.

## Cadence
- **Daily (by 21:00 PKT):** the CoS publishes the [daily report](../ops/daily-report-template.md).
- **Async standup:** each bot posts done / next / blocked on its issues.
- **Gates G1–G4:** a short review, then a decision logged in [decision-log](../ops/decision-log.md).
- **No status meetings.** Evidence over narrative. Don't claim work is done without a link.
