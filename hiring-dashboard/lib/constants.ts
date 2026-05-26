export const FINAL_REMARK_OPTIONS = [
  { value: "INTERVIEW_PENDING", label: "Interview Pending" },
  { value: "REJECTED", label: "Rejected" },
  { value: "FINAL_SELECTION", label: "Final Selection" },
  { value: "CLIENT_SELECTED", label: "Client Selected" },
  { value: "BACK_OUT", label: "Back Out" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "OTHER", label: "Other" },
] as const;

export const KPI_METRICS = [
  { key: "totalCount", label: "Total Positions", color: "from-blue-500 to-blue-600", text: "text-blue-700" },
  { key: "openPositionCount", label: "Open Positions", color: "from-amber-500 to-orange-500", text: "text-amber-700" },
  { key: "lineUpCount", label: "Profiles Shared", color: "from-violet-500 to-purple-600", text: "text-violet-700" },
  { key: "feedbackAwaited", label: "Feedback Awaited", color: "from-cyan-500 to-teal-500", text: "text-cyan-700" },
  { key: "rejected", label: "Rejected", color: "from-rose-500 to-red-500", text: "text-rose-700" },
  { key: "selected", label: "Selected", color: "from-emerald-500 to-green-600", text: "text-emerald-700" },
  { key: "shortlisted", label: "Shortlisted", color: "from-indigo-500 to-blue-600", text: "text-indigo-700" },
  { key: "backedOut", label: "Backed Out", color: "from-slate-500 to-slate-600", text: "text-slate-700" },
  { key: "onHold", label: "On Hold", color: "from-yellow-500 to-amber-500", text: "text-yellow-800" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", description: "Summary & charts" },
  { href: "/open-positions", label: "Open Positions", description: "Add store openings" },
  { href: "/lineups", label: "Candidate Lineups", description: "Add candidates to stores" },
  { href: "/import", label: "Import Excel", description: "Bulk upload workbook" },
] as const;
