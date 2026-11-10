import { useEffect, useState } from "react";
import {
  HashRouter,
  NavLink,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  LayoutDashboard,
  FolderKanban,
  Database,
  Workflow,
  ScanSearch,
  Radar,
  ClipboardCheck,
  Send,
  History,
  Route as RouteIcon,
  RotateCcw,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { Store, useStore } from "./state/Store";
import { projects } from "./data/scenario";
import { latest } from "./domain/engine";
import { Overview, Projects } from "./pages/Overview";
import { Sources, Reconstruct } from "./pages/Sources";
import { Knowledge, RecordPage } from "./pages/Knowledge";
import { Review, Gaps } from "./pages/Review";
import { Handover, Plan } from "./pages/Handover";
import { History as HistoryPage } from "./pages/History";
import { Modal } from "./components/UI";
import type { Role } from "./domain/types";
const navigation = [
  ["/", "Overview", LayoutDashboard],
  ["/projects", "Projects", FolderKanban],
  ["/sources", "Data Sources", Database],
  ["/reconstruct", "Reconstruction", Workflow],
  ["/knowledge", "Project Knowledge", BookOpen],
  ["/evidence", "Evidence Explorer", ScanSearch],
  ["/gaps", "Knowledge Gap Radar", Radar],
  ["/review", "Review & Approval", ClipboardCheck],
  ["/handover", "Handover", Send],
  ["/plan", "First-week Plan", RouteIcon],
  ["/history", "Activity History", History],
] as const;
const incomingPaths = ["/", "/projects", "/handover", "/plan"];
const departingPaths = [
  "/",
  "/projects",
  "/knowledge",
  "/evidence",
  "/gaps",
  "/handover",
  "/plan",
];
function Guard({
  children,
  reviewer = false,
}: {
  children: React.ReactNode;
  reviewer?: boolean;
}) {
  const { state } = useStore();
  if ((reviewer && state.role !== "reviewer") || state.role === "incoming")
    return <Navigate to="/handover" replace />;
  return children;
}
const guideSteps = [
  [
    "Start with your sources",
    "Connect the repository, meeting notes, task board and communication export. Each source changes what Relay can reconstruct.",
    "/sources",
  ],
  [
    "Reconstruct the project",
    "Run the simulated pipeline. Only connected, authorized synthetic records are read.",
    "/reconstruct",
  ],
  [
    "Inspect the contradiction",
    "Open the payment claim. Compare the open issue with the message claiming the staging issue is fixed.",
    "/evidence/payment",
  ],
  [
    "Keep a human in control",
    "Review every claim. Correct payment status, reassign cron ownership, and record verification reasons. Reject a claim to see it excluded.",
    "/review",
  ],
  [
    "Approve a version",
    "Choose the incoming developer audience, confirm appropriateness and approve. Unresolved claims remain clearly labelled.",
    "/review",
  ],
  [
    "Change perspectives",
    "Switch to Neha’s incoming developer view. Drafts, lead-only claims and restricted sources are unavailable.",
    "/handover",
  ],
  [
    "Turn context into action",
    "Open a task, inspect its evidence, add a personal note and mark it complete. Progress updates immediately.",
    "/plan",
  ],
  [
    "Close the loop",
    "Return to the handover and acknowledge receipt. You have completed the same workflow the free-exploration screens use.",
    "/handover",
  ],
];
function Shell() {
  const { state, p, dispatch, storageError } = useStore();
  const loc = useLocation();
  const nav = useNavigate();
  const [reset, setReset] = useState(false);
  const [guide, setGuide] = useState(-1);
  const [menu, setMenu] = useState(false);
  const [about, setAbout] = useState(false);
  const [toast, setToast] = useState("");
  const current = projects.find((pr) => pr.id === state.projectId)!;
  const event = p.events[0];
  useEffect(() => {
    if (!event) return;
    setToast(`${event.type}: ${event.detail}`);
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [event?.id, event?.at]);
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  function goGuide(i: number) {
    setGuide(i);
    if (i === 5) dispatch({ type: "role", role: "incoming" });
    nav(guideSteps[i][2]);
  }
  const guideReady =
    guide === 0
      ? p.connections.length === 4
      : guide === 1
        ? p.run > 0
        : guide === 3
          ? !p.claims.some((c) => c.review === "Pending Review")
          : guide === 4
            ? !!latest(p)
            : true;
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <NavLink to="/" className="brand">
          <span className="brand-symbol">
            r<span>↗</span>
          </span>
          <span>
            relay<span className="brand-dot">.</span>
          </span>
        </NavLink>
        <div className="workspace-label">DEV404 WORKSPACE</div>
        <div className="workspace-card">
          <span className="workspace-avatar">D4</span>
          <div>
            <strong>Project continuity</strong>
            <small>Round 1 · Design simulation</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation
            .filter(
              ([path]) =>
                state.role === "reviewer" ||
                (state.role === "incoming"
                  ? incomingPaths
                  : departingPaths
                ).includes(path),
            )
            .map(([path, label, Icon]) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <Icon size={18} />
                <span>{label}</span>
                {path === "/review" &&
                  p.claims.some((c) => c.review === "Pending Review") && (
                    <span className="nav-count">
                      {
                        p.claims.filter((c) => c.review === "Pending Review")
                          .length
                      }
                    </span>
                  )}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <ShieldCheck size={20} />
            <h3>Knowledge carries forward.</h3>
            <p>
              Evidence first.
              <br />
              People in control.
            </p>
          </div>
          <button className="sidebar-about" onClick={() => setAbout(true)}>
            About this prototype <ArrowUpRight size={14} />
          </button>
          <div className="sidebar-user">
            <span className="avatar">
              {state.role === "reviewer"
                ? "R"
                : state.role === "incoming"
                  ? "N"
                  : p.departing[0]}
            </span>
            <div>
              <strong>
                {state.role === "reviewer"
                  ? "Riya"
                  : state.role === "incoming"
                    ? "Neha"
                    : p.departing}
              </strong>
              <small>
                {state.role === "reviewer"
                  ? "Team lead / reviewer"
                  : state.role === "incoming"
                    ? "Incoming developer"
                    : "Departing developer"}
              </small>
            </div>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          aria-label="Close menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <label className="project-switch">
            <span className="tiny-project">{current.code}</span>
            <select
              aria-label="Current project"
              value={state.projectId}
              onChange={(e) => {
                dispatch({ type: "project", id: e.target.value });
                setGuide(-1);
                nav("/");
              }}
            >
              {projects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </label>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> DEMO MODE
            </span>
            <select
              aria-label="Demo role"
              value={state.role}
              onChange={(e) => {
                dispatch({ type: "role", role: e.target.value as Role });
                nav(e.target.value === "incoming" ? "/handover" : "/");
              }}
            >
              <option value="reviewer">Team Lead / Reviewer</option>
              <option value="incoming">Incoming Developer</option>
              <option value="departing">Departing Developer</option>
            </select>
            <button className="reset-button" onClick={() => setReset(true)}>
              <RotateCcw size={15} />
              <span>Reset Demo</span>
            </button>
          </div>
        </header>
        <div className="context-bar">
          <span>
            Workspace <ChevronRight size={13} /> {current.name}{" "}
            <ChevronRight size={13} />{" "}
            <strong>
              {navigation.find(([path]) => path === loc.pathname)?.[1] ||
                "Evidence detail"}
            </strong>
          </span>
          <button
            className="text-link"
            onClick={() => {
              dispatch({ type: "role", role: "reviewer" });
              goGuide(0);
            }}
          >
            <RouteIcon size={16} /> Guided Demo
          </button>
        </div>
        {guide >= 0 && (
          <section className="guide" aria-label="Guided demo">
            <div className="guide-number">{guide + 1}/8</div>
            <div>
              <strong>{guideSteps[guide][0]}</strong>
              <p>{guideSteps[guide][1]}</p>
            </div>
            <div className="guide-actions">
              <button onClick={() => setGuide(-1)}>Explore Freely</button>
              {guide > 0 && (
                <button
                  onClick={() => {
                    if (guide - 1 < 5)
                      dispatch({ type: "role", role: "reviewer" });
                    goGuide(guide - 1);
                  }}
                >
                  Back
                </button>
              )}
              <button
                className="primary"
                disabled={!guideReady}
                onClick={() => (guide < 7 ? goGuide(guide + 1) : setGuide(-1))}
              >
                {guide === 7 ? "Finish tour" : "Next"}
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        )}
        {storageError && (
          <p className="storage-warning" role="status">
            Browser storage is unavailable. You can continue, but this session
            will not survive a reload.
          </p>
        )}
        <main id="main" tabIndex={-1} key={`${state.projectId}-${state.role}`}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/projects" element={<Projects />} />
            <Route
              path="/sources"
              element={
                <Guard reviewer>
                  <Sources />
                </Guard>
              }
            />
            <Route
              path="/reconstruct"
              element={
                <Guard reviewer>
                  <Reconstruct />
                </Guard>
              }
            />
            <Route
              path="/knowledge"
              element={
                <Guard>
                  <Knowledge />
                </Guard>
              }
            />
            <Route
              path="/evidence"
              element={
                <Guard>
                  <Knowledge explorer />
                </Guard>
              }
            />
            <Route
              path="/evidence/:id"
              element={
                <Guard>
                  <Knowledge explorer />
                </Guard>
              }
            />
            <Route path="/record/:id" element={<RecordPage />} />
            <Route
              path="/gaps"
              element={
                <Guard>
                  <Gaps />
                </Guard>
              }
            />
            <Route
              path="/review"
              element={
                <Guard reviewer>
                  <Review />
                </Guard>
              }
            />
            <Route path="/handover" element={<Handover />} />
            <Route path="/plan" element={<Plan />} />
            <Route
              path="/history"
              element={
                <Guard reviewer>
                  <HistoryPage />
                </Guard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer>
          <span>Relay · Interactive Concept Prototype</span>
          <span>
            Synthetic demonstration data · Simulated integrations & AI
          </span>
        </footer>
      </div>
      {toast && state.role === "reviewer" && (
        <div role="status" className="toast">
          <CheckIcon />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {reset && (
        <Modal title="Reset the entire demo?" onClose={() => setReset(false)}>
          <p>
            This clears both local project workspaces, including reviews,
            approved versions, personal notes and onboarding progress. All
            sources return to disconnected.
          </p>
          <div className="actions">
            <button onClick={() => setReset(false)}>Keep my progress</button>
            <button
              className="danger"
              onClick={() => {
                dispatch({ type: "reset" });
                setReset(false);
                setGuide(-1);
                setToast("");
                nav("/");
              }}
            >
              Reset everything
            </button>
          </div>
        </Modal>
      )}
      {about && (
        <Modal
          title="A concept you can interact with"
          onClose={() => setAbout(false)}
        >
          <p>
            Relay is Dev404’s evidence-aware knowledge handover proposal for
            HackWithPune. This local React experience simulates its workflow
            with deterministic, fictional records.
          </p>
          <h3>What is simulated?</h3>
          <p>
            Source connections, AI extraction, roles, access checks and
            collaboration. Nothing connects to GitHub, an AI model or a
            production database. State is stored in this browser.
          </p>
          <h3>Event status</h3>
          <p>
            The supplied brief restricts development to the official build
            window. Round 1 prototype eligibility is unconfirmed. This is a
            design simulation, not a claim of an eligible competition build.
          </p>
          <h3>Proposed production system</h3>
          <p>
            React → FastAPI with authenticated permission checks → PostgreSQL +
            pgvector. Authorized GitHub and file ingestion feed bounded
            structured LLM extraction, followed by deterministic evidence checks
            and human review.
          </p>
          <p className="hint">
            Generated with OpenAI Codex assistance. No accuracy or
            onboarding-improvement metrics have been measured.
          </p>
        </Modal>
      )}
    </div>
  );
}
function CheckIcon() {
  return <ShieldCheck size={19} />;
}
export default function App() {
  return (
    <Store>
      <HashRouter>
        <Shell />
      </HashRouter>
    </Store>
  );
}
