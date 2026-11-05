import { useState } from "react";
import { Plus, Megaphone, BookOpen, Bell } from "lucide-react";
import { useApp } from "../context";
import { useResource } from "../hooks";
import {
  Badge,
  Modal,
  Field,
  Empty,
  Loading,
  ErrorBox,
} from "../components/UI";
import { date } from "../constants";
export default function Announcements() {
  const { user, request, notify } = useApp();
  const { data, loading, error, refresh } = useResource(
    "/announcements",
    "announcements",
  );
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  async function post(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await request("/announcements", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setOpen(false);
      notify("Notice published.");
      refresh();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CAMPUS UPDATES</p>
          <h1>Notice board</h1>
          <p className="muted">
            Campus updates, preparation tips, and everything in between.
          </p>
        </div>
        {user.role === "admin" && (
          <button className="btn" onClick={() => setOpen(true)}>
            <Plus size={17} />
            Post a notice
          </button>
        )}
      </div>
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : loading ? (
        <Loading />
      ) : (
        <div className="notice-grid">
          {data.map((n) => (
            <article className="panel notice-card" key={n._id}>
              <div className="notice-card-top">
                <span className="notice-icon">
                  {n.category === "Preparation" ? <BookOpen /> : <Megaphone />}
                </span>
                <Badge status={n.category}>{n.category}</Badge>
              </div>
              <h2>{n.title}</h2>
              <p>{n.body}</p>
              <footer>
                Placement cell <span>·</span> {date(n.createdAt)}
              </footer>
            </article>
          ))}
          {!data.length && (
            <Empty title="All quiet for now">
              Placement cell updates will appear here.
            </Empty>
          )}
        </div>
      )}
      {open && (
        <Modal title="Post a campus notice" onClose={() => setOpen(false)}>
          <form onSubmit={post}>
            <Field label="Title" name="title" required maxLength={120} />
            <Field label="Category">
              <select name="category">
                <option>Update</option>
                <option>Preparation</option>
                <option>Important</option>
              </select>
            </Field>
            <Field label="Message">
              <textarea name="body" rows={6} required maxLength={1500} />
            </Field>
            <button className="btn" disabled={busy}>
              {busy ? "Publishing…" : "Publish notice"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
