> Archived Round 1 prototype notes. For current tests and architecture see [the Round 2 report](../BUILD_REPORT.md).

# Verification results

Executed locally on 7 November 2026 using Node 24.17.0 and headless Microsoft Edge through Playwright.

## Results

| Check                                          | Result                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TypeScript and Vite production build           | Passed                                                                                     |
| Vitest domain and persistence suite            | 10 tests passed across 2 files                                                             |
| Playwright browser suite                       | 3 journeys passed; final complete suite finished in 24.8 seconds                           |
| Dependency audit after test-runner update      | 0 vulnerabilities reported                                                                 |
| Desktop visual inspection                      | Overview and approved incoming handover inspected                                          |
| Mobile visual inspection                       | 390 × 844 viewport inspected; no document-level horizontal overflow in overview or sources |
| Browser runtime errors during complete journey | None observed                                                                              |

## User story verified

Reviewer connects synthetic sources → local reducer reconstructs evidence-linked claims → reviewer corrects and reviews claims → approval creates a permitted snapshot → incoming member reads evidence, completes tasks and acknowledges receipt → changes persist after reload.

There is no backend or live API boundary to test in this design simulation. Source import, AI processing and role checks are local deterministic behavior, explicitly labelled in the interface.

### Domain and persistence checks

1. Fresh projects are disconnected; empty reconstruction and approval are blocked.
2. Only connected source references are used; repeated reconstruction is deterministic; chat introduces the planted payment contradiction.
3. Evidence and review states remain separate; accepting uncertain evidence without a recorded resolution blocks approval.
4. Gap resolution reassigns ownership, updates the claim and records history.
5. Approval requires audience confirmation, excludes rejected/restricted claims and preserves previous snapshots after edits.
6. Incoming and departing readers filter restricted records; incoming-role reviewer mutations are blocked.
7. Source-permission changes invalidate draft approval; reconstruction resets draft review and preserves prior versions and audit.
8. Plan tasks derive only from permitted approved claims; task progress is version-specific and acknowledgement is idempotent.
9. Project workspaces remain isolated; Reset Demo restores both.
10. Valid saved state restores; invalid JSON and malformed nested objects recover to the initial scenario.

### Browser journeys

**Complete journey:** fresh dashboard; connect four sources; inspect restricted source as reviewer; reconstruct ten claims; inspect payment contradiction and exact source excerpt; correct payment and persist the edit after reload; reject retry claim; review remaining claims; resolve cron gap and reassign Neha; approve seven permitted claims; switch to incoming role; inspect approved evidence; reject restricted record deep links and redirect reviewer-only routes; complete a task and persist personal notes; acknowledge receipt; create v2; compare versions and inspect preserved v1; switch projects; reset.

**Partial sources and navigation:** repository-only reconstruction produces five candidates with missing ownership; search/category/evidence filters change results; connecting communication marks the draft stale; rerun surfaces a conflict; guided-demo opening and free-exploration controls work; all ten main routes render; mobile navigation works without page overflow.

**Storage recovery:** corrupt JSON does not crash the application; denied storage shows a persistence warning; source connections still function in session memory.

## Issues found and corrected

- An exact browser-test lookup for the owner selector failed. Explicit accessible names were added to the owner and review-decision controls; the full journey then passed.
- Review actions originally changed a value displayed as the evidence date. Reviews now retain the source-derived evidence date and record action time separately in the audit trail.
- Saved state validation originally checked only the outer structure. It now validates nested claims, source records, reviews, versions and task progress before restoring.
- The initial test-runner dependency graph had reported advisories. Updating the test runner cleared the dependency audit.
- Approved snapshots now retain participant names independently of later project-member selection. Selecting a different departing member does not rewrite the original source’s recorded owner.

## Limits of verification

- Browser checks ran in Edge, not Firefox, Safari or a physical mobile device.
- Keyboard focus styles, labelled forms and native dialog semantics are implemented; no full assistive-technology or WCAG certification audit was performed.
- No live integration, model output quality, backend security, multi-user synchronization, production load or cloud deployment was tested because none is implemented.
- No usability study or measured onboarding improvement is claimed.
- The guided demo uses the same tested screens and state. Automated coverage directly exercised its opening and exit controls; the complete stateful journey was exercised through free navigation.

Reproduce with `npm test`, `npm run test:e2e` and `npm run build`. Playwright screenshots and failed-run traces are written to ignored `test-results/`; they are QA artifacts, not part of the app.
