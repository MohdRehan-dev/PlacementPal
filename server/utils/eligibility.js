// A single policy is used by both drive responses and the apply endpoint.
function eligibility(student, drive, now = new Date()) {
  const reasons = [];
  if (drive.status !== "Published")
    reasons.push("This drive is not accepting applications.");
  if (new Date(drive.deadline) < now)
    reasons.push("The application deadline has passed.");
  if (!student.branch || !student.graduationYear)
    reasons.push("Complete your academic profile.");
  if (Number(student.cgpa ?? -1) < drive.minCgpa)
    reasons.push(`Minimum CGPA is ${drive.minCgpa}.`);
  if (!drive.branches.includes(student.branch))
    reasons.push("Your branch is not eligible.");
  if (!drive.graduationYears.includes(student.graduationYear))
    reasons.push("Your graduation year is not eligible.");
  if (Number(student.backlogs || 0) > drive.maxBacklogs)
    reasons.push(`Maximum active backlogs: ${drive.maxBacklogs}.`);
  return { eligible: reasons.length === 0, reasons };
}
module.exports = eligibility;
