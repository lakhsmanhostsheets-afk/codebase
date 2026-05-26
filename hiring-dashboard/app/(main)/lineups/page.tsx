"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FINAL_REMARK_OPTIONS } from "@/lib/constants";
import { FormField, inputClassName } from "@/components/ui/form-field";

type StoreOption = {
  id: string;
  storeName: string;
  city: string;
  state: string;
  address: string;
};

type LineupRow = {
  id: string;
  finalRemarks: string | null;
  store: { storeName: string; city: string };
  candidate: { name: string; recruiter: string | null };
};

const initialForm = {
  storeId: "",
  lineupDate: "",
  recruiter: "",
  name: "",
  contactNumber: "",
  qualification: "",
  designation: "ISP",
  currentOrganization: "",
  city: "",
  state: "",
  clientRemarks: "",
  finalRemarks: "Interview Pending",
  finalRemarkTag: "INTERVIEW_PENDING",
  feedbackDate: "",
  remarks: "",
};

export default function LineupsPage() {
  const [form, setForm] = useState(initialForm);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [rows, setRows] = useState<LineupRow[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadData() {
    const [storesRes, lineupsRes] = await Promise.all([
      fetch("/api/stores"),
      fetch("/api/lineups"),
    ]);
    const storesData = await storesRes.json();
    const lineupsData = await lineupsRes.json();
    if (storesRes.ok) setStores(storesData.stores || []);
    if (lineupsRes.ok) setRows(lineupsData.rows || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial table load
    void loadData();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.storeId) {
      setMessage("Please select a store.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/lineups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setMessage(`Saved lineup for ${data.row.candidate.name}.`);
      setForm((prev) => ({
        ...initialForm,
        storeId: prev.storeId,
        designation: prev.designation,
        recruiter: prev.recruiter,
      }));
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Candidate Lineups"
        description="Add candidates linked to a store — same as Line Up Final sheet."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-indigo-900">New candidate</p>
          <FormField label="Store" hint="Create openings first if the store is missing.">
            <select
              className={inputClassName}
              value={form.storeId}
              onChange={(e) => update("storeId", e.target.value)}
              required
            >
              <option value="">Select store…</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName} — {s.city}, {s.state}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date">
              <input type="date" className={inputClassName} value={form.lineupDate} onChange={(e) => update("lineupDate", e.target.value)} />
            </FormField>
            <FormField label="Recruiter">
              <input className={inputClassName} value={form.recruiter} onChange={(e) => update("recruiter", e.target.value)} />
            </FormField>
            <FormField label="Candidate name">
              <input className={inputClassName} value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </FormField>
            <FormField label="Contact">
              <input className={inputClassName} value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} />
            </FormField>
            <FormField label="Qualification">
              <input className={inputClassName} value={form.qualification} onChange={(e) => update("qualification", e.target.value)} />
            </FormField>
            <FormField label="Designation">
              <input className={inputClassName} value={form.designation} onChange={(e) => update("designation", e.target.value)} />
            </FormField>
            <FormField label="Previous org">
              <input className={inputClassName} value={form.currentOrganization} onChange={(e) => update("currentOrganization", e.target.value)} />
            </FormField>
            <FormField label="Final status">
              <select
                className={inputClassName}
                value={form.finalRemarkTag}
                onChange={(e) => {
                  const opt = FINAL_REMARK_OPTIONS.find((o) => o.value === e.target.value);
                  update("finalRemarkTag", e.target.value);
                  if (opt) update("finalRemarks", opt.label);
                }}
                required
              >
                {FINAL_REMARK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="City">
              <input className={inputClassName} value={form.city} onChange={(e) => update("city", e.target.value)} />
            </FormField>
            <FormField label="State">
              <input className={inputClassName} value={form.state} onChange={(e) => update("state", e.target.value)} />
            </FormField>
            <FormField label="Client remarks" className="sm:col-span-2">
              <textarea className={`${inputClassName} min-h-20 py-2`} value={form.clientRemarks} onChange={(e) => update("clientRemarks", e.target.value)} />
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
            {saving ? "Saving…" : "Save lineup"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">Recent lineups</p>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="p-2">Candidate</th>
                  <th className="p-2">Store</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{row.candidate.name}</td>
                    <td className="p-2">
                      {row.store.storeName}, {row.store.city}
                    </td>
                    <td className="p-2">{row.finalRemarks}</td>
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
