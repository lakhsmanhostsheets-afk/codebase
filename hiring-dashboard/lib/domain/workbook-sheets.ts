import * as XLSX from "xlsx";

export type WorkbookSheetData = {
  openListRows: Record<string, unknown>[];
  lineupRows: Record<string, unknown>[];
};

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

  const openListRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(openListSheet, {
    defval: "",
  });
  const lineupRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(lineupSheet, {
    defval: "",
  });

  return { openListRows, lineupRows };
}

/** JSON-safe rows (Dates → ISO strings) for client → API upload. */
export function serializeRowsForApi(rows: Record<string, unknown>[]) {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) {
        out[key] = value.toISOString();
      } else {
        out[key] = value;
      }
    }
    return out;
  });
}
