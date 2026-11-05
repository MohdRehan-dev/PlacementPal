export const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics & Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
];
export const STAGES = [
  "Applied",
  "Shortlisted",
  "Assessment",
  "Interview",
  "Offered",
  "Rejected",
  "Withdrawn",
];
export const date = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const shortDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
export const money = (drive) => `${drive.ctcMin}–${drive.ctcMax} LPA`;
export const daysLeft = (value) =>
  Math.ceil((new Date(value) - new Date()) / 86400000);
export function eligible(user, drive) {
  const reasons = [];
  if (drive.status !== "Published")
    reasons.push("This drive is not accepting applications.");
  if (new Date(drive.deadline) < new Date())
    reasons.push("The application deadline has passed.");
  if (!user.branch || !user.graduationYear)
    reasons.push("Complete your academic profile.");
  if (Number(user.cgpa ?? -1) < drive.minCgpa)
    reasons.push(`Minimum CGPA is ${drive.minCgpa}.`);
  if (!drive.branches.includes(user.branch))
    reasons.push("Your branch is not eligible.");
  if (!drive.graduationYears.includes(user.graduationYear))
    reasons.push("Your graduation year is not eligible.");
  if (Number(user.backlogs || 0) > drive.maxBacklogs)
    reasons.push(`Maximum active backlogs: ${drive.maxBacklogs}.`);
  return { eligible: !reasons.length, reasons };
}
