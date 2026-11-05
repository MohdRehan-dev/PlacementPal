import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { useResource } from "../hooks";
import { Empty, Loading, ErrorBox, Badge } from "../components/UI";
export default function Students() {
  const { data, loading, error, refresh } = useResource(
    "/students",
    "students",
  );
  const [query, setQuery] = useState("");
  const filtered = data.filter((u) =>
    `${u.name} ${u.email} ${u.branch}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT DIRECTORY</p>
          <h1>Students</h1>
          <p className="muted">
            A clear view of students preparing for their next chapter.
          </p>
        </div>
        <span className="count-pill">{data.length} students</span>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or branch…"
            aria-label="Search students"
          />
        </div>
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
                <th>Student</th>
                <th>Branch</th>
                <th>Batch</th>
                <th>CGPA</th>
                <th>Resume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </td>
                  <td>{u.branch || "Not added"}</td>
                  <td>{u.graduationYear || "—"}</td>
                  <td>
                    <Badge status="neutral">{u.cgpa ?? "—"}</Badge>
                  </td>
                  <td>
                    {u.resumeUrl ? (
                      <a
                        className="text-button"
                        href={u.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View <ArrowUpRight size={15} />
                      </a>
                    ) : (
                      "Not added"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <Empty title="No students found" />}
        </div>
      )}
    </>
  );
}
