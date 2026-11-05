const defaultCollegeId = "rizvi";
const collegeIdField = {
  type: String,
  default: defaultCollegeId,
  required: true,
  index: true,
};

// Records created before college IDs belonged to Rizvi.
function collegeScope(user) {
  const collegeId = user.collegeId;
  if (collegeId === defaultCollegeId)
    return { $or: [{ collegeId }, { collegeId: { $exists: false } }] };
  return { collegeId };
}

module.exports = { collegeIdField, collegeScope };
