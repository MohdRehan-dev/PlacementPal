export const DEFAULT_FILTERS = {
  query: "",
  tab: "All drives",
  location: "",
  mode: "",
  employmentType: "",
  minimumCtc: "",
  company: "",
  postedWithin: "",
  sort: "deadline",
};

// Filters are combined with AND. CTC is annual LPA, using the advertised minimum.
export function filterDrives(drives, filters, now = Date.now()) {
  const query = filters.query.trim().toLowerCase();
  return drives
    .filter((drive) => {
      const searchable = [
        drive.company,
        drive.role,
        drive.location,
        ...(drive.skills || []),
      ]
        .join(" ")
        .toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (
        filters.location &&
        drive.location.trim().toLowerCase() !== filters.location.toLowerCase()
      )
        return false;
      if (filters.mode && drive.workMode !== filters.mode) return false;
      if (
        filters.employmentType &&
        drive.employmentType !== filters.employmentType
      )
        return false;
      if (filters.company && drive.company !== filters.company) return false;
      if (
        filters.minimumCtc !== "" &&
        drive.ctcMin < Number(filters.minimumCtc)
      )
        return false;
      if (filters.postedWithin) {
        const posted = new Date(drive.createdAt).getTime();
        if (
          !Number.isFinite(posted) ||
          posted < now - Number(filters.postedWithin) * 86400000
        )
          return false;
      }
      if (filters.tab === "Eligible for me" && !drive.eligibility?.eligible)
        return false;
      if (filters.tab === "Applied" && !drive.myApplication) return false;
      if (filters.tab === "Closing soon") {
        const remaining = new Date(drive.deadline).getTime() - now;
        if (
          drive.status !== "Published" ||
          remaining < 0 ||
          remaining > 7 * 86400000
        )
          return false;
      } else if (
        ["Published", "Draft", "Closed"].includes(filters.tab) &&
        drive.status !== filters.tab
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "salary") return b.ctcMax - a.ctcMax;
      if (filters.sort === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      return new Date(a.deadline) - new Date(b.deadline);
    });
}
