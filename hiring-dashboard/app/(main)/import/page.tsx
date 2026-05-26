"use client";

import { useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function ImportPage() {
  const [log, setLog] = useState("Upload your AO Smith workbook (.xlsx).");
  const [loading, setLoading] = useState(false);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setLoading(true);
    setLog("Importing…");
    try {
      const response = await fetch("/api/imports", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");
      setLog(
        `Done: ${data.rowsImported} rows imported from ${data.rowsRead} read. Errors: ${data.errors?.length ?? 0}. Open Dashboard and click Refresh.`,
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
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            {loading ? "Importing…" : "Choose file"}
            <input type="file" accept=".xlsx,.xls,.xlsm" className="hidden" onChange={handleImport} disabled={loading} />
          </label>
          <p className="mt-6 rounded-lg bg-white/80 px-4 py-3 text-left text-sm text-slate-700">{log}</p>
        </div>
      </div>
    </>
  );
}
