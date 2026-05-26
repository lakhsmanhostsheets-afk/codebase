import * as XLSX from "xlsx";

export type WorkbookSheetData = {
  openListRows: Record<string, unknown>[];
  lineupRows: Record<string, unknown>[];
};

const OPEN_LIST_KEYS = [
  "Vertical",
  "Date of Open",
  "Project",
  "Region",
  "State",
  "City",
  "Account Name",
  "Store Address",
  "Store Name",
  "Supervisor",
  "POA",
  "Designation",
  "Position count",
  "Open Position Count",
  "Selection date",
];

const LINEUP_KEYS = [
  "Date",
  "Recruiter",
  "Name",
  "Contact No.",
  "Qualification",
  "Designation",
  "Experience",
  "Current Salary",
  "Expected Salary",
  "Account Name",
  "Store Address",
  "Store Name",
  "City",
  "State",
  "Client Remarks",
  "Final Remarks",
  "Feedback Date",
  "TAT For Feedback",
  "Remarks",
  "Current /Previous Organisation",
];

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return true;
  if (value instanceof Date) return true;
  return false;
}

function pickKeys(row: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in row && hasValue(row[key])) {
      out[key] = row[key];
    }
  }
  return out;
}

function compactRows(
  rows: Record<string, unknown>[],
  keys: string[],
  requiredKey: string,
) {
  return rows
    .map((row) => pickKeys(row, keys))
    .filter((row) => hasValue(row[requiredKey]));
}

export function extractWorkbookSheets(
  data: ArrayBuffer | Buffer,
): WorkbookSheetData {
  const workbook = XLSX.read(data, {
    type: data instanceof Buffer ? "buffer" : "array",
    cellDates: true,
  });

  const openListSheet =
    workbook.Sheets["AO Smith Open list"] ?? workbook.Sheets["Open List"];
  const lineupSheet = workbook.Sheets["Line Up Final"];

  if (!openListSheet) {
    throw new Error("Could not find 'AO Smith Open list' or 'Open List' sheet.");
  }
  if (!lineupSheet) {
    throw new Error("Could not find 'Line Up Final' sheet.");
  }

  const openRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(openListSheet, {
    defval: "",
    raw: false,
  });
  const lineupRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(lineupSheet, {
    defval: "",
    raw: false,
  });

  return {
    openListRows: compactRows(openRaw, OPEN_LIST_KEYS, "Store Name"),
    lineupRows: compactRows(lineupRaw, LINEUP_KEYS, "Name"),
  };
}

/** JSON-safe rows (Dates → ISO strings) for client → API upload. */
export function serializeRowsForApi(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) {
        out[key] = value.toISOString();
      } else if (hasValue(value)) {
        out[key] = value;
      }
    }
    return out;
  });
}
