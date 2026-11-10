import { describe, it, expect } from "vitest";
import {
  initialState,
  reducer,
  reconstruct,
  authorizedRecords,
  readerClaims,
  visibleRecords,
  visibleClaims,
  approvalErrors,
  plan,
  latest,
} from "./engine";
import type { State } from "./types";
const full = () => {
  let s = initialState();
  for (const source of ["github", "notes", "board", "chat"] as const)
    s = reducer(s, { type: "connect", source });
  return reducer(s, { type: "reconstruct" });
};
function reviewAll(s: State) {
  for (const c of s.projects.campus.claims)
    s = reducer(s, {
      type: "review",
      id: c.id,
      statement: c.statement,
      owner: c.owner,
      review:
        c.id === "retry"
          ? "Rejected"
          : c.evidence === "Supported"
            ? "Accepted"
            : "Unresolved",
      note: "Checked synthetic source records.",
      resolution: "",
    });
  return s;
}
describe("Evidence-aware simulation", () => {
  it("starts disconnected, cannot approve or reconstruct an empty project", () => {
    const s = initialState();
    expect(reducer(s, { type: "reconstruct" })).toEqual(s);
    expect(
      reducer(s, { type: "approve", audience: true, appropriate: true }),
    ).toEqual(s);
  });
  it("uses only connected records, is deterministic, and reveals contradictions", () => {
    let s = initialState();
    s = reducer(s, { type: "connect", source: "github" });
    const a = reconstruct(s.projects.campus);
    expect(a.some((c) => c.id === "oauth")).toBe(false);
    expect(a.flatMap((c) => c.refs).every((id) => id.startsWith("GH"))).toBe(
      true,
    );
    expect(a.find((c) => c.id === "cron")?.owner).toBe("Unassigned");
    expect(a.find((c) => c.id === "payment")?.evidence).toBe("Supported");
    expect(reconstruct(s.projects.campus)).toEqual(a);
    s = reducer(s, { type: "connect", source: "chat" });
    expect(
      reconstruct(s.projects.campus).find((c) => c.id === "payment")?.evidence,
    ).toBe("Conflicting");
  });
  it("separates review and evidence, requires verification for accepting conflicts", () => {
    let s = full();
    const c = s.projects.campus.claims.find((c) => c.id === "payment")!;
    s = reducer(s, {
      type: "review",
      id: c.id,
      statement: "Payment remains blocked.",
      owner: "Neha",
      review: "Accepted",
      note: "Corrected staging status.",
      resolution: "",
    });
    expect(approvalErrors(s.projects.campus)).toContain(
      "Resolve evidence concerns or mark those claims unresolved.",
    );
    expect(
      s.projects.campus.claims.find((c) => c.id === "payment")?.evidence,
    ).toBe("Conflicting");
    expect(s.projects.campus.reviews[0].before.statement).toContain(
      "resolved on staging",
    );
  });
  it("resolves a gap with history, keeps uncertainty and reassigns ownership", () => {
    let s = full();
    s = reducer(s, {
      type: "review",
      id: "cron",
      statement: "Neha owns the nightly digest job.",
      owner: "Neha",
      review: "Accepted",
      note: "Neha accepted ownership.",
      resolution: "Confirmed in this simulated review.",
      gapId: "gap-cron",
    });
    expect(s.projects.campus.resolvedGaps).toContain("gap-cron");
    expect(s.projects.campus.claims.find((c) => c.id === "cron")?.owner).toBe(
      "Neha",
    );
    expect(s.projects.campus.reviews).toHaveLength(1);
  });
  it("approval excludes rejected/restricted claims and snapshots are immutable", () => {
    let s = reviewAll(full());
    s = reducer(s, { type: "approve", audience: false, appropriate: true });
    expect(s.projects.campus.versions).toHaveLength(0);
    s = reducer(s, { type: "approve", audience: true, appropriate: true });
    const old = JSON.stringify(latest(s.projects.campus));
    expect(
      readerClaims(latest(s.projects.campus)).some((c) =>
        ["retry", "budget", "audit"].includes(c.id),
      ),
    ).toBe(false);
    const c = s.projects.campus.claims[0];
    s = reducer(s, {
      type: "review",
      id: c.id,
      statement: "New revision",
      owner: "Neha",
      review: "Accepted",
      note: "Change for v2.",
      resolution: "",
    });
    expect(JSON.stringify(latest(s.projects.campus))).toBe(old);
    s = reducer(s, { type: "approve", audience: true, appropriate: true });
    expect(s.projects.campus.versions).toHaveLength(2);
    expect(s.projects.campus.versions[0].claims[0].statement).not.toBe(
      "New revision",
    );
  });
  it("filters every incoming reader and blocks reviewer mutations in incoming role", () => {
    let s = reviewAll(full());
    s = reducer(s, { type: "approve", audience: true, appropriate: true });
    s = reducer(s, { type: "role", role: "incoming" });
    expect(
      visibleRecords(s.projects.campus, "incoming").every(
        (r) => r.access === "team",
      ),
    ).toBe(true);
    expect(
      visibleClaims(s.projects.campus, "incoming").some((c) => c.restricted),
    ).toBe(false);
    expect(
      authorizedRecords(s.projects.campus, "departing").every(
        (r) => r.access === "team",
      ),
    ).toBe(true);
    for (const action of [
      { type: "reconstruct" },
      { type: "connect", source: "github" },
      { type: "approve", audience: true, appropriate: true },
    ] as const)
      expect(reducer(s, action)).toEqual(s);
  });
  it("source permission changes mark drafts stale and reruns preserve audit and versions", () => {
    let s = reviewAll(full());
    s = reducer(s, { type: "approve", audience: true, appropriate: true });
    s = reducer(s, { type: "restricted", enabled: false });
    expect(s.projects.campus.dirty).toBe(true);
    expect(approvalErrors(s.projects.campus)).toContain(
      "Sources changed. Reconstruct before approval.",
    );
    s = reducer(s, { type: "reconstruct" });
    expect(s.projects.campus.claims.some((c) => c.restricted)).toBe(false);
    expect(
      s.projects.campus.claims.every((c) => c.review === "Pending Review"),
    ).toBe(true);
    expect(s.projects.campus.versions).toHaveLength(1);
    expect(s.projects.campus.reviews.length).toBeGreaterThan(0);
  });
  it("keeps plan tasks version-specific and acknowledgement idempotent", () => {
    let s = reviewAll(full());
    s = reducer(s, { type: "approve", audience: true, appropriate: true });
    const tasks = plan(latest(s.projects.campus));
    expect(
      tasks.every((t) => !["retry", "budget", "audit"].includes(t.claim.id)),
    ).toBe(true);
    s = reducer(s, { type: "role", role: "incoming" });
    s = reducer(s, {
      type: "task",
      id: tasks[0].id,
      done: true,
      note: "Read the architecture.",
    });
    expect(s.projects.campus.tasks[tasks[0].id].done).toBe(true);
    s = reducer(s, { type: "ack" });
    expect(latest(s.projects.campus)?.acknowledged).toBeTruthy();
    expect(reducer(s, { type: "ack" })).toEqual(s);
  });
  it("isolates projects and fully resets both workspaces", () => {
    let s = full();
    s = reducer(s, { type: "project", id: "practice" });
    expect(s.projects.practice.connections).toEqual([]);
    expect(s.projects.campus.connections).toHaveLength(4);
    expect(reducer(s, { type: "reset" })).toEqual(initialState());
  });
});
