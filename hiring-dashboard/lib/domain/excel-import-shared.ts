import { FinalRemark } from "@prisma/client";

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toFinalRemarkTag(value?: string): FinalRemark {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "interview pending") return FinalRemark.INTERVIEW_PENDING;
  if (normalized === "rejected") return FinalRemark.REJECTED;
  if (normalized === "final selection") return FinalRemark.FINAL_SELECTION;
  if (normalized === "client selected") return FinalRemark.CLIENT_SELECTED;
  if (normalized === "back out") return FinalRemark.BACK_OUT;
  if (normalized === "on hold") return FinalRemark.ON_HOLD;
  return FinalRemark.OTHER;
}

export function parseOpenListRow(record: Record<string, unknown>) {
  return {
    vertical: normalize(record.Vertical),
    dateOfOpen: parseDate(record["Date of Open"]),
    project: normalize(record.Project),
    region: normalize(record.Region),
    state: normalize(record.State),
    city: normalize(record.City),
    accountName: normalize(record["Account Name"]),
    storeAddress: normalize(record["Store Address"]),
    storeName: normalize(record["Store Name"]),
    supervisor: normalize(record.Supervisor),
    poa: normalize(record.POA),
    designation: normalize(record.Designation),
    positionCount: parseNumber(record["Position count"]),
    openPositionCount: parseNumber(record["Open Position Count"]),
    selectionDate: parseDate(record["Selection date"]),
  };
}

export function parseLineupRow(record: Record<string, unknown>) {
  return {
    date: parseDate(record.Date),
    recruiter: normalize(record.Recruiter),
    name: normalize(record.Name),
    contactNo: normalize(record["Contact No."]),
    qualification: normalize(record.Qualification),
    currentOrganization: normalize(record["Current /Previous Organisation"]),
    designation: normalize(record.Designation),
    experience: normalize(record.Experience),
    currentSalary: parseNumber(record["Current Salary"]),
    expectedSalary: parseNumber(record["Expected Salary"]),
    accountName: normalize(record["Account Name"]),
    storeAddress: normalize(record["Store Address"]),
    storeName: normalize(record["Store Name"]),
    city: normalize(record.City),
    state: normalize(record.State),
    clientRemarks: normalize(record["Client Remarks"]),
    finalRemarks: normalize(record["Final Remarks"]),
    feedbackDate: parseDate(record["Feedback Date"]),
    tatForFeedback: parseNumber(record["TAT For Feedback"]),
    remarks: normalize(record.Remarks),
  };
}

export function storeCompositeKey(row: {
  storeName?: string;
  city?: string;
  state?: string;
}) {
  return `${(row.storeName || "").toLowerCase()}|${(row.city || "").toLowerCase()}|${(row.state || "").toLowerCase()}`;
}
