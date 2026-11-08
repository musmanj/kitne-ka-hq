# Release Checklist (G4 go/no-go, Day 13 → deploy Day 14)

Owner: SEC · Approver: **Founder** · Coordinated by the CoS

## Product
- [ ] All Must stories meet the DoD. Cut items are logged in the decision log.
- [ ] PM acceptance recorded
- [ ] Release notes and known issues written

## Quality
- [ ] Full regression and core-journey E2E green on staging (link)
- [ ] No open P0/P1 bugs (or Founder-accepted)
- [ ] Responsive check: 360 / 768 / 1280 px. Major browsers checked.
- [ ] Accessibility pass (WCAG 2.2 AA key checks)
- [ ] Performance: LCP and p95 API within targets (link)

## Security
- [ ] SAST and dependency scans clean or triaged
- [ ] Security review done. Findings resolved or accepted by the Founder (decision log).
- [ ] Secrets only in the secret store. Prod credentials rotated and least-privilege.
- [ ] HTTPS, security headers, rate limits, authz checks verified

## Operations
- [ ] Production env provisioned (spend approved by the Founder)
- [ ] DB migrations tested on a staging copy. Backup taken before deploy.
- [ ] Monitoring, error tracking and uptime alert live
- [ ] **Rollback plan written and rehearsed** (steps plus owner)
- [ ] Smoke test script ready

## Go / no-go
- [ ] Founder approval to deploy to production, logged as D-xxx
- [ ] Deploy → smoke test → live URL announced internally
- [ ] Any public announcement is a separate Founder approval
