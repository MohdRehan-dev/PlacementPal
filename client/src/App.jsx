import { Component } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AppProvider, useApp } from "./context";
import Layout from "./components/Layout";
import { Loading } from "./components/UI";
import Auth from "./pages/Auth";
import Overview from "./pages/Overview";
import Drives from "./pages/Drives";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";
import Announcements from "./pages/Announcements";
import Students from "./pages/Students";
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fatal">
        <h1>Let’s get you back on track.</h1>
        <p>This page encountered an unexpected error.</p>
        <button className="btn" onClick={() => location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Router() {
  const { user, ready } = useApp();
  if (!ready) return <Loading />;
  if (!user) return <Auth />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="drives" element={<Drives />} />
        <Route path="applications" element={<Applications />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<Profile key={user._id} />} />
        <Route
          path="students"
          element={
            user.role === "admin" ? <Students /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="*"
          element={
            <div className="empty">
              <h1>Page not found.</h1>
              <Link className="btn" to="/">
                Back to overview
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router />
      </AppProvider>
    </ErrorBoundary>
  );
}
