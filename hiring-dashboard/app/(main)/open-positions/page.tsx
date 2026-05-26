"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FormField, inputClassName } from "@/components/ui/form-field";

type PositionRow = {
  id: string;
  designation: string;
  positionCount: number;
  openPositionCount: number;
  store: {
    storeName: string;
    city: string;
    state: string;
    address: string;
    supervisor: string | null;
  };
};

const initialForm = {
  vertical: "R4",
  dateOfOpen: "",
  accountName: "AO Smith",
  region: "",
  state: "",
  city: "",
  storeAddress: "",
  storeName: "",
  supervisor: "",
  poa: "",
  designation: "ISP",
  positionCount: "1",
};

export default function OpenPositionsPage() {
  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadRows() {
    const response = await fetch("/api/open-positions");
    const data = await response.json();
    if (response.ok) setRows(data.rows || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial table load
    void loadRows();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/open-positions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          positionCount: Number(form.positionCount),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setMessage(`Saved opening for ${data.row.store.storeName}, ${data.row.store.city}.`);
      setForm((prev) => ({
        ...initialForm,
        vertical: prev.vertical,
        accountName: prev.accountName,
        designation: prev.designation,
        state: prev.state,
        city: prev.city,
      }));
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Open Positions"
        description="Add store openings — same fields as the AO Smith Open list sheet."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-indigo-900">New opening</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Vertical">
              <input className={inputClassName} value={form.vertical} onChange={(e) => update("vertical", e.target.value)} />
            </FormField>
            <FormField label="Date of open">
              <input type="date" className={inputClassName} value={form.dateOfOpen} onChange={(e) => update("dateOfOpen", e.target.value)} />
            </FormField>
            <FormField label="Account name">
              <input className={inputClassName} value={form.accountName} onChange={(e) => update("accountName", e.target.value)} required />
            </FormField>
            <FormField label="Region">
              <input className={inputClassName} value={form.region} onChange={(e) => update("region", e.target.value)} />
            </FormField>
            <FormField label="State">
              <input className={inputClassName} value={form.state} onChange={(e) => update("state", e.target.value)} required />
            </FormField>
            <FormField label="City">
              <input className={inputClassName} value={form.city} onChange={(e) => update("city", e.target.value)} required />
            </FormField>
            <FormField label="Store name" className="sm:col-span-2">
              <input className={inputClassName} value={form.storeName} onChange={(e) => update("storeName", e.target.value)} required />
            </FormField>
            <FormField label="Store address" className="sm:col-span-2">
              <input className={inputClassName} value={form.storeAddress} onChange={(e) => update("storeAddress", e.target.value)} required />
            </FormField>
            <FormField label="Supervisor">
              <input className={inputClassName} value={form.supervisor} onChange={(e) => update("supervisor", e.target.value)} />
            </FormField>
            <FormField label="POA">
              <input className={inputClassName} value={form.poa} onChange={(e) => update("poa", e.target.value)} />
            </FormField>
            <FormField label="Designation">
              <input className={inputClassName} value={form.designation} onChange={(e) => update("designation", e.target.value)} required />
            </FormField>
            <FormField label="Position count">
              <input type="number" min={1} className={inputClassName} value={form.positionCount} onChange={(e) => update("positionCount", e.target.value)} required />
            </FormField>
          </div>
          {message ? (
            <p className={`text-sm ${message.startsWith("Saved") ? "text-emerald-700" : "text-red-600"}`}>{message}</p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save open position"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">Recent openings</p>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="p-2">Store</th>
                  <th className="p-2">City</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{row.store.storeName}</td>
                    <td className="p-2">{row.store.city}</td>
                    <td className="p-2">{row.designation}</td>
                    <td className="p-2">{row.openPositionCount}/{row.positionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length ? <p className="py-8 text-center text-slate-500">No records yet</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
