import * as XLSX from "xlsx";
import { extractWorkbookSheets, serializeRowsForApi } from "@/lib/domain/workbook-sheets";

export async function parseWorkbookFile(file: File) {
  const buffer = await file.arrayBuffer();
  const { openListRows, lineupRows } = extractWorkbookSheets(buffer);
  return {
    sourceFileName: file.name,
    openListRows: serializeRowsForApi(openListRows),
    lineupRows: serializeRowsForApi(lineupRows),
    rowsRead: openListRows.length + lineupRows.length,
  };
}

export async function postParsedImport(payload: {
  sourceFileName: string;
  openListRows: Record<string, unknown>[];
  lineupRows: Record<string, unknown>[];
}) {
  const response = await fetch("/api/imports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: { error?: string; rowsImported?: number; rowsRead?: number; errors?: string[] } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      response.ok
        ? "Invalid server response."
        : text.slice(0, 200) || `Import failed (${response.status})`,
    );
  }

  if (!response.ok) {
    throw new Error(data.error || text.slice(0, 200) || `Import failed (${response.status})`);
  }

  return data;
}
