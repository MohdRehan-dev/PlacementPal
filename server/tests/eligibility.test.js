const { test } = require("node:test");
const assert = require("node:assert/strict");
const eligible = require("../utils/eligibility");
const now = new Date("2026-01-01");
const student = {
  cgpa: 7.46,
  branch: "Electronics & Computer Science",
  graduationYear: 2026,
  backlogs: 0,
};
const drive = {
  status: "Published",
  deadline: new Date("2026-01-02"),
  minCgpa: 7,
  branches: [student.branch],
  graduationYears: [2026],
  maxBacklogs: 0,
};
test("eligible student meets every published drive rule", () =>
  assert.equal(eligible(student, drive, now).eligible, true));
test("reports failed CGPA, branch, year and backlog requirements", () => {
  const result = eligible(
    { cgpa: 6, branch: "Civil", graduationYear: 2025, backlogs: 2 },
    drive,
    now,
  );
  assert.equal(result.eligible, false);
  assert.equal(result.reasons.length, 4);
});
test("closed, draft and expired drives reject applications", () => {
  for (const status of ["Draft", "Closed"])
    assert.equal(eligible(student, { ...drive, status }, now).eligible, false);
  assert.equal(
    eligible(student, { ...drive, deadline: "2025-01-01" }, now).eligible,
    false,
  );
});
test("missing academic profile cannot pass a zero CGPA drive", () =>
  assert.equal(eligible({}, { ...drive, minCgpa: 0 }, now).eligible, false));
