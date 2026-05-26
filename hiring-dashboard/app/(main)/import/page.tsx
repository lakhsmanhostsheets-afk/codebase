"use client";

import { useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { parseWorkbookFile, postParsedImport } from "@/lib/client/import-workbook";

export default function ImportPage() {
  const [log, setLog] = useState(
    "Choose your workbook. Large files are parsed in your browser, then sent to the server (avoids Vercel upload limits).",
  );
  const [loading, setLoading] = useState(false);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLog(`Reading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)…`);

    try {
      setLog("Parsing Excel in your browser…");
      const parsed = await parseWorkbookFile(file);

      setLog(
        `Parsed ${parsed.rowsRead} rows. Saving to database…`,
      );

      const result = await postParsedImport(parsed);

      setLog(
        `Done: ${result.rowsImported}/${result.rowsRead} rows saved. Unmatched: ${result.errors?.length ?? 0}. Open Dashboard to view.`,
      );
    } catch (error) {
      setLog(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Import Excel"
        description="Bulk load AO Smith Open list + Line Up Final sheets from your workbook."
      />
      <div className="p-6">
        <div className="mx-auto max-w-xl rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Upload className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Upload workbook</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sheets: <strong>AO Smith Open list</strong> and <strong>Line Up Final</strong>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Files over 4MB are supported — parsing happens locally, not on Vercel.
          </p>
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            {loading ? "Working…" : "Choose file"}
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm"
              className="hidden"
              onChange={handleImport}
              disabled={loading}
            />
          </label>
          <p className="mt-6 rounded-lg bg-white/80 px-4 py-3 text-left text-sm text-slate-700">{log}</p>
        </div>
      </div>
    </>
  );
}
