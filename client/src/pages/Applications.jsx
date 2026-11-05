import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import {
  Download,
  Search,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context";
import { useResource } from "../hooks";
import {
  Badge,
  CompanyMark,
  Empty,
  Loading,
  ErrorBox,
  Modal,
  Field,
} from "../components/UI";
import { STAGES, date } from "../constants";
export default function Applications() {
  const { user, request, notify, demo } = useApp(),
    admin = user.role === "admin";
  const { data, loading, error, refresh } = useResource(
    "/applications",
    "applications",
  );
  const [params] = useSearchParams();
  const initialStage = params.get("stage");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState(
      initialStage === "active"
        ? "In progress"
        : STAGES.includes(initialStage)
          ? initialStage
          : "All stages",
    ),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  const filtered = data.filter(
    (a) =>
      `${a.drive?.company} ${a.drive?.role} ${a.snapshot?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All stages" ||
        (filter === "In progress"
          ? ["Applied", "Shortlisted", "Assessment", "Interview"].includes(
              a.status,
            )
          : a.status === filter)),
  );
  async function update(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      await request(`/applications/${selected._id}/status`, {
        method: "PATCH",
        body,
      });
      setSelected(null);
      notify("Application status updated.");
      refresh();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  async function withdraw() {
    setBusy(true);
    try {
      await request(`/applications/${selected._id}/withdraw`, {
        method: "POST",
        body: {},
      });
      setSelected(null);
      setConfirm(false);
      notify("Application withdrawn.");
      refresh();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  function exportDemo() {
    const cell = (v) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const csv = [
      ["Student", "Company", "Role", "Status"],
      ...data.map((a) => [
        a.snapshot.name,
        a.drive.company,
        a.drive.role,
        a.status,
      ]),
    ]
      .map((r) => r.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "placementpal-demo-applications.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">APPLICATION TRACKING</p>
          <h1>{admin ? "Applications" : "My applications"}</h1>
          <p className="muted">
            {admin
              ? "Review student applications and move the right talent forward."
              : "Track your progress and review updates from the placement team."}
          </p>
        </div>
        {admin &&
          (demo ? (
            <button className="btn secondary" onClick={exportDemo}>
              <Download size={16} />
              Export CSV
            </button>
          ) : (
            <a className="btn secondary" href="/api/applications/export">
              <Download size={16} />
              Export CSV
            </a>
          ))}
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            aria-label="Search applications"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              admin
                ? "Search company, student or role…"
                : "Search company or role…"
            }
          />
        </div>
        <select
          aria-label="Application stage"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All stages", "In progress", ...STAGES].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : loading ? (
        <Loading />
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company & role</th>
                {admin && <th>Student</th>}
                <th>Applied on</th>
                <th>Stage</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a._id}>
                  <td>
                    <div className="table-company">
                      <CompanyMark name={a.drive?.company || "Archived"} />
                      <div>
                        <strong>{a.drive?.company || "Archived drive"}</strong>
                        <small>{a.drive?.role}</small>
                      </div>
                    </div>
                  </td>
                  {admin && (
                    <td>
                      <strong>{a.snapshot?.name}</strong>
                      <small>{a.snapshot?.email}</small>
                    </td>
                  )}
                  <td>{date(a.createdAt)}</td>
                  <td>
                    <Badge status={a.status}>{a.status}</Badge>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSelected(a);
                        setConfirm(false);
                      }}
                    >
                      View <ArrowUpRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <Empty title="No applications here yet">
              Find a drive that fits and start your journey.
            </Empty>
          )}
        </div>
      )}
      {selected && (
        <Modal title="Application journey" onClose={() => setSelected(null)}>
          <div className="detail-heading">
            <CompanyMark name={selected.drive?.company || "Archived"} />
            <div>
              <h3>{selected.drive?.role}</h3>
              <p className="muted">{selected.drive?.company}</p>
            </div>
          </div>
          {admin && (
            <div className="notice">
              <strong>{selected.snapshot?.name}</strong>
              <p>
                {selected.snapshot?.email} · {selected.snapshot?.branch} · CGPA{" "}
                {selected.snapshot?.cgpa}
                {selected.snapshot?.graduationYear &&
                  ` · Class of ${selected.snapshot.graduationYear}`}
                {selected.snapshot?.backlogs != null &&
                  ` · Backlogs ${selected.snapshot.backlogs}`}
              </p>
              {selected.snapshot?.resumeUrl && (
                <a
                  href={selected.snapshot.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View submitted resume ↗
                </a>
              )}
            </div>
          )}
          <div className="timeline">
            {selected.history.map((h, i) => (
              <div className="timeline-item" key={i}>
                <span className="timeline-dot">
                  <CheckCircle2 size={17} />
                </span>
                <div>
                  <strong>{h.status}</strong>
                  <small>{date(h.at)}</small>
                  <p>{h.note || "Status updated by the placement team."}</p>
                </div>
              </div>
            ))}
          </div>
          {admin && selected.status !== "Withdrawn" && (
            <form className="status-form" onSubmit={update}>
              <h3>Move this application forward</h3>
              <Field label="New stage">
                <select name="status" defaultValue={selected.status}>
                  {STAGES.filter((s) => s !== "Withdrawn").map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Note to student">
                <textarea
                  name="note"
                  rows={3}
                  maxLength={500}
                  placeholder="Share next steps or feedback…"
                />
              </Field>
              <button className="btn" disabled={busy}>
                {busy ? "Updating…" : "Update status"}
              </button>
            </form>
          )}
          {!admin &&
            !["Rejected", "Offered", "Withdrawn"].includes(selected.status) && (
              <div className="withdraw-section">
                {confirm ? (
                  <>
                    <p>
                      Withdraw this application? You won’t be able to apply to
                      this drive again.
                    </p>
                    <div className="button-row">
                      <button
                        className="btn danger"
                        onClick={withdraw}
                        disabled={busy}
                      >
                        {busy ? "Withdrawing…" : "Yes, withdraw"}
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => setConfirm(false)}
                      >
                        Keep application
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    className="text-button danger-text"
                    onClick={() => setConfirm(true)}
                  >
                    Withdraw application
                  </button>
                )}
              </div>
            )}
        </Modal>
      )}
    </>
  );
}
