import { NextResponse } from "next/server";
import { z } from "zod";
import { importParsedRows, importWorkbook } from "@/lib/domain/excel-import";

export const runtime = "nodejs";
export const maxDuration = 60;

const jsonImportSchema = z.object({
  sourceFileName: z.string().min(1),
  openListRows: z.array(z.record(z.string(), z.unknown())),
  lineupRows: z.array(z.record(z.string(), z.unknown())),
});

async function parseJsonBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  const body = await request.json();
  return jsonImportSchema.parse(body);
}

export async function POST(request: Request) {
  try {
    const jsonPayload = await parseJsonBody(request).catch(() => null);

    if (jsonPayload) {
      const result = await importParsedRows(
        jsonPayload.openListRows,
        jsonPayload.lineupRows,
        jsonPayload.sourceFileName,
      );
      return NextResponse.json(result);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Send JSON { sourceFileName, openListRows, lineupRows } or multipart file under 4MB.",
        },
        { status: 400 },
      );
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        {
          error:
            "File is too large for direct upload on Vercel (max ~4MB). The app will parse Excel in your browser automatically — please redeploy the latest version or use Import Excel from the left menu.",
        },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importWorkbook(buffer, file.name);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 500 },
    );
  }
}
