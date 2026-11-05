import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  BriefcaseBusiness,
  ClipboardCheck,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { useApp } from "../context";
import { useResource } from "../hooks";
import {
  Badge,
  CompanyMark,
  DriveDetail,
  Empty,
  Loading,
  ErrorBox,
} from "../components/UI";
import { shortDate, money } from "../constants";

export default function Overview() {
  const { user, request, notify } = useApp();
  const admin = user.role === "admin";
  const drives = useResource("/drives", "drives");
  const applications = useResource("/applications", "applications");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const active = drives.data.filter(
    (d) => d.status === "Published" && new Date(d.deadline) >= new Date(),
  );
  const recommended = admin
    ? active
    : active.filter((d) => d.eligibility?.eligible && !d.myApplication);
  const interviews = applications.data.filter(
    (a) => a.status === "Interview",
  ).length;
  const offers = applications.data.filter((a) => a.status === "Offered").length;
  const stats = [
    [
      BriefcaseBusiness,
      admin
        ? active.length
        : active.filter((d) => d.eligibility?.eligible).length,
      admin ? "Active drives" : "Eligible drives",
      admin ? "/drives" : "/drives?show=eligible",
    ],
    [
      ClipboardCheck,
      admin
        ? applications.data.length
        : applications.data.filter((a) =>
            ["Applied", "Shortlisted", "Assessment", "Interview"].includes(
              a.status,
            ),
          ).length,
      admin ? "Applications" : "In progress",
      admin ? "/applications" : "/applications?stage=active",
    ],
    [CalendarDays, interviews, "In interview", "/applications?stage=Interview"],
    [
      Trophy,
      offers,
      admin ? "Offers made" : "Offers received",
      "/applications?stage=Offered",
    ],
  ];
  const loaded = !drives.loading && !applications.loading;
  async function apply(drive) {
    setBusy(true);
    try {
      await request(`/drives/${drive._id}/apply`, { method: "POST", body: {} });
      notify("Application submitted. You can track it in My applications.");
      setSelected(null);
      drives.refresh();
      applications.refresh();
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>
            {admin
              ? "Your placement overview"
              : `Welcome back, ${user.name.split(" ")[0]}`}
          </h1>
          <p className="muted">
            {admin
              ? "Manage campus opportunities and keep applications moving."
              : "Find your next opportunity and keep track of your applications."}
          </p>
        </div>
        <Link to="/drives" className="btn">
          {admin ? "Manage drives" : "Explore drives"}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <section className="summary-strip" aria-label="Placement summary">
        {stats.map(([Icon, count, label, url]) => (
          <Link to={url} className="summary-item" key={label}>
            <div>
              <span>{label}</span>
              <strong>{loaded ? count : "—"}</strong>
            </div>
            <Icon size={21} />
          </Link>
        ))}
      </section>
      {drives.error && (
        <ErrorBox message={drives.error} retry={drives.refresh} />
      )}
      {applications.error && (
        <ErrorBox message={applications.error} retry={applications.refresh} />
      )}
      <div className="dashboard-columns">
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>
              {admin ? "Open placement drives" : "Eligible opportunities"}
            </h2>
            <Link to="/drives">
              View all
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="panel opportunity-list">
            {drives.loading ? (
              <Loading />
            ) : (
              recommended.slice(0, 3).map((drive) => (
                <button
                  className="opportunity-row"
                  key={drive._id}
                  onClick={() => setSelected(drive)}
                >
                  <CompanyMark name={drive.company} />
                  <div className="opportunity-main">
                    <span className="row-company">{drive.company}</span>
                    <strong>{drive.role}</strong>
                    <span className="row-meta">
                      {drive.location} · {drive.workMode}
                    </span>
                  </div>
                  <div className="opportunity-side">
                    <strong>₹{money(drive)}</strong>
                    <span>Closes {shortDate(drive.deadline)}</span>
                  </div>
                  <ArrowUpRight size={18} />
                </button>
              ))
            )}
            {!drives.loading && !recommended.length && (
              <Empty title="No eligible opportunities yet">
                {admin
                  ? "Create a placement drive to get started."
                  : "Check your profile details or browse all drives."}
              </Empty>
            )}
          </div>
          {!admin && (
            <Link className="profile-inline-link" to="/profile">
              Keep your profile and resume up to date
              <ArrowUpRight size={15} />
            </Link>
          )}
        </section>
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Recent applications</h2>
            <Link to="/applications">
              View all
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="panel recent-list">
            {applications.loading ? (
              <Loading />
            ) : (
              applications.data.slice(0, 3).map((application) => (
                <Link
                  className="recent-application-row"
                  to="/applications"
                  key={application._id}
                >
                  <div>
                    <strong>
                      {application.drive?.company || "Archived drive"}
                    </strong>
                    <span>
                      {admin
                        ? application.snapshot?.name
                        : application.drive?.role}
                    </span>
                    <small>Applied {shortDate(application.createdAt)}</small>
                  </div>
                  <Badge status={application.status}>
                    {application.status}
                  </Badge>
                </Link>
              ))
            )}
            {!applications.loading && !applications.data.length && (
              <Empty title="No applications yet">
                Your applications will appear here after you apply.
              </Empty>
            )}
          </div>
        </section>
      </div>
      {selected && (
        <DriveDetail
          drive={selected}
          onClose={() => setSelected(null)}
          onApply={apply}
          busy={busy}
          admin={admin}
          onEdit={() => {
            setSelected(null);
            notify("Open Manage drives to edit this opportunity.");
          }}
        />
      )}
    </>
  );
}
