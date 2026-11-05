import { useState } from "react";
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "../context";
import { Field } from "../components/UI";
export default function Auth() {
  const { request, setUser, enterDemo } = useApp();
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [visible, setVisible] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      setUser(
        (
          await request(`/auth/${signup ? "signup" : "login"}`, {
            method: "POST",
            body,
          })
        ).user,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand light">
          <span className="brand-symbol">
            <GraduationCap />
          </span>
          placement<span>pal</span>.
        </div>
        <div className="auth-intro">
          <span className="auth-kicker">YOUR CAMPUS PLACEMENT WORKSPACE</span>
          <h1>
            Your campus.
            <br />
            <em>Your next opportunity.</em>
          </h1>
          <p>
            Discover placement drives, apply with confidence, and follow every
            step in one place.
          </p>
          <div className="auth-feature-list">
            <span>
              <CheckCircle2 size={18} />
              Opportunities matched to your profile
            </span>
            <span>
              <CheckCircle2 size={18} />
              One place for every application
            </span>
            <span>
              <CheckCircle2 size={18} />
              Updates from your placement team
            </span>
          </div>
        </div>
        <span className="auth-bottom">PLACEMENTPAL · CAMPUS TO CAREER</span>
      </section>
      <section className="auth-form-section">
        <div className="auth-form">
          <h2>{signup ? "Create your account" : "Welcome back"}</h2>
          <p className="muted">
            {signup
              ? "Create a student account to explore campus opportunities."
              : "Sign in to your campus placement workspace."}
          </p>
          <form onSubmit={submit}>
            {signup && (
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
                placeholder="Your full name"
              />
            )}
            <Field
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@college.edu"
              required
            />
            <Field label="Password">
              <div className="password-input">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  minLength={signup ? 8 : 1}
                  maxLength={128}
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  placeholder={
                    signup ? "At least 8 characters" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
            <button className="btn full" disabled={busy}>
              {busy
                ? "Please wait…"
                : signup
                  ? "Create student account"
                  : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {signup ? "Already have an account?" : "New to PlacementPal?"}{" "}
            <button
              onClick={() => {
                setSignup(!signup);
                setError("");
              }}
            >
              {signup ? "Sign in" : "Create an account"}
            </button>
          </p>
          <div className="or-divider">
            <span />
            JUST EXPLORING?
            <span />
          </div>
          <button
            className="btn secondary full"
            onClick={() => enterDemo("student")}
          >
            Explore student demo <ArrowUpRight size={17} />
          </button>
          <button
            className="text-button demo-officer"
            onClick={() => enterDemo("admin")}
          >
            Explore placement officer demo →
          </button>
          <p className="demo-explain">
            Explore with fictional sample data. No account needed.
          </p>
        </div>
      </section>
    </div>
  );
}
