# Relay · Round 2 build report
**DEV404 · CodersInPune** — Dhanashree S. Hingnekar and Bhakti S. Kote.

**Repository:** https://github.com/kotebhakti30/Relay  
**Deployment dashboard:** https://vercel.com/dev407/relay2  
**Judge-facing production URL:** pending verification. The dashboard requires operator access. The previously shared deployment appears in GitHub’s status history for the Round 1 commit. GitHub reported a completed Round 2 deployment for commit 9c7a16b at https://vercel.com/dev407/relay2/7uZfBjaRsubmwxNMAHRsT8S7GWsa. The team alias redirected a signed-out request to Vercel authentication. The eight-step results below apply to the Round 2 production build served locally.

## Shipped implementation
The existing React/Vite UI now calls a Node API on the same origin. Anonymous signed tokens scope a visitor to a workspace and role. For public hosting, Vercel runs that API and Neon PostgreSQL stores records, claims, exact evidence links, review history, immutable versions, version-scoped tasks and acknowledgements.

Data Sources accepts pasted text or .txt/.md uploads. Each claim shows its extractor. When configured, a server-side Gemini or Groq request proposes a constrained JSON response. The service checks citation membership and quoted text; it determines uncertainty in code. The tested keyless path uses deterministic English rules. Notes and restricted records are processed in separate visibility batches. Contradictory source status and pending human review are separate labels.

## Worked handover
A signed-out visitor pressed **Try CampusConnect** and entered “Kabir will own the nightly digest cron job after Aarav leaves.” Reconstruction produced an ownership claim naming Kabir, with that sentence as its citation. The reviewer opened the payment claim, saw the open Issue #34 and a chat message reporting a fix, and saved “Payment remains blocked until staging validation.” The corrected draft survived refresh. The reviewer rejected the OAuth decision, kept the stale cron-owner claim unresolved and accepted the permitted new note. Approval generated Version 1.

In a separate browser session Neha saw the Kabir entry and the corrected payment statement. Her link excluded the lead-only vendor record, the rejected decision and later unpublished material. She saved a task note, completed the task and acknowledged receipt. The lead could inspect the review trail and the original Version 1 after a later draft edit.

## Test results
| Acceptance check | Local production build + PostgreSQL | Public deployment |
|---|---|---|
| Signed-out start and isolated workspace | Passed | Unverified |
| Paste note; imported record visible | Passed | Unverified |
| New Kabir claim and exact quotation | Passed | Unverified |
| Payment conflict, correction and refresh | Passed | Unverified |
| Three review decisions, required reason, approved immutable version | Passed | Unverified |
| Separate Neha session; restricted, rejected and pending IDs denied | Passed | Unverified |
| First-week task note, persisted completion and receipt | Passed | Unverified |
| Lead history and preserved Version 1 | Passed | Unverified |

Seven automated core/database tests passed. Two browser scenarios passed: the eight-step desktop workflow with direct API checks, and mobile navigation with a Markdown upload. The test database was a temporary real PostgreSQL 18 cluster. The published-version test also attempted direct SQL UPDATE and DELETE against an approved snapshot and audit event; PostgreSQL refused all four writes. Optional provider integration was tested with a mocked invalid citation response. Hosted provider calls, Neon connectivity and signed-out Vercel access still require live verification.

## Screenshot checklist
The browser suite captures three production-build screens after corresponding assertions: Evidence Explorer with the payment contradiction; the isolated incoming handover with permitted claims; and the acknowledged receipt. They are saved under test-results/screens and selected screenshots are reproduced in the PDF. For a final live submission, run the same walkthrough on the public domain and add its verified link.

## Changes from Round 1
- Replaced browser-only state and simulated reconstruction with PostgreSQL transactions, note ingestion, validated extraction and versioned publication.
- Used a single Vercel deployment in place of the proposed FastAPI and pgvector services to keep the evidence-to-approval path manageable.
- Used anonymous scoped links in place of OAuth so a judge can try each role independently.
- Narrowed source ingestion to notes and a synthetic sample corpus. Repository, task-board and chat examples are seeded records. Live external connectors remain outside this release.

## Limitations
The rules extractor handles common English ownership, decision, risk and status phrases. It can miss paraphrases or contradictions. An exact quotation verifies provenance, while the human reviewer still assesses meaning. Input is bounded to 8,000 characters per note, 30 records and 40,000 source characters per workspace. Session links last seven days; possession grants the corresponding role. Reset retires the workspace. Identity verification and automatic data retention are outside scope. Use synthetic data. A missing or unreachable database produces a visible error.

## Three Round 3 commitments
1. Flag impacted claims when a source changes after approval; publish revisions while preserving the earlier version.
2. Route a specific knowledge gap to the departing member and attach their answer to the claim for review.
3. Answer incoming-member questions from permitted approved evidence, declining when evidence is insufficient or restricted.
