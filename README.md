# Relay — Interactive Concept Prototype

Relay is Dev404’s evidence-aware knowledge-handover concept for HackWithPune. This is a working **local interaction simulation** of the proposed experience: users connect synthetic sources, reconstruct candidate knowledge, inspect evidence, review claims, approve immutable handover snapshots and complete onboarding tasks.

It is not a production service or a representation of completed AI, integrations, authentication or enterprise security.

## Run locally

Use a current Node.js LTS release (Node 22.12+ or Node 24 recommended).

```sh
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173/`.

```sh
npm run build
npm run preview
npm test
npm run test:e2e
```

The browser suite uses installed Microsoft Edge through Playwright. If Edge is unavailable, install Playwright Chromium (`npx playwright install chromium`) and remove `channel: 'msedge'` from `playwright.config.ts`. The tests start or reuse a local Vite server. No API keys or environment variables are needed.

## The connected experience

- Two isolated local project contexts: CampusConnect and a CampusConnect practice workspace.
- Four independently connectable sources with 15 authored synthetic records. All start disconnected.
- Seven visible processing stages with deterministic output. GitHub alone produces five candidates; all sources produce ten. Missing task-board evidence leaves ownership unconfirmed. Connecting contradictory communication introduces the payment conflict.
- Searchable, filterable, sortable knowledge, a chronological Decision Trail, a split evidence inspector and exact source-record pages.
- Knowledge Gap Radar filters severity, type, owner, status and review decision. A resolution changes the claim and counts while preserving its history.
- Individual accept, edit, reject and unresolved decisions, ownership reassignment, notes and verification outcomes. There is no “approve everything” shortcut.
- An approval gate requires every claim to be reviewed, an explicit audience, appropriate-content confirmation and either a recorded human resolution or an unresolved/rejected decision for conflicting or insufficient claims.
- Immutable approved versions and comparisons. Reconstruction resets draft reviews but retains prior review actions and approved snapshots.
- Incoming-member routes read only approved, audience-filtered claims and evidence. Restricted and rejected claims never become incoming tasks. Direct links to restricted records return an unavailable state.
- Task expansion, evidence links, personal notes, completion progress and version-specific acknowledgement.
- Guided Demo, free navigation, project switching, role switching, confirmation dialogs, feedback and reset of both workspaces.
- Versioned localStorage persistence with malformed-state fallback and a visible warning when storage is unavailable.

## A judge walkthrough

Use **Guided Demo** in the top navigation, or follow these same screens freely:

1. Start as **Team Lead / Reviewer** (Riya). Select Aarav as the departing developer in Projects.
2. Connect all four demo sources. Inspect the communication records, including the lead-only vendor record.
3. Run **Reconstruct Project Knowledge**. The payment candidate has conflicting evidence; the cron ownership candidate has insufficient evidence.
4. Open the payment claim. Issue #34 says open; the communication record says resolved. Every citation opens the exact fictional source.
5. In Review & Approval, correct payment to “Payment API integration remains blocked pending confirmation of the staging fix.” Assign Neha, record a review reason and a simulated verification outcome, then accept.
6. In Gap Radar, resolve cron ownership by assigning Neha and recording her acceptance. This preserves the stale source label and adds a human resolution.
7. Review the remaining claims individually. Accept supported decisions, reject the retry action to demonstrate exclusion, and mark the rollout-approver question unresolved. Lead-only claims are reviewed but never shared with Neha.
8. Select **Incoming Developer · Neha**, confirm audience appropriateness and approve. Inspect the new version.
9. Switch to **Incoming Developer**. Open the first-week plan, inspect evidence, save a personal note and complete a task. Progress persists after reload.
10. Return to Handover and acknowledge receipt. Switch back to Riya to inspect audit history, make a correction, approve v2 and compare it with v1.

Use the practice project for an independent run or **Reset Demo** to clear both workspaces. Disconnecting a source marks the draft stale; rerun reconstruction before approving another version.

## Architecture and folders

```text
src/
  components/   shared dialog, evidence, review form and status UI
  data/         fictional records, connector descriptions, gap definitions
  domain/       types, deterministic reconstruction, permissions, reducer, tests
  pages/        dashboard, sources, knowledge, review, gaps, handover, plan, history
  state/        React context, safe localStorage parsing and persistence tests
  App.tsx       shell, guarded routes, role/project switching and guided demo
  styles.css    responsive interface and focus/reduced-motion styles
tests/          Playwright browser journeys
docs/           verification notes and document alignment
```

Data flow: **React action → typed reducer → shared project state → derived evidence/permissions/plan → screens → localStorage**. Incoming claims are selected from the latest approved snapshot, never from draft state. Source excerpts are read through a role-aware selector. Review decisions preserve the original evidence assessment, with human resolutions stored separately.

React, TypeScript, Vite, Tailwind CSS, Lucide and React Router implement the client. Hash-based routing works on ordinary static hosting without server rewrites. Native HTML dialogs provide modal focus behavior; forms have labels and navigation has keyboard focus styles.

## Simulation limits

- No real OAuth, GitHub synchronization, uploads, task-board integrations, chat export parsing, embeddings, inference or collaborative backend.
- Sources and claims are authored fixtures with explicit deterministic branching, not extracted from arbitrary input. Real-world extraction accuracy has not been measured.
- Demo roles are freely switchable. Data is bundled in JavaScript and stored locally. These controls demonstrate permission behavior; they are **not a security boundary**. Production authorization must be enforced server-side.
- The departing-developer role is a read-only contextual preview; only Riya can review or approve. Neha can complete plan tasks and acknowledge receipt.
- Local history is append-only through the normal workflow, but can be erased with Reset Demo or edited using browser tools. It is not a tamper-proof audit log.
- Source dates are authored scenario dates. User-action timestamps reflect the current session and are displayed in India time.
- Approved source records are retained in snapshots even if the current draft disconnects them. Historical versions are reviewer-only; source deep links use the current role’s current context, so a source from an older snapshot can be unavailable at its direct URL.
- Reconstruction is cancellable by leaving its screen. A new run replaces draft reviews and resolutions while retaining historical records and approvals.
- No cloud deployment, account service, email delivery or production data processing has been configured.

## Proposed Round 2 architecture

The proposal remains the design authority: React frontend, FastAPI backend, PostgreSQL with pgvector, an authorized GitHub connector, file/task-board ingestion and one bounded structured-output LLM call per project. Deterministic code validates source identifiers, permissions and evidence relations before human review. Production work includes authenticated server-side authorization, chunking and retrieval, durable audit/version storage, real ingestion, schema-validated extraction and permission regression tests.

Additional connectors, transcription, portfolio workflows and retention policies remain future scope. No claims are made about measured time savings or extraction accuracy.

## Event scope and disclosures

The supplied challenge brief says product development must occur during the official build window, and Round 1 requires a plan. It does not explicitly authorize a pre-window interactive prototype. **Eligibility is unconfirmed.** This deliverable is labelled as a local design simulation, not an eligible competition build or submitted product. Confirm organizer permission before submission or public deployment, and disclose any reuse during later rounds.

The supplied proposal names two participants but discusses four-member implementation assumptions and unassigned member placeholders. Those administrative details were not silently rewritten. See `docs/SPEC_ALIGNMENT.md`.

OpenAI Codex assisted with application code, synthetic fixtures, styling, tests and documentation. The user supplied the product brief and proposal. React, Vite, TypeScript, Tailwind, Lucide, React Router, Vitest and Playwright are third-party open-source dependencies; exact versions are pinned in `package-lock.json`. No external website template or image asset was used.

Build output is in `dist/`. It can be hosted on an ordinary static host once permitted. There is no claimed public deployment URL.
