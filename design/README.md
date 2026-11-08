# Design

Owner: Design Director (DD) · Producer: UI/UX Designer (UX)

## Design principles
**TBD at G1/G2** (depends on the product purpose and audience). The starting defaults:
1. **The core journey comes first.** Every screen serves the essential user journey.
2. **Clarity over cleverness.** One primary action per screen.
3. **Mobile-first and responsive:** design 360 px first, then 768 px and 1280 px+.
4. **Accessible by default:** WCAG 2.2 AA.
5. **Consistent:** one design system and reusable components.
6. **Localization-ready:** language(s) **TBD** (allow for RTL if Urdu is in scope).

## Artifacts
| Artifact | Owner | Due |
|---|---|---|
| Low-fi flows (core journey) | UX | Day 2–3 |
| Wireframes | UX | Day 3 |
| Hi-fi key screens (mobile and desktop) | UX | Day 4 (G2) |
| Design tokens and component list | UX | Day 4 |
| Empty, loading and error states | UX | Day 5–8 |
| Design QA on build | DD | Day 8–11 |

Tool and file links: **TBD** (any paid design tool needs Founder approval).

## Review process
1. UX shares the artifact on its issue (`area:design`) with a link or screenshot.
2. DD reviews within 4 working hours against the principles, the journey fit, accessibility and responsiveness.
3. PM confirms it covers the acceptance criteria. CTO confirms it's feasible.
4. Approved designs are marked on the issue, then ENG builds them. Changes after approval go through PM and DD.

## WCAG 2.2 AA must-haves
Contrast of 4.5:1 for text and 3:1 for UI. Target size at least 24×24 px. Visible focus, not obscured. Full keyboard operability. Labels and names on all inputs. No information by colour alone. Respect reduced motion. Readable error messages with recovery guidance. Avoid redundant entry. Accessible authentication (no cognitive tests).
