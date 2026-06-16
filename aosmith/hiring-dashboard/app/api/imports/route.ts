import { NextResponse } from "next/server";
import { z } from "zod";
import { importLineupBatch, importOpenListBatch } from "@/lib/domain/import-batches";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_ROWS_PER_REQUEST = 25;

const batchSchema = z.object({
  sourceFileName: z.string().min(1),
  mode: z.enum(["open", "lineup"]),
  rows: z.array(z.record(z.string(), z.unknown())).max(MAX_ROWS_PER_REQUEST),
  rowOffset: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          error:
            "Use Import Excel in the app (browser parses the file). Direct file upload is not supported on Vercel for large workbooks.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const batch = batchSchema.safeParse(body);
    if (batch.success) {
      const { mode, rows, sourceFileName, rowOffset } = batch.data;
      const result =
        mode === "open"
          ? await importOpenListBatch(rows, sourceFileName, rowOffset)
          : await importLineupBatch(rows, sourceFileName, rowOffset);
      return NextResponse.json({
        rowsRead: rows.length,
        rowsImported: result.rowsImported,
        errors: result.errors,
      });
    }

    if ("openListRows" in body || "lineupRows" in body) {
      return NextResponse.json(
        {
          error:
            "Full-workbook upload is not supported. Refresh the page and use Import Excel (batched save).",
        },
        { status: 413 },
      );
    }

    return NextResponse.json({ error: "Invalid import payload." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    const status = message.includes("too large") ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
