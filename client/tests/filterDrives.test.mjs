import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_FILTERS, filterDrives } from "../src/utils/filterDrives.mjs";
const now = Date.parse("2026-11-04T12:00:00Z");
const day = 86400000;
const records = [
  {
    _id: "mumbai",
    company: "Northstar Labs",
    role: "React Engineer",
    skills: ["React"],
    location: "Mumbai",
    workMode: "Hybrid",
    employmentType: "Full-time",
    ctcMin: 6,
    ctcMax: 9,
    status: "Published",
    eligibility: { eligible: true },
    createdAt: new Date(now - 2 * day),
    deadline: new Date(now + 3 * day),
  },
  {
    _id: "remote",
    company: "Orbit",
    role: "Frontend Developer",
    skills: ["CSS"],
    location: "Pune",
    workMode: "Remote",
    employmentType: "Internship",
    ctcMin: 3,
    ctcMax: 12,
    status: "Published",
    eligibility: { eligible: true },
    createdAt: new Date(now - 10 * day),
    deadline: new Date(now + 10 * day),
  },
  {
    _id: "expired",
    company: "Cedar",
    role: "Backend Developer",
    skills: ["Node"],
    location: "Mumbai",
    workMode: "On-site",
    employmentType: "Full-time",
    ctcMin: 8,
    ctcMax: 10,
    status: "Published",
    eligibility: { eligible: false },
    createdAt: new Date(now - day),
    deadline: new Date(now - 1),
  },
];
const find = (overrides) =>
  filterDrives(records, { ...DEFAULT_FILTERS, ...overrides }, now).map(
    (d) => d._id,
  );
test("combines city, CTC, mode, employment type and search", () => {
  assert.deepEqual(
    find({
      location: "Mumbai",
      minimumCtc: "6",
      mode: "Hybrid",
      employmentType: "Full-time",
      query: "  REACT  ",
    }),
    ["mumbai"],
  );
});
test("minimum CTC checks guaranteed lower end, not top of a wide range", () => {
  assert.deepEqual(find({ minimumCtc: "6", sort: "salary" }), [
    "expired",
    "mumbai",
  ]);
});
test("posting window and company combine with eligibility", () => {
  assert.deepEqual(
    find({
      postedWithin: "7",
      tab: "Eligible for me",
      company: "Northstar Labs",
    }),
    ["mumbai"],
  );
  assert.deepEqual(find({ postedWithin: "1", company: "Orbit" }), []);
});
test("closing-soon excludes expired drives even within the last 24 hours", () => {
  assert.deepEqual(find({ tab: "Closing soon" }), ["mumbai"]);
});
test("empty result is valid and clearing restores all records without mutating source", () => {
  assert.deepEqual(find({ location: "Delhi" }), []);
  assert.equal(find({}).length, records.length);
  assert.equal(records[0]._id, "mumbai");
});
test("newest sorting and role text search work", () => {
  assert.deepEqual(find({ sort: "newest", query: "developer" }), [
    "expired",
    "remote",
  ]);
});
