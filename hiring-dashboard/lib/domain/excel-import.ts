import { prisma } from "@/lib/prisma";
import { extractWorkbookSheets } from "@/lib/domain/workbook-sheets";
import { importLineupBatch, importOpenListBatch } from "@/lib/domain/import-batches";

export type ImportResult = {
  rowsRead: number;
  rowsImported: number;
  errors: string[];
};

const CHUNK_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Import in small API chunks to stay under Vercel body limits (~4.5MB). */
export async function importParsedRows(
  openListRows: Record<string, unknown>[],
  lineupRows: Record<string, unknown>[],
  sourceFileName: string,
): Promise<ImportResult> {
  const errors: string[] = [];
  let rowsImported = 0;
  const rowsRead = openListRows.length + lineupRows.length;

  const importJob = await prisma.importJob.create({
    data: { sourceFileName, status: "running" },
  });

  try {
    const openChunks = chunk(openListRows, CHUNK_SIZE);
    for (let c = 0; c < openChunks.length; c += 1) {
      if (c === 0 || (c + 1) % 20 === 0 || c === openChunks.length - 1) {
        console.log(`  Open positions: batch ${c + 1}/${openChunks.length}…`);
      }
      const result = await importOpenListBatch(
        openChunks[c],
        sourceFileName,
        c * CHUNK_SIZE,
      );
      rowsImported += result.rowsImported;
      errors.push(...result.errors);
    }

    const lineupChunks = chunk(lineupRows, CHUNK_SIZE);
    for (let c = 0; c < lineupChunks.length; c += 1) {
      if (c === 0 || (c + 1) % 20 === 0 || c === lineupChunks.length - 1) {
        console.log(`  Lineups: batch ${c + 1}/${lineupChunks.length}…`);
      }
      const result = await importLineupBatch(
        lineupChunks[c],
        sourceFileName,
        c * CHUNK_SIZE,
      );
      rowsImported += result.rowsImported;
      errors.push(...result.errors);
    }

    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        rowsRead,
        rowsImported,
        errorsCount: errors.length,
        errorsJson: errors.length ? JSON.stringify(errors.slice(0, 100)) : null,
      },
    });
  } catch (error) {
    await prisma.importJob.update({
      where: { id: importJob.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        rowsRead,
        rowsImported,
        errorsCount: errors.length + 1,
        errorsJson: JSON.stringify([
          ...errors.slice(0, 50),
          error instanceof Error ? error.message : "Unknown import error",
        ]),
      },
    });
    throw error;
  }

  return { rowsRead, rowsImported, errors };
}

export async function importWorkbook(
  buffer: Buffer,
  sourceFileName: string,
): Promise<ImportResult> {
  const { openListRows, lineupRows } = extractWorkbookSheets(buffer);
  return importParsedRows(openListRows, lineupRows, sourceFileName);
}
