import { useState } from "react";
import { useStore } from "../state/Store";
import { Heading, Badge, date, Modal, Evidence } from "../components/UI";
import type { Claim, HandoverVersion } from "../domain/types";
export function History() {
  const { p } = useStore();
  const [filter, setFilter] = useState("All events");
  const [version, setVersion] = useState<HandoverVersion | null>(null);
  const [base, setBase] = useState("");
  const [target, setTarget] = useState("");
  const [inspect, setInspect] = useState<Claim | null>(null);
  const a = p.versions.find((v) => String(v.id) === base);
  const b = p.versions.find((v) => String(v.id) === target);
  const changes =
    a && b
      ? [...new Set([...a.claims, ...b.claims].map((c) => c.id))]
          .map((id) => ({
            id,
            before: a.claims.find((c) => c.id === id),
            after: b.claims.find((c) => c.id === id),
          }))
          .filter((c) => JSON.stringify(c.before) !== JSON.stringify(c.after))
      : [];
  return (
    <>
      <Heading
        eyebrow="ACTIVITY & VERSION HISTORY"
        title="A record of how we got here."
        description="Workspace activity stored in PostgreSQL. Previous approvals stay intact when the draft changes."
      />
      <section className="panel">
        <h2>Approved handover versions</h2>
        {!p.versions.length ? (
          <p>
            No versions yet. Complete review and approval to create the first
            snapshot.
          </p>
        ) : (
          <div className="version-list">
            {p.versions.map((v) => (
              <button
                key={v.id}
                className="version-card"
                onClick={() => setVersion(v)}
              >
                <Badge>Approved</Badge>
                <strong>Version {v.id}</strong>
                <small>
                  {date(v.at)} · {v.claims.length} claims
                </small>
                <small>
                  {v.acknowledged ? "Receipt acknowledged" : "Awaiting receipt"}
                </small>
              </button>
            ))}
          </div>
        )}
        {p.versions.length > 1 && (
          <>
            <h3>Compare versions</h3>
            <div className="toolbar">
              <select
                aria-label="Base version"
                value={base}
                onChange={(e) => setBase(e.target.value)}
              >
                <option value="">From version</option>
                {p.versions.map((v) => (
                  <option value={v.id} key={v.id}>
                    Version {v.id}
                  </option>
                ))}
              </select>
              <select
                aria-label="Target version"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">To version</option>
                {p.versions.map((v) => (
                  <option value={v.id} key={v.id}>
                    Version {v.id}
                  </option>
                ))}
              </select>
            </div>
            {a && b && (
              <div>
                {changes.length ? (
                  changes.map((c) => (
                    <div className="diff" key={c.id}>
                      <strong>{c.id}</strong>
                      <p className="removed">
                        Before:{" "}
                        {c.before
                          ? `${c.before.statement} · ${c.before.owner} · ${c.before.review} · ${c.before.note}`
                          : "Not included"}
                      </p>
                      <p className="added">
                        After:{" "}
                        {c.after
                          ? `${c.after.statement} · ${c.after.owner} · ${c.after.review} · ${c.after.note}`
                          : "Not included"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No claim changes between these versions.</p>
                )}
              </div>
            )}
          </>
        )}
      </section>
      <section className="panel mt-6">
        <div className="section-heading">
          <h2>Activity log</h2>
          <select
            aria-label="History filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All events", ...new Set(p.events.map((e) => e.type))].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
        </div>
        {p.events
          .filter((e) => filter === "All events" || e.type === filter)
          .map((e) => (
            <div className="history-event" key={e.id}>
              <Badge>{e.type}</Badge>
              <div>
                <strong>{e.detail}</strong>
                <small>
                  {e.actor} ·{" "}
                  {new Date(e.at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </small>
                {e.claimId && (
                  <details>
                    <summary>Inspect claim change</summary>
                    {p.reviews
                      .filter((r) => r.claimId === e.claimId && e.detail === r.after.review + ": " + r.after.statement)
                      .map((r) => (
                        <div className="diff" key={r.id}>
                          <p>
                            Before: {r.before.statement} · {r.before.owner} ·{" "}
                            {r.before.review}
                          </p>
                          <p>
                            After: {r.after.statement} · {r.after.owner} ·{" "}
                            {r.after.review}
                          </p>
                          <p>Reason: {r.reason}</p>
                          <p>
                            Verification: {r.after.resolution || "Not recorded"}
                          </p>
                        </div>
                      ))}
                  </details>
                )}
              </div>
            </div>
          ))}
        {!p.events.length && (
          <p>Your first source connection will start the activity trail.</p>
        )}
      </section>
      {version && (
        <Modal
          title={`Handover version ${version.id}`}
          onClose={() => {
            setVersion(null);
            setInspect(null);
          }}
        >
          <p>
            Approved for {version.audience} · {date(version.at)}. This snapshot
            is preserved independently of the draft.
          </p>
          {inspect ? (
            <>
              <button onClick={() => setInspect(null)}>
                Back to version claims
              </button>
              <Evidence claim={inspect} records={version.records} />
            </>
          ) : (
            version.claims.map((c) => (
              <button
                className="version-claim"
                key={c.id}
                onClick={() => setInspect(c)}
              >
                <strong>{c.statement}</strong>
                <Badge>{c.review}</Badge>
              </button>
            ))
          )}
        </Modal>
      )}
    </>
  );
}
