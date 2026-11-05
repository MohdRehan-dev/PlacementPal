import { useState } from "react";
import { UserRound, CheckCircle2, Save, ArrowUpRight } from "lucide-react";
import { useApp } from "../context";
import { Field } from "../components/UI";
import { BRANCHES } from "../constants";
export default function Profile() {
  const { user } = useApp();
  return user.role === "admin" ? (
    <OfficerProfile key={user._id} />
  ) : (
    <StudentProfile key={user._id} />
  );
}
function OfficerProfile() {
  const { user, setUser, request, notify } = useApp();
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await request("/profile", {
        method: "PATCH",
        body: { name: form.get("name"), phone: form.get("phone") },
      });
      setUser(result.user);
      notify("Officer profile updated.");
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
          <p className="eyebrow">ACCOUNT DETAILS</p>
          <h1>Officer profile</h1>
          <p className="muted">Manage your placement office contact details.</p>
        </div>
      </div>
      <form className="panel profile-form officer-profile" onSubmit={save}>
        <h2>Contact information</h2>
        <div className="form-grid">
          <Field
            label="Full name"
            name="name"
            defaultValue={user.name}
            required
            maxLength={80}
          />
          <Field
            label="Phone (optional)"
            name="phone"
            defaultValue={user.phone || ""}
            maxLength={20}
          />
          <Field label="Email">
            <input value={user.email} readOnly aria-readonly="true" />
          </Field>
          <Field label="Account role">
            <input
              value="Placement officer / TPO"
              readOnly
              aria-readonly="true"
            />
          </Field>
        </div>
        <button className="btn" disabled={busy}>
          <Save size={16} />
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </>
  );
}
function StudentProfile() {
  const { user, setUser, request, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [preferredRoles, setPreferredRoles] = useState(
    user.preferredRoles || [],
  );
  const [roleInput, setRoleInput] = useState("");
  const [experience, setExperience] = useState(user.experience || []);
  const [projects, setProjects] = useState(user.projects || []);
  const [draft, setDraft] = useState(user);
  function addRole() {
    const role = roleInput.trim();
    if (!role || preferredRoles.length >= 4) return;
    if (
      preferredRoles.some((value) => value.toLowerCase() === role.toLowerCase())
    ) {
      notify("That role is already on your list.", true);
      return;
    }
    setPreferredRoles([...preferredRoles, role]);
    setRoleInput("");
  }
  function moveRole(index, direction) {
    const next = [...preferredRoles];
    const target = index + direction;
    [next[index], next[target]] = [next[target], next[index]];
    setPreferredRoles(next);
  }
  const missing = [
    [draft.name?.trim(), "Add your full name"],
    [BRANCHES.includes(draft.branch), "Select your branch"],
    [draft.graduationYear, "Add your graduation year"],
    [draft.cgpa != null && draft.cgpa !== "", "Enter your CGPA"],
    [
      draft.backlogs != null && draft.backlogs !== "",
      "Enter active backlogs (0 if none)",
    ],
    [draft.resumeUrl?.trim(), "Add your resume link"],
    [
      String(draft.skills || "")
        .split(",")
        .some((skill) => skill.trim()),
      "Add at least one skill",
    ],
    [preferredRoles.length, "Add at least one preferred role"],
  ].filter(([value]) => !value);
  const readiness = Math.round(((8 - missing.length) / 8) * 100);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const body = {
      ...form,
      preferredRoles,
      experience,
      projects,
      cgpa: Number(form.cgpa),
      backlogs: Number(form.backlogs),
      graduationYear: Number(form.graduationYear),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      setUser((await request("/profile", { method: "PATCH", body })).user);
      notify("Profile updated. Your eligibility will use these details.");
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
          <p className="eyebrow">YOUR DETAILS</p>
          <h1>My profile</h1>
          <p className="muted">
            Your profile helps you discover the right opportunities.
          </p>
        </div>
      </div>
      <div className="profile-layout">
        <aside className="panel profile-card">
          <span className="avatar huge">
            {user.name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </span>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="badge eligible">
            Class of {user.graduationYear || "—"}
          </span>
          <hr />
          <div className="completion-label">
            <strong>Profile readiness</strong>
            <span>{readiness}%</span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${readiness}%` }} />
          </div>
          {missing.length ? (
            <div className="readiness-checklist">
              <strong>To complete your profile</strong>
              <ul>
                {missing.map(([, label]) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">All essential details are complete.</p>
          )}
          {user.resumeUrl && (
            <a
              className="text-button"
              href={user.resumeUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open resume <ArrowUpRight size={15} />
            </a>
          )}
        </aside>
        <form
          className="panel profile-form"
          onSubmit={save}
          onChange={(event) => {
            const { name, value } = event.target;
            if (name) setDraft((current) => ({ ...current, [name]: value }));
          }}
        >
          <h2>The essentials</h2>
          <p className="muted">
            Keep your details accurate. Eligibility is checked when you apply.
          </p>
          <div className="form-grid">
            <Field
              label="Full name"
              name="name"
              defaultValue={user.name}
              maxLength={80}
              required
            />
            <Field
              label="Phone (optional)"
              name="phone"
              defaultValue={user.phone}
              maxLength={20}
            />
            <Field label="Branch">
              <select name="branch" defaultValue={user.branch} required>
                <option value="" disabled>
                  Select your branch
                </option>
                {BRANCHES.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Graduation year"
              name="graduationYear"
              type="number"
              min={2024}
              max={2040}
              defaultValue={user.graduationYear ?? ""}
              required
            />
            <Field
              label="CGPA (out of 10)"
              name="cgpa"
              type="number"
              min={0}
              max={10}
              step=".01"
              defaultValue={user.cgpa ?? ""}
              required
            />
            <Field
              label="Active backlogs"
              name="backlogs"
              type="number"
              min={0}
              max={50}
              defaultValue={user.backlogs ?? ""}
              required
            />
            <fieldset className="full-row preferred-roles">
              <legend>
                Preferred roles <span>{preferredRoles.length}/4</span>
              </legend>
              <div className="button-row">
                <input
                  aria-label="Custom preferred role"
                  placeholder="e.g. Frontend Developer"
                  maxLength={80}
                  value={roleInput}
                  onChange={(event) => setRoleInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addRole();
                    }
                  }}
                  disabled={preferredRoles.length >= 4}
                />
                <button
                  type="button"
                  className="btn secondary"
                  onClick={addRole}
                  disabled={!roleInput.trim() || preferredRoles.length >= 4}
                >
                  Add role
                </button>
              </div>
              <ol className="profile-entry-list">
                {preferredRoles.map((role, index) => (
                  <li key={role}>
                    <strong>
                      {index + 1}. {role}
                    </strong>
                    <div className="button-row">
                      <button
                        type="button"
                        aria-label={`Move ${role} up`}
                        disabled={index === 0}
                        onClick={() => moveRole(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${role} down`}
                        disabled={index === preferredRoles.length - 1}
                        onClick={() => moveRole(index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setPreferredRoles(
                            preferredRoles.filter((value) => value !== role),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </fieldset>
            <Field
              label="Skills (comma separated)"
              name="skills"
              className="full-row"
              defaultValue={(user.skills || []).join(", ")}
              maxLength={1000}
              placeholder="JavaScript, React, Node.js"
            />
            <Field
              label="Resume link"
              name="resumeUrl"
              type="url"
              pattern="https://.*"
              defaultValue={user.resumeUrl}
              className="full-row"
              placeholder="https://drive.google.com/…"
              hint="Use a publicly viewable HTTPS link to your PDF. Check that recruiters can open it."
            />
            <Field
              label="GitHub / portfolio (optional)"
              name="githubUrl"
              type="url"
              pattern="https://.*"
              className="full-row"
              defaultValue={user.githubUrl}
              placeholder="https://github.com/your-username"
            />
          </div>
          <ProfileEntries
            title="Experience"
            addLabel="Add experience"
            entries={experience}
            setEntries={setExperience}
            fields={[
              { key: "role", label: "Role", required: true, maxLength: 100 },
              {
                key: "company",
                label: "Company",
                required: true,
                maxLength: 100,
              },
              {
                key: "startDate",
                label: "Start month",
                type: "month",
                required: true,
              },
              {
                key: "endDate",
                label: "End month (leave blank if current)",
                type: "month",
              },
              { key: "description", label: "Description", maxLength: 1000 },
            ]}
          />
          <ProfileEntries
            title="Projects"
            addLabel="Add project"
            entries={projects}
            setEntries={setProjects}
            fields={[
              {
                key: "name",
                label: "Project name",
                required: true,
                maxLength: 100,
              },
              {
                key: "description",
                label: "Short description",
                maxLength: 1000,
              },
              {
                key: "liveUrl",
                label: "Live link",
                type: "url",
                pattern: "https://.*",
                required: true,
              },
              {
                key: "githubUrl",
                label: "GitHub link (optional)",
                type: "url",
                pattern: "https://.*",
              },
            ]}
          />
          <div className="notice">
            Applications keep a snapshot of the profile and resume link you
            submitted. Later profile edits don’t change previous submissions.
          </div>
          <button className="btn" disabled={busy}>
            <Save size={16} />
            {busy ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </>
  );
}

function ProfileEntries({ title, addLabel, entries, setEntries, fields }) {
  return (
    <section className="profile-entry-section">
      <h2>
        {title} <small>(optional)</small>
      </h2>
      {entries.map((entry, index) => (
        <fieldset className="preferred-roles" key={index}>
          <legend>
            {title} {index + 1}
          </legend>
          <div className="form-grid">
            {fields.map(({ key, label, ...props }) => (
              <Field
                key={key}
                label={label}
                value={entry[key] || ""}
                {...props}
                onChange={(event) => {
                  const value = event.target.value;
                  setEntries((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, [key]: value } : item,
                    ),
                  );
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              setEntries((current) => current.filter((_, i) => i !== index))
            }
          >
            Remove entry
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="btn secondary"
        disabled={entries.length >= 10}
        onClick={() =>
          setEntries((current) => [
            ...current,
            Object.fromEntries(fields.map((field) => [field.key, ""])),
          ])
        }
      >
        {addLabel}
      </button>
    </section>
  );
}
