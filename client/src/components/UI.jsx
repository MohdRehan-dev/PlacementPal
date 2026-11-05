import { useEffect, useRef, useState, useId } from "react";
import {
  X,
  ArrowUpRight,
  MapPin,
  Clock3,
  Building2,
  Check,
  SearchX,
} from "lucide-react";
import { useApp } from "../context";
import { Link } from "react-router-dom";
import { date, daysLeft, money } from "../constants";
export function Badge({ children, status = "" }) {
  return <span className={`badge ${status.toLowerCase()}`}>{children}</span>;
}
export function CompanyMark({ name, large = false }) {
  return (
    <div
      className={`company-mark ${large ? "large" : ""} tone-${name.charCodeAt(0) % 5}`}
    >
      {name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </div>
  );
}
export function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="empty">
      <SearchX size={32} />
      <h3>{title}</h3>
      <p>{children || "Try changing your filters."}</p>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Loading your workspace…
    </div>
  );
}
export function ErrorBox({ message, retry }) {
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {retry && (
        <button className="btn secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef();
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    const close = (e) => {
      e.preventDefault();
      onClose();
    };
    const dialog = ref.current;
    dialog.addEventListener("cancel", close);
    return () => {
      dialog.removeEventListener("cancel", close);
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? "wide" : ""}`}
    >
      <div className="modal-top">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function DriveCard({ drive, onOpen, admin }) {
  const left = daysLeft(drive.deadline);
  return (
    <article className="drive-card">
      <div className="card-top">
        <CompanyMark name={drive.company} />
        <Badge
          status={
            drive.myApplication
              ? "Applied"
              : drive.eligibility?.eligible
                ? "Eligible"
                : "neutral"
          }
        >
          {admin
            ? drive.status
            : drive.myApplication
              ? "Applied"
              : drive.eligibility?.eligible
                ? "Eligible"
                : "Not eligible"}
        </Badge>
      </div>
      <p className="company-name">{drive.company}</p>
      <h3>{drive.role}</h3>
      <div className="metadata">
        <span>
          <MapPin size={14} />
          {drive.location}
        </span>
        <span>·</span>
        <span>{drive.workMode}</span>
      </div>
      <div className="tag-row">
        {drive.skills.slice(0, 3).map((skill) => (
          <span className="tag" key={skill}>
            {skill}
          </span>
        ))}
      </div>
      <div className="card-salary">
        <strong>₹{money(drive)}</strong>
        <span>{drive.employmentType}</span>
      </div>
      <div className="card-bottom">
        <span className={left <= 3 ? "urgent" : ""}>
          <Clock3 size={14} />
          {left < 0
            ? "Deadline passed"
            : left === 0
              ? "Closes today"
              : `${left} days left`}
        </span>
        <button onClick={() => onOpen(drive)}>
          View drive <ArrowUpRight size={16} />
        </button>
      </div>
    </article>
  );
}
export function DriveDetail({ drive, onClose, onApply, busy, admin, onEdit }) {
  const { user, demo } = useApp();
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const reviewRef = useRef(null);
  useEffect(() => {
    if (reviewing) {
      reviewRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
      reviewRef.current?.focus({ preventScroll: true });
    }
  }, [reviewing]);
  return (
    <Modal title="Placement drive" onClose={onClose} wide>
      <div className="detail-heading">
        <CompanyMark name={drive.company} large />
        <div>
          <p className="eyebrow">{drive.company}</p>
          <h2>{drive.role}</h2>
          <div className="metadata">
            <MapPin size={15} />
            {drive.location} · {drive.workMode}
          </div>
        </div>
      </div>
      <div className="detail-stats">
        <div>
          <small>Annual CTC</small>
          <strong>₹{money(drive)}</strong>
        </div>
        <div>
          <small>Apply before</small>
          <strong>{date(drive.deadline)}</strong>
        </div>
        <div>
          <small>Drive date</small>
          <strong>{date(drive.driveDate)}</strong>
        </div>
      </div>
      <h3>About the opportunity</h3>
      <p className="description">{drive.description}</p>
      <div className="tag-row">
        {drive.skills.map((s) => (
          <span className="tag" key={s}>
            {s}
          </span>
        ))}
      </div>
      <h3>Who can apply</h3>
      <ul className="criteria">
        <li>
          Minimum {drive.minCgpa} CGPA · Maximum {drive.maxBacklogs} active
          backlogs
        </li>
        <li>Graduating in {drive.graduationYears.join(" / ")}</li>
        <li>{drive.branches.join(", ")}</li>
      </ul>
      <h3>Selection process</h3>
      <div className="rounds">
        {drive.rounds.map((r, i) => (
          <div key={i}>
            <span>{i + 1}</span>
            {r}
          </div>
        ))}
      </div>
      {!admin && !drive.eligibility?.eligible && (
        <div className="notice">{drive.eligibility?.reasons.join(" ")}</div>
      )}
      {reviewing && !admin && !drive.myApplication && (
        <section
          className="application-review"
          tabIndex={-1}
          ref={reviewRef}
          aria-labelledby="review-heading"
        >
          <h3 id="review-heading">Review your application</h3>
          <p>
            Your saved profile and resume link will be submitted to{" "}
            {drive.company} for the {drive.role} role.
          </p>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Branch</dt>
              <dd>{user.branch || "Not added"}</dd>
            </div>
            <div>
              <dt>Graduation year</dt>
              <dd>{user.graduationYear || "Not added"}</dd>
            </div>
            <div>
              <dt>CGPA</dt>
              <dd>{user.cgpa ?? "Not added"}</dd>
            </div>
            <div>
              <dt>Resume</dt>
              <dd>
                {user.resumeUrl ? (
                  <a href={user.resumeUrl} target="_blank" rel="noreferrer">
                    Open submitted resume ↗
                  </a>
                ) : (
                  "No resume link added"
                )}
              </dd>
            </div>
          </dl>
          {demo && (
            <p>
              This is a browser demo. The sample resume is a placeholder and
              this application stays in your browser.
            </p>
          )}
          <p>
            Need to make changes?{" "}
            <Link to="/profile" onClick={onClose}>
              Update your profile first
            </Link>
            .
          </p>
          <label className="review-consent">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={busy}
            />
            I have reviewed my details and want to submit this application.
          </label>
          <div className="button-row">
            <button
              className="btn"
              disabled={!confirmed || !user.resumeUrl || busy}
              onClick={() => onApply(drive)}
            >
              {busy ? "Submitting…" : "Confirm & submit application"}
            </button>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => {
                setReviewing(false);
                setConfirmed(false);
              }}
            >
              Back to drive
            </button>
          </div>
        </section>
      )}
      <div className="modal-actions">
        <span className="muted">
          <Building2 size={15} /> {drive.applicationCount || 0} applications
        </span>
        {admin ? (
          <button className="btn" onClick={() => onEdit(drive)}>
            Edit drive
          </button>
        ) : drive.myApplication ? (
          <Badge status="Applied">
            <Check size={14} />
            Application submitted
          </Badge>
        ) : !reviewing ? (
          <button
            className="btn"
            disabled={!drive.eligibility?.eligible || busy}
            onClick={() => setReviewing(true)}
          >
            Review & apply
            <ArrowUpRight size={16} />
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
export function Field({ label, children, hint, ...props }) {
  return (
    <label className={`field ${props.className || ""}`}>
      <span>{label}</span>
      {children || <input {...props} />} {hint && <small>{hint}</small>}
    </label>
  );
}
