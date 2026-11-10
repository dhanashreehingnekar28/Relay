import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Github,
  FileText,
  Columns3,
  MessagesSquare,
  Check,
  ArrowRight,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import { useStore } from "../state/Store";
import { connectors } from "../data/scenario";
import { authorizedRecords } from "../domain/engine";
import type { SourceType } from "../domain/types";
import { Heading, Badge, date, Modal } from "../components/UI";
const icons = {
  github: Github,
  notes: FileText,
  board: Columns3,
  chat: MessagesSquare,
};
export function Sources() {
  const { state, p, dispatch } = useStore();
  const [busy, setBusy] = useState<SourceType | null>(null);
  const [inspect, setInspect] = useState<SourceType | null>(null);
  const all = authorizedRecords(p, state.role);
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => {
      dispatch({ type: "connect", source: busy });
      setBusy(null);
    }, 450);
    return () => clearTimeout(t);
  }, [busy, dispatch]);
  return (
    <>
      <Heading
        eyebrow="01 / CONNECT"
        title="Bring the context together."
        description="Connect fictional project sources. Every imported record keeps its origin and access scope."
        action={
          <Link className="button primary" to="/reconstruct">
            Next: reconstruct <ArrowRight size={17} />
          </Link>
        }
      />
      <div className="notice">
        <LockKeyhole size={19} />
        <div>
          <strong>Demo connections, real interactions.</strong>
          <p>
            No accounts are authenticated and no external data is retrieved.
            These controls import a fixed synthetic dataset into this local
            demonstration.
          </p>
        </div>
      </div>
      <div className="source-grid">
        {connectors.map((c) => {
          const Icon = icons[c.id];
          const connected = p.connections.includes(c.id);
          const rs = all.filter((r) => r.type === c.id);
          return (
            <section className="source-card" key={c.id}>
              <div className="row">
                <span className={`connector-icon ${c.id}`}>
                  <Icon size={24} />
                </span>
                <Badge>{connected ? "Connected" : "Not connected"}</Badge>
              </div>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <div className="source-count">
                {connected ? (
                  <>
                    <strong>{rs.length}</strong> authorized records{" "}
                    <small>
                      Latest:{" "}
                      {date(
                        rs
                          .map((r) => r.timestamp)
                          .sort()
                          .at(-1) || "2026-11-07",
                      )}
                    </small>
                  </>
                ) : (
                  <span>Ready to connect · Synthetic data</span>
                )}
              </div>
              <div className="actions justify-between">
                <button
                  disabled={!!busy}
                  className={connected ? "" : "primary"}
                  onClick={() => setBusy(c.id)}
                >
                  {busy === c.id
                    ? "Simulating connection…"
                    : connected
                      ? "Disconnect"
                      : "Connect Demo Source"}
                </button>
                {connected && (
                  <button onClick={() => setInspect(c.id)}>
                    Inspect records
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <section className="panel mt-6">
        <div className="row">
          <div>
            <h3>Lead-only communication records</h3>
            <p>
              Include two restricted records for Riya’s review. They never enter
              Neha’s handover.
            </p>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={p.restrictedEnabled}
              onChange={(e) =>
                dispatch({ type: "restricted", enabled: e.target.checked })
              }
            />{" "}
            Allow lead-only import
          </label>
        </div>
        <p className="hint">
          Permission filtering is a frontend interaction simulation. Production
          access control must be enforced server-side.
        </p>
      </section>
      {inspect && (
        <Modal title="Imported sample records" onClose={() => setInspect(null)}>
          <div className="source-excerpts">
            {all
              .filter((r) => r.type === inspect)
              .map((r) => (
                <Link className="excerpt" key={r.id} to={`/record/${r.id}`}>
                  <div className="row">
                    <strong>{r.title}</strong>
                    <Badge>{r.access === "team" ? "Team" : "Lead only"}</Badge>
                  </div>
                  <small>
                    {r.id} · {r.author} · {date(r.timestamp)}
                  </small>
                </Link>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
const steps = [
  "Reading authorized source records",
  "Organizing project activity",
  "Identifying candidate decisions",
  "Extracting blockers and ownership",
  "Linking evidence references",
  "Checking conflicting records",
  "Preparing claims for human review",
];
export function Reconstruct() {
  const { p, dispatch } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(-1);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (step < 0) return;
    const t = setTimeout(() => {
      if (step === steps.length - 1) {
        dispatch({ type: "reconstruct" });
        nav("/knowledge");
      } else setStep((s) => s + 1);
    }, 420);
    return () => clearTimeout(t);
  }, [step, dispatch, nav]);
  function start() {
    if (p.run && !confirm) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    setStep(0);
  }
  return (
    <>
      <Heading
        eyebrow="02 / RECONSTRUCT"
        title="From scattered records to shared context."
        description="A deterministic simulation of the proposed reconstruction pipeline. No AI inference is performed."
      />
      <section className="reconstruct panel">
        <span className="reconstruct-symbol">
          <GitIcon />
        </span>
        <Badge>Simulated AI Reconstruction</Badge>
        <h2>
          {step >= 0
            ? "Connecting the dots…"
            : "Let’s reconstruct the project."}
        </h2>
        <p>
          {authorizedRecords(p, "reviewer").length} authorized records across{" "}
          {p.connections.length} sources.
          <br />
          Only connected, permitted records contribute evidence.
        </p>
        {p.dirty && (
          <p className="warning">
            Sources or members changed. A new run is needed before approval.
          </p>
        )}
        <div className="pipeline">
          {steps.map((s, i) => (
            <div
              key={s}
              className={step >= i ? "pipeline-step active" : "pipeline-step"}
            >
              <span>{step > i ? <Check size={15} /> : i + 1}</span>
              {s}
              {step === i && <span className="pulse" />}
            </div>
          ))}
        </div>
        {step >= 0 ? (
          <progress
            aria-label="Reconstruction progress"
            max={7}
            value={step + 1}
          />
        ) : (
          <button
            className="primary"
            disabled={!p.connections.length}
            onClick={start}
          >
            Reconstruct Project Knowledge <ArrowRight size={16} />
          </button>
        )}
        {!p.connections.length && (
          <p>
            <Link className="text-link" to="/sources">
              Connect at least one source to begin.
            </Link>
          </p>
        )}
      </section>
      {confirm && (
        <Modal title="Reconstruct the draft?" onClose={() => setConfirm(false)}>
          <p>
            This will replace draft claims and reset their review decisions
            using the current sources. Previous review history and approved
            versions remain available.
          </p>
          <div className="actions">
            <button onClick={() => setConfirm(false)}>Cancel</button>
            <button className="primary" onClick={start}>
              Reconstruct draft
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function GitIcon() {
  return <RefreshCw size={27} />;
}
