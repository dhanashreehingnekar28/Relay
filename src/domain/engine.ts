import { records, gaps } from "../data/scenario";
import type {
  Claim,
  ProjectState,
  SourceRecord,
  State,
  SourceType,
  Role,
  ReviewState,
  PlanTask,
  HandoverVersion,
} from "./types";
export const initialProject = (): ProjectState => ({
  connections: [],
  restrictedEnabled: true,
  claims: [],
  resolvedGaps: [],
  reviews: [],
  events: [],
  versions: [],
  tasks: {},
  run: 0,
  dirty: false,
  departing: "Aarav",
  incoming: "Neha",
});
export const initialState = (): State => ({
  schema: 1,
  role: "reviewer",
  projectId: "campus",
  projects: { campus: initialProject(), practice: initialProject() },
});
export function authorizedRecords(p: ProjectState, role: Role): SourceRecord[] {
  return records.filter(
    (r) =>
      p.connections.includes(r.type) &&
      (r.access === "team" || (role === "reviewer" && p.restrictedEnabled)),
  );
}
export function reconstruct(p: ProjectState): Claim[] {
  const available = authorizedRecords(p, "reviewer");
  const has = (id: string) => available.some((r) => r.id === id);
  const out: Claim[] = [];
  const add = (
    id: string,
    statement: string,
    category: Claim["category"],
    owner: string,
    refs: string[],
    evidence: Claim["evidence"] = "Supported",
    explanation = "Available records support this statement; no contradiction is present in this synthetic dataset.",
  ) => {
    const linked = refs.filter(has);
    out.push({
      id,
      statement,
      category,
      owner,
      refs: linked,
      evidence,
      explanation,
      review: "Pending Review",
      restricted: linked.some(
        (id) => available.find((r) => r.id === id)?.access === "reviewer",
      ),
      note: "",
      resolution: "",
      updated:
        linked
          .map((id) => available.find((r) => r.id === id)!.timestamp)
          .sort()
          .at(-1) || "2026-11-07T09:00:00+05:30",
    });
  };
  if (has("GH-C1"))
    add(
      "architecture",
      "API modules separate authentication, payment callbacks and nightly digests.",
      "Decisions",
      "Aarav",
      ["GH-C1"],
    );
  if (has("MN-1") || has("CH-3"))
    add(
      "oauth",
      "Defer OAuth to sprint 4; retain session authentication pending security review.",
      "Decisions",
      "Riya",
      ["MN-1", "CH-3"],
    );
  if (has("GH-34") || has("TB-2") || has("CH-1")) {
    const conflict = has("CH-1") && (has("GH-34") || has("TB-2"));
    add(
      "payment",
      has("CH-1")
        ? "Payment API issue is resolved on staging."
        : "Payment API integration remains blocked pending staging validation.",
      "Blockers",
      has("TB-2") ? "Aarav" : "Unassigned",
      ["GH-34", "GH-18", "TB-2", "CH-1"],
      conflict
        ? "Conflicting"
        : has("CH-1")
          ? "Insufficient Evidence"
          : "Supported",
      conflict
        ? "Issue #34 / the task board say open or in progress; the chat says resolved. A reviewer must reconcile the disagreement."
        : has("CH-1")
          ? "Only an unverified chat update is available. Connect the repository to check the issue."
          : "Available issue and task records report work still in progress.",
    );
  }
  if (has("TB-1") || has("GH-41"))
    add(
      "cron",
      has("TB-1")
        ? "Nightly digest cron job remains assigned to Aarav; successor unconfirmed."
        : "Nightly digest cron job is incomplete; no owner is confirmed.",
      "Ownership",
      has("TB-1") ? "Aarav" : "Unassigned",
      ["TB-1", "GH-41"],
      "Insufficient Evidence",
      has("TB-1")
        ? "The ownership card was last confirmed six weeks ago and names Aarav; successor responsibility is unconfirmed."
        : "No task-board ownership record was connected.",
    );
  if (has("CH-2"))
    add(
      "access",
      "Cron setup depends on operations granting service account access.",
      "Dependencies",
      "Riya",
      ["CH-2"],
    );
  if (has("MN-2") || has("GH-22") || has("TB-3"))
    add(
      "security",
      "Security review is required before the authentication changes can be deployed.",
      "Risks",
      "Riya",
      ["MN-2", "GH-22", "TB-3"],
    );
  if (has("GH-18"))
    add(
      "retry",
      "Validate the payment retry branch before merging PR #18.",
      "Next actions",
      has("TB-2") ? "Aarav" : "Unassigned",
      ["GH-18", "TB-2"],
    );
  if (has("MN-2") || has("TB-3"))
    add(
      "question",
      "Who is the final rollout approver? This is not established in the available records.",
      "Unresolved questions",
      "Unassigned",
      ["MN-2", "TB-3"],
      "Insufficient Evidence",
      "These records describe release gates but do not establish final rollout ownership.",
    );
  if (has("CH-R1"))
    add(
      "budget",
      "Vendor contingency budget of ₹18,000 is under lead review.",
      "Risks",
      "Riya",
      ["CH-R1"],
    );
  if (has("CH-R2"))
    add(
      "audit",
      "Internal access-audit findings require a separate lead review.",
      "Risks",
      "Riya",
      ["CH-R2"],
    );
  return out;
}
export function activeGaps(p: ProjectState) {
  return gaps.filter((g) =>
    p.claims.some(
      (c) =>
        c.id === g.claimId &&
        (g.id !== "gap-payment" || c.evidence !== "Supported"),
    ),
  );
}
export function latest(p: ProjectState) {
  return p.versions.at(-1);
}
export function readerClaims(v?: HandoverVersion) {
  return (
    v?.claims.filter(
      (c) =>
        !c.restricted &&
        c.review !== "Rejected" &&
        c.review !== "Pending Review" &&
        c.refs.every((id) =>
          v.records.some((r) => r.id === id && r.access === "team"),
        ),
    ) || []
  );
}
export function visibleClaims(p: ProjectState, role: Role) {
  return role === "incoming"
    ? readerClaims(latest(p))
    : p.claims.filter((c) => role === "reviewer" || !c.restricted);
}
export function visibleRecords(p: ProjectState, role: Role) {
  if (role === "incoming") {
    const v = latest(p);
    const ids = new Set(readerClaims(v).flatMap((c) => c.refs));
    return v?.records.filter((r) => r.access === "team" && ids.has(r.id)) || [];
  }
  return authorizedRecords(p, role);
}
export function approvalErrors(p: ProjectState) {
  return [
    !p.claims.length ? "Reconstruct knowledge first." : "",
    p.dirty ? "Sources changed. Reconstruct before approval." : "",
    p.claims.some((c) => c.review === "Pending Review")
      ? "Review every candidate claim."
      : "",
    p.claims.some(
      (c) =>
        c.review === "Accepted" && c.evidence !== "Supported" && !c.resolution,
    )
      ? "Resolve evidence concerns or mark those claims unresolved."
      : "",
    !p.claims.some(
      (c) => !c.restricted && ["Accepted", "Unresolved"].includes(c.review),
    )
      ? "Include at least one audience-appropriate claim."
      : "",
  ].filter(Boolean);
}
export function plan(v?: HandoverVersion): PlanTask[] {
  return readerClaims(v).map((c, i) => ({
    id: `${v!.id}:${c.id}`,
    day: Math.min(i + 1, 5),
    title:
      c.id === "architecture"
        ? "Understand the API architecture"
        : c.id === "payment"
          ? "Verify payment integration"
          : c.id === "cron"
            ? "Confirm and investigate the cron job"
            : c.id === "security"
              ? "Review the authentication release gate"
              : c.review === "Unresolved"
                ? `Clarify: ${c.statement}`
                : `Continue: ${c.statement}`,
    priority: ["payment", "cron", "access"].includes(c.id) ? "High" : "Normal",
    owner: "Neha",
    claim: c,
    dependency:
      c.id === "cron"
        ? "Confirm operations access before configuring the job."
        : c.id === "retry"
          ? "Verify staging payment behavior before merging."
          : "Read the linked evidence and reviewer notes first.",
  }));
}
export type Action =
  | { type: "role"; role: Role }
  | { type: "project"; id: string }
  | { type: "reset" }
  | { type: "connect"; source: SourceType }
  | { type: "restricted"; enabled: boolean }
  | { type: "members"; departing: string; incoming: string }
  | { type: "reconstruct" }
  | {
      type: "review";
      id: string;
      statement: string;
      owner: string;
      review: ReviewState;
      note: string;
      resolution: string;
      gapId?: string;
    }
  | { type: "approve"; audience: boolean; appropriate: boolean }
  | { type: "task"; id: string; done?: boolean; note?: string }
  | { type: "ack" };
export function reducer(state: State, action: Action): State {
  if (action.type === "reset") return initialState();
  if (action.type === "role") return { ...state, role: action.role };
  if (action.type === "project")
    return state.projects[action.id]
      ? { ...state, projectId: action.id }
      : state;
  const p = structuredClone(state.projects[state.projectId]);
  const at = new Date().toISOString();
  const log = (type: string, detail: string, claimId?: string) =>
    p.events.unshift({
      id: `event-${p.events.length + 1}`,
      type,
      detail,
      at,
      actor:
        state.role === "incoming"
          ? "Neha"
          : state.role === "departing"
            ? p.departing
            : "Riya",
      claimId,
    });
  if (
    [
      "connect",
      "restricted",
      "members",
      "reconstruct",
      "review",
      "approve",
    ].includes(action.type) &&
    state.role !== "reviewer"
  )
    return state;
  switch (action.type) {
    case "connect":
      p.connections = p.connections.includes(action.source)
        ? p.connections.filter((s) => s !== action.source)
        : [...p.connections, action.source];
      p.dirty = p.run > 0;
      log(
        "Sources",
        `${action.source} ${p.connections.includes(action.source) ? "connected" : "disconnected"} (simulated).`,
      );
      break;
    case "restricted":
      p.restrictedEnabled = action.enabled;
      p.dirty = p.run > 0;
      log(
        "Permissions",
        `Lead-only source import ${action.enabled ? "enabled" : "disabled"}.`,
      );
      break;
    case "members":
      p.departing = action.departing;
      p.incoming = action.incoming;
      p.dirty = p.run > 0;
      log("Members", `Handover: ${p.departing} → ${p.incoming}.`);
      break;
    case "reconstruct":
      if (!p.connections.length) return state;
      p.claims = reconstruct(p);
      p.resolvedGaps = [];
      p.dirty = false;
      p.run++;
      log(
        "Reconstruction",
        `Run ${p.run}: ${p.claims.length} candidates from ${authorizedRecords(p, "reviewer").length} authorized synthetic records. Draft reviews reset; approved versions preserved.`,
      );
      break;
    case "review": {
      const index = p.claims.findIndex((c) => c.id === action.id);
      if (index < 0 || !action.statement.trim() || !action.note.trim())
        return state;
      const before = structuredClone(p.claims[index]);
      const after = {
        ...before,
        statement: action.statement.trim(),
        owner: action.owner,
        review: action.review,
        note: action.note.trim(),
        resolution: action.resolution.trim(),
      };
      p.claims[index] = after;
      p.reviews.push({
        id: `review-${p.reviews.length + 1}`,
        claimId: before.id,
        before,
        after: structuredClone(after),
        actor: "Riya",
        at,
        reason: action.note,
      });
      if (
        action.gapId &&
        action.resolution.trim() &&
        action.review !== "Pending Review" &&
        action.review !== "Rejected" &&
        !p.resolvedGaps.includes(action.gapId)
      )
        p.resolvedGaps.push(action.gapId);
      log(
        "Review",
        `${before.id}: ${action.review}. ${action.note}`,
        before.id,
      );
      break;
    }
    case "approve":
      if (approvalErrors(p).length || !action.audience || !action.appropriate)
        return state;
      {
        const claims = p.claims.filter(
          (c) => !c.restricted && c.review !== "Rejected",
        );
        const ids = new Set(claims.flatMap((c) => c.refs));
        p.versions.push({
          id: p.versions.length + 1,
          claims: structuredClone(claims),
          records: records.filter((r) => ids.has(r.id) && r.access === "team"),
          at,
          audience: "Incoming Developer",
          author: "Riya",
          departing: p.departing,
          incoming: p.incoming,
        });
        log(
          "Approval",
          `Handover v${p.versions.length} approved for ${p.incoming}; ${claims.length} permitted claims.`,
        );
        break;
      }
    case "task":
      if (
        state.role !== "incoming" ||
        !plan(latest(p)).some((t) => t.id === action.id)
      )
        return state;
      {
        const prev = p.tasks[action.id] || { done: false, note: "" };
        p.tasks[action.id] = {
          done: action.done ?? prev.done,
          note: action.note ?? prev.note,
        };
        if (action.done !== undefined)
          log(
            "Onboarding",
            `Task ${action.id} ${action.done ? "completed" : "reopened"}.`,
          );
        break;
      }
    case "ack":
      if (state.role !== "incoming" || !latest(p) || latest(p)!.acknowledged)
        return state;
      latest(p)!.acknowledged = at;
      log(
        "Acknowledgement",
        `${p.incoming} acknowledged handover v${latest(p)!.id}.`,
      );
      break;
  }
  return { ...state, projects: { ...state.projects, [state.projectId]: p } };
}
