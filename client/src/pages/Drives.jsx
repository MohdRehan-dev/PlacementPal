import { useSearchParams } from "react-router-dom";
import { DEFAULT_FILTERS, filterDrives } from "../utils/filterDrives.mjs";
import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { useApp } from "../context";
import { useResource } from "../hooks";
import {
  DriveCard,
  DriveDetail,
  Empty,
  Loading,
  ErrorBox,
  Modal,
  Field,
} from "../components/UI";
import { BRANCHES } from "../constants";
const tomorrow = (days) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const blank = () => ({
  company: "",
  role: "",
  location: "",
  workMode: "Hybrid",
  employmentType: "Full-time",
  ctcMin: 4,
  ctcMax: 6,
  description: "",
  skills: ["JavaScript", "React"],
  minCgpa: 6,
  maxBacklogs: 0,
  branches: BRANCHES.slice(0, 4),
  graduationYears: [2026],
  deadline: tomorrow(7),
  driveDate: tomorrow(10),
  rounds: ["Online assessment", "Technical interview", "HR interview"],
  status: "Published",
});
function DriveForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          deadline: initial.deadline.slice(0, 10),
          driveDate: initial.driveDate.slice(0, 10),
        }
      : blank(),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (form.ctcMax < form.ctcMin)
        throw new Error("Maximum CTC must be at least minimum CTC.");
      if (!form.branches.length)
        throw new Error("Select at least one eligible branch.");
      if (form.driveDate < form.deadline)
        throw new Error("Drive date must be on or after the deadline.");
      await onSave({
        ...form,
        deadline: new Date(form.deadline + "T23:59:00").toISOString(),
        driveDate: new Date(form.driveDate + "T10:00:00").toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const input = (key, type = "text", props = {}) => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) =>
        change(key, type === "number" ? Number(e.target.value) : e.target.value)
      }
      required
      {...props}
    />
  );
  return (
    <Modal
      title={initial ? "Edit placement drive" : "Create placement drive"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="form-grid">
        <Field label="Company">
          {input("company", "text", { maxLength: 100 })}
        </Field>
        <Field label="Role">{input("role", "text", { maxLength: 100 })}</Field>
        <Field label="Location">{input("location")}</Field>
        <Field label="Work mode">
          <select
            value={form.workMode}
            onChange={(e) => change("workMode", e.target.value)}
          >
            {["On-site", "Hybrid", "Remote"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Employment type">
          <select
            value={form.employmentType}
            onChange={(e) => change("employmentType", e.target.value)}
          >
            <option>Full-time</option>
            <option>Internship</option>
          </select>
        </Field>
        <Field label="Visibility">
          <select
            value={form.status}
            onChange={(e) => change("status", e.target.value)}
          >
            {["Draft", "Published", "Closed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Minimum CTC (LPA)">
          {input("ctcMin", "number", { min: 0, max: 200, step: ".1" })}
        </Field>
        <Field label="Maximum CTC (LPA)">
          {input("ctcMax", "number", { min: 0, max: 200, step: ".1" })}
        </Field>
        <Field label="Application deadline">{input("deadline", "date")}</Field>
        <Field label="Drive date">{input("driveDate", "date")}</Field>
        <Field label="Minimum CGPA">
          {input("minCgpa", "number", { min: 0, max: 10, step: ".01" })}
        </Field>
        <Field label="Maximum active backlogs">
          {input("maxBacklogs", "number", { min: 0, max: 50 })}
        </Field>
        <Field label="Graduation years (comma separated)">
          <input
            defaultValue={form.graduationYears.join(", ")}
            required
            onChange={(e) =>
              change(
                "graduationYears",
                e.target.value
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter(Boolean),
              )
            }
          />
        </Field>
        <Field label="Skills (comma separated)">
          <input
            defaultValue={form.skills.join(", ")}
            required
            onChange={(e) =>
              change(
                "skills",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        <fieldset className="full-row branch-select">
          <legend>Eligible branches</legend>
          {BRANCHES.map((b) => (
            <label key={b}>
              <input
                type="checkbox"
                checked={form.branches.includes(b)}
                onChange={(e) =>
                  change(
                    "branches",
                    e.target.checked
                      ? [...form.branches, b]
                      : form.branches.filter((v) => v !== b),
                  )
                }
              />
              {b}
            </label>
          ))}
        </fieldset>
        <Field label="About this opportunity" className="full-row">
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => change("description", e.target.value)}
            maxLength={6000}
            required
          />
        </Field>
        <Field label="Selection rounds (one per line)" className="full-row">
          <textarea
            rows={3}
            defaultValue={form.rounds.join("\n")}
            required
            onChange={(e) =>
              change(
                "rounds",
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        {error && (
          <div className="error-box full-row" role="alert">
            {error}
          </div>
        )}
        <div className="modal-actions full-row">
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={busy}>
            {busy ? "Saving…" : "Save drive"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Drives() {
  const { user, request, notify } = useApp(),
    admin = user.role === "admin";
  const { data, loading, error, refresh } = useResource("/drives", "drives");
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    tab:
      !admin && params.get("show") === "eligible"
        ? "Eligible for me"
        : "All drives",
  });
  const updateFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });
  const [selected, setSelected] = useState(null),
    [edit, setEdit] = useState(undefined),
    [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState({ ...DEFAULT_FILTERS });
  const extraFilterCount = [
    filters.employmentType,
    filters.company,
    filters.postedWithin,
  ].filter(Boolean).length;
  function openMoreFilters() {
    setDraftFilters({ ...filters });
    setMoreOpen(true);
  }
  const locations = useMemo(
    () =>
      [...new Set(data.map((d) => d.location.trim()).filter(Boolean))].sort(),
    [data],
  );
  const companies = useMemo(
    () => [...new Set(data.map((d) => d.company))].sort(),
    [data],
  );
  const filtered = useMemo(() => filterDrives(data, filters), [data, filters]);
  const activeFilters = [
    filters.query.trim() && ["query", `Search: ${filters.query.trim()}`],
    filters.tab !== "All drives" && ["tab", filters.tab],
    filters.location && ["location", filters.location],
    filters.mode && ["mode", filters.mode],
    filters.employmentType && ["employmentType", filters.employmentType],
    filters.minimumCtc && [
      "minimumCtc",
      `Minimum CTC: ₹${filters.minimumCtc} LPA+`,
    ],
    filters.company && ["company", filters.company],
    filters.postedWithin && [
      "postedWithin",
      `Posted: last ${filters.postedWithin} days`,
    ],
  ].filter(Boolean);
  async function apply(d) {
    setBusy(true);
    try {
      await request(`/drives/${d._id}/apply`, { method: "POST", body: {} });
      notify("Application submitted. Follow your progress in My applications.");
      setSelected(null);
      refresh();
    } catch (e) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  }
  async function save(form) {
    const fields = [
      "company",
      "role",
      "location",
      "workMode",
      "employmentType",
      "ctcMin",
      "ctcMax",
      "description",
      "skills",
      "minCgpa",
      "maxBacklogs",
      "branches",
      "graduationYears",
      "deadline",
      "driveDate",
      "rounds",
      "status",
    ];
    const body = Object.fromEntries(fields.map((k) => [k, form[k]]));
    await request(edit ? `/drives/${edit._id}` : "/drives", {
      method: edit ? "PATCH" : "POST",
      body,
    });
    setEdit(undefined);
    notify("Placement drive saved.");
    refresh();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OPPORTUNITIES</p>
          <h1>{admin ? "Manage placement drives" : "Placement drives"}</h1>
          <p className="muted">
            {admin
              ? "Create opportunities and keep every drive on track."
              : "Explore campus opportunities that match your profile."}
          </p>
        </div>
        {admin && (
          <button className="btn" onClick={() => setEdit(null)}>
            <Plus size={17} />
            Create drive
          </button>
        )}
      </div>
      <section className="search-filter-bar" aria-label="Find placement drives">
        <section
          className="compact-search"
          aria-label="Search placement drives"
        >
          <div className="search-box">
            <Search size={18} />
            <input
              aria-label="Search drives"
              value={filters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
              placeholder="Search role, company or skill"
            />
          </div>
          <label className="location-search">
            <span className="sr-only">Location</span>
            <select
              value={filters.location}
              onChange={(e) => updateFilter("location", e.target.value)}
            >
              <option value="">All locations</option>
              {locations.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </section>
        <div className="quick-filters" aria-label="Quick filters">
          <select
            aria-label="Show drives"
            value={filters.tab}
            onChange={(event) => updateFilter("tab", event.target.value)}
          >
            {(admin
              ? ["All drives", "Published", "Draft", "Closed"]
              : ["All drives", "Eligible for me", "Applied", "Closing soon"]
            ).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            aria-label="Minimum annual CTC"
            value={filters.minimumCtc}
            onChange={(e) => updateFilter("minimumCtc", e.target.value)}
          >
            <option value="">Minimum CTC</option>
            {[3, 4, 5, 6, 8, 10, 12].map((v) => (
              <option value={v} key={v}>
                ₹{v} LPA and above
              </option>
            ))}
          </select>
          <select
            aria-label="Work mode"
            value={filters.mode}
            onChange={(e) => updateFilter("mode", e.target.value)}
          >
            <option value="">Work mode</option>
            {["On-site", "Hybrid", "Remote"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button
            className={`filter-trigger ${extraFilterCount ? "is-active" : ""}`}
            onClick={openMoreFilters}
          >
            <SlidersHorizontal size={15} />
            More filters
            {extraFilterCount > 0 && <span>{extraFilterCount}</span>}
          </button>
          {!!activeFilters.length && (
            <button
              className="text-button clear-filters"
              onClick={resetFilters}
            >
              Clear all
            </button>
          )}
        </div>
        {!!activeFilters.length && (
          <div className="active-filter-chips" aria-label="Active filters">
            {activeFilters.map(([key, label]) => (
              <button
                key={key}
                aria-label={`Remove ${label} filter`}
                onClick={() => updateFilter(key, DEFAULT_FILTERS[key])}
              >
                {label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <div className="results-toolbar">
        <span className="results-label" role="status">
          {loading
            ? "Loading opportunities…"
            : `${filtered.length} ${filtered.length === 1 ? "opportunity" : "opportunities"}`}
        </span>
        <label className="sort-inline">
          <span>Sort:</span>
          <select
            aria-label="Sort drives"
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
          >
            <option value="deadline">Deadline: soonest</option>
            <option value="salary">Highest CTC</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
      </div>
      {moreOpen && (
        <Modal title="More filters" onClose={() => setMoreOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFilters((current) => ({
                ...current,
                employmentType: draftFilters.employmentType,
                company: draftFilters.company,
                postedWithin: draftFilters.postedWithin,
              }));
              setMoreOpen(false);
            }}
          >
            <Field label="Employment type">
              <select
                value={draftFilters.employmentType}
                onChange={(e) =>
                  setDraftFilters((f) => ({
                    ...f,
                    employmentType: e.target.value,
                  }))
                }
              >
                <option value="">All types</option>
                <option>Full-time</option>
                <option>Internship</option>
              </select>
            </Field>
            <Field label="Company">
              <select
                value={draftFilters.company}
                onChange={(e) =>
                  setDraftFilters((f) => ({ ...f, company: e.target.value }))
                }
              >
                <option value="">All companies</option>
                {companies.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Date posted">
              <select
                value={draftFilters.postedWithin}
                onChange={(e) =>
                  setDraftFilters((f) => ({
                    ...f,
                    postedWithin: e.target.value,
                  }))
                }
              >
                <option value="">Any time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </Field>
            <div className="modal-actions">
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setDraftFilters((f) => ({
                    ...f,
                    employmentType: "",
                    company: "",
                    postedWithin: "",
                  }))
                }
              >
                Reset these filters
              </button>
              <button className="btn">Show opportunities</button>
            </div>
          </form>
        </Modal>
      )}
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : loading ? (
        <Loading />
      ) : filtered.length ? (
        <div className="drive-grid">
          {filtered.map((d) => (
            <DriveCard
              key={d._id}
              drive={d}
              admin={admin}
              onOpen={setSelected}
            />
          ))}
        </div>
      ) : (
        <Empty title="No matching drives">
          Try another location or reduce your filters.
          <button className="btn secondary reset-empty" onClick={resetFilters}>
            Clear all filters
          </button>
        </Empty>
      )}
      {selected && (
        <DriveDetail
          drive={selected}
          onClose={() => setSelected(null)}
          onApply={apply}
          busy={busy}
          admin={admin}
          onEdit={(d) => {
            setSelected(null);
            setEdit(d);
          }}
        />
      )}
      {edit !== undefined && (
        <DriveForm
          initial={edit}
          onClose={() => setEdit(undefined)}
          onSave={save}
        />
      )}
    </>
  );
}
