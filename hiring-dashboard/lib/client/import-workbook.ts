import { extractWorkbookSheets, serializeRowsForApi } from "@/lib/domain/workbook-sheets";

/** Stay well under Vercel's ~4.5MB request body limit. */
const MAX_CHUNK_BYTES = 400 * 1024;
const INITIAL_BATCH_SIZE = 3;

type ImportProgress = (message: string) => void;

function estimateBytes(payload: unknown) {
  return new Blob([JSON.stringify(payload)]).size;
}

function buildBatches(
  rows: Record<string, unknown>[],
  sourceFileName: string,
  mode: "open" | "lineup",
) {
  const batches: { rows: Record<string, unknown>[]; rowOffset: number }[] = [];
  let index = 0;

  while (index < rows.length) {
    let size = Math.min(INITIAL_BATCH_SIZE, rows.length - index);

    while (size > 0) {
      const slice = rows.slice(index, index + size);
      const body = { sourceFileName, mode, rows: slice, rowOffset: index };

      if (estimateBytes(body) <= MAX_CHUNK_BYTES || size === 1) {
        batches.push({ rows: slice, rowOffset: index });
        index += size;
        break;
      }

      size = Math.max(1, Math.floor(size / 2));
    }
  }

  return batches;
}

async function postBatch(payload: {
  sourceFileName: string;
  mode: "open" | "lineup";
  rows: Record<string, unknown>[];
  rowOffset: number;
}) {
  const response = await fetch("/api/imports", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: {
    error?: string;
    rowsImported?: number;
    rowsRead?: number;
    errors?: string[];
  } = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (
      response.status === 413 ||
      text.includes("Request Entity Too Large") ||
      text.includes("FUNCTION_PAYLOAD_TOO_LARGE")
    ) {
      throw new Error(
        "A batch was still too large for the server. Refresh the page and try again, or split the workbook.",
      );
    }
    throw new Error(text.slice(0, 200) || `Import failed (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.error || text.slice(0, 200) || `Import failed (${response.status})`);
  }

  return data;
}

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

export async function postParsedImport(
  payload: {
    sourceFileName: string;
    openListRows: Record<string, unknown>[];
    lineupRows: Record<string, unknown>[];
  },
  onProgress?: ImportProgress,
) {
  let rowsImported = 0;
  const allErrors: string[] = [];
  const { sourceFileName, openListRows, lineupRows } = payload;
  const rowsRead = openListRows.length + lineupRows.length;

  onProgress?.(
    `Ready: ${openListRows.length} openings + ${lineupRows.length} lineups. Saving in small batches…`,
  );

  const openBatches = buildBatches(openListRows, sourceFileName, "open");
  for (let i = 0; i < openBatches.length; i += 1) {
    const { rows, rowOffset } = openBatches[i];
    onProgress?.(`Saving openings ${rowOffset + 1}–${rowOffset + rows.length} of ${openListRows.length}…`);
    const result = await postBatch({
      sourceFileName,
      mode: "open",
      rows,
      rowOffset,
    });
    rowsImported += result.rowsImported ?? 0;
    allErrors.push(...(result.errors ?? []));
  }

  const lineupBatches = buildBatches(lineupRows, sourceFileName, "lineup");
  for (let i = 0; i < lineupBatches.length; i += 1) {
    const { rows, rowOffset } = lineupBatches[i];
    onProgress?.(`Saving lineups ${rowOffset + 1}–${rowOffset + rows.length} of ${lineupRows.length}…`);
    const result = await postBatch({
      sourceFileName,
      mode: "lineup",
      rows,
      rowOffset,
    });
    rowsImported += result.rowsImported ?? 0;
    allErrors.push(...(result.errors ?? []));
  }

  return {
    rowsRead,
    rowsImported,
    errors: allErrors,
  };
}
