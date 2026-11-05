import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ClipboardList,
  Users,
  Megaphone,
  UserRound,
  LogOut,
  GraduationCap,
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect, useId } from "react";
import { useApp } from "../context";
const studentLinks = [
  ["/", "Overview", LayoutDashboard],
  ["/drives", "Placement drives", BriefcaseBusiness],
  ["/applications", "My applications", ClipboardList],
  ["/announcements", "Notice board", Megaphone],
  ["/profile", "My profile", UserRound],
];
const adminLinks = [
  ["/", "Overview", LayoutDashboard],
  ["/drives", "Manage drives", BriefcaseBusiness],
  ["/applications", "Applications", ClipboardList],
  ["/students", "Students", Users],
  ["/announcements", "Notice board", Megaphone],
  ["/profile", "Officer profile", UserRound],
];
export default function Layout() {
  const { user, demo, enterDemo, logout, notify } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const accountId = useId();
  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname, user.role]);
  useEffect(() => {
    if (!accountOpen) return;
    accountRef.current?.querySelector("a")?.focus();
    function dismiss(event) {
      if (event.type === "keydown" && event.key === "Escape") {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      } else if (
        event.type === "pointerdown" &&
        !accountRef.current?.contains(event.target)
      )
        setAccountOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [accountOpen]);
  const admin = user.role === "admin";
  const links = admin ? adminLinks : studentLinks;
  const label =
    links.find(([url]) => url === location.pathname)?.[1] || "Workspace";
  return (
    <div className="flex min-h-screen">
      <div
        className={`sidebar-scrim ${open ? "visible" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-symbol">
            <GraduationCap size={25} />
          </span>
          placement<span>pal</span>
          <span className="brand-dot">.</span>
        </Link>
        <button
          className="mobile-close icon-btn"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <div
          className="sidebar-scroll"
          tabIndex={0}
          role="region"
          aria-label="Scrollable workspace navigation"
        >
          <div className="workspace-label">CAMPUS WORKSPACE</div>
          <div className="college-box">
            <div className="college-icon">
              <GraduationCap size={18} />
            </div>
            <div>
              <strong>Rizvi College</strong>
              <small>
                {admin
                  ? "Placement office"
                  : `Class of ${user.graduationYear || "2026"}`}
              </small>
            </div>
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav>
            {links.map(([url, title, Icon]) => (
              <NavLink
                key={url}
                to={url}
                end={url === "/"}
                onClick={() => setOpen(false)}
              >
                <Icon size={19} />
                {title}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-user">
          <span className="avatar">
            {user.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{admin ? "Placement officer" : "Student account"}</small>
          </div>
          <button
            className="icon-btn"
            aria-label="Sign out"
            onClick={() => logout().catch((e) => notify(e.message, true))}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-btn"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{label}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <div className="account-menu" ref={accountRef}>
              <button
                className="account-trigger"
                ref={accountButtonRef}
                aria-label="Account options"
                aria-expanded={accountOpen}
                aria-controls={accountId}
                onClick={() => setAccountOpen((value) => !value)}
              >
                <span className="avatar small">{user.name[0]}</span>
                <span className="account-name">{user.name}</span>
                <ChevronDown size={15} />
              </button>
              {accountOpen && (
                <div
                  className="account-dropdown"
                  id={accountId}
                  aria-label="Account options"
                >
                  <div className="account-summary">
                    <strong>
                      {admin ? "Placement officer" : "Student account"}
                    </strong>
                    <span>{user.email}</span>
                  </div>
                  <Link to="/profile" onClick={() => setAccountOpen(false)}>
                    <UserRound size={16} />
                    {admin ? "Officer profile" : "My profile"}
                  </Link>
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      logout().catch((error) => notify(error.message, true));
                    }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <strong>Demo workspace</strong> · Sample data saved on this
              browser.
            </span>
            <button onClick={() => enterDemo(admin ? "student" : "admin")}>
              Switch to {admin ? "student" : "officer"} view{" "}
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}
        <main key={location.pathname}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} PlacementPal</span>
          <span>Built for possibilities.</span>
        </footer>
      </div>
    </div>
  );
}
