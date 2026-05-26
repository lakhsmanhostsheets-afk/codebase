"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FINAL_REMARK_OPTIONS } from "@/lib/constants";
import { PageLoader } from "@/components/ui/page-loader";
import { FormField, inputClassName } from "@/components/ui/form-field";

type StoreOption = {
  id: string;
  storeName: string;
  city: string;
  state: string;
};

type LineupRow = {
  id: string;
  storeId: string;
  lineupDate: string | null;
  clientRemarks: string | null;
  finalRemarks: string | null;
  finalRemarkTag: string;
  remarks: string | null;
  store: { storeName: string; city: string; state: string };
  candidate: {
    id: string;
    name: string;
    recruiter: string | null;
    contactNumber: string | null;
    qualification: string | null;
    currentOrganization: string | null;
    city: string | null;
    state: string | null;
  };
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadData() {
    setLoading(true);
    const [storesRes, lineupsRes] = await Promise.all([
      fetch("/api/stores"),
      fetch("/api/lineups"),
    ]);
    const storesData = await storesRes.json();
    const lineupsData = await lineupsRes.json();
    if (storesRes.ok) setStores(storesData.stores || []);
    if (lineupsRes.ok) setRows(lineupsData.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function startEdit(row: LineupRow) {
    setEditingId(row.id);
    setForm({
      storeId: row.storeId,
      lineupDate: row.lineupDate ? row.lineupDate.slice(0, 10) : "",
      recruiter: row.candidate.recruiter || "",
      name: row.candidate.name,
      contactNumber: row.candidate.contactNumber || "",
      qualification: row.candidate.qualification || "",
      designation: "ISP",
      currentOrganization: row.candidate.currentOrganization || "",
      city: row.candidate.city || "",
      state: row.candidate.state || "",
      clientRemarks: row.clientRemarks || "",
      finalRemarks: row.finalRemarks || "Interview Pending",
      finalRemarkTag: row.finalRemarkTag,
      feedbackDate: "",
      remarks: row.remarks || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.storeId) {
      setMessage("Please select a store.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const url = editingId ? `/api/lineups/${editingId}` : "/api/lineups";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setMessage(editingId ? `Updated ${data.row.candidate.name}.` : `Saved lineup for ${data.row.candidate.name}.`);
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this lineup and candidate record?")) return;
    const res = await fetch(`/api/lineups/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Delete failed");
      return;
    }
    if (editingId === id) resetForm();
    await loadData();
  }

  function normalizedPhone(value: string | null) {
    if (!value) return "";
    return value.replace(/[^\d+]/g, "");
  }

  return (
    <>
      <PageHeader
        title="Candidate Lineups"
        description="View, add, and edit candidates linked to stores."
      />
      <div className="grid gap-6 p-6 xl:grid-cols-5">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"
        >
          <p className="text-sm font-semibold text-indigo-900">
            {editingId ? "Edit lineup" : "New candidate"}
          </p>
          <FormField label="Store">
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
              <input
                type="date"
                className={inputClassName}
                value={form.lineupDate}
                onChange={(e) => update("lineupDate", e.target.value)}
              />
            </FormField>
            <FormField label="Recruiter">
              <input
                className={inputClassName}
                value={form.recruiter}
                onChange={(e) => update("recruiter", e.target.value)}
              />
            </FormField>
            <FormField label="Candidate name">
              <input
                className={inputClassName}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Contact">
              <input
                className={inputClassName}
                value={form.contactNumber}
                onChange={(e) => update("contactNumber", e.target.value)}
              />
            </FormField>
            <FormField label="Qualification">
              <input
                className={inputClassName}
                value={form.qualification}
                onChange={(e) => update("qualification", e.target.value)}
              />
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
              <input
                className={inputClassName}
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </FormField>
            <FormField label="State">
              <input
                className={inputClassName}
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              />
            </FormField>
            <FormField label="Previous org" className="sm:col-span-2">
              <input
                className={inputClassName}
                value={form.currentOrganization}
                onChange={(e) => update("currentOrganization", e.target.value)}
              />
            </FormField>
            <FormField label="Client remarks" className="sm:col-span-2">
              <textarea
                className={`${inputClassName} min-h-16 py-2`}
                value={form.clientRemarks}
                onChange={(e) => update("clientRemarks", e.target.value)}
              />
            </FormField>
            <FormField label="Remarks" className="sm:col-span-2">
              <textarea
                className={`${inputClassName} min-h-16 py-2`}
                value={form.remarks}
                onChange={(e) => update("remarks", e.target.value)}
              />
            </FormField>
          </div>
          {message ? (
            <p
              className={`text-sm ${message.startsWith("Saved") || message.startsWith("Updated") ? "text-emerald-700" : "text-red-600"}`}
            >
              {message}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Update lineup" : "Save lineup"}
            </button>
            {editingId ? (
              <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2.5 text-sm">
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <p className="mb-3 text-sm font-semibold text-slate-800">All lineups ({rows.length})</p>
          {loading ? <PageLoader overlay label="Loading lineups…" /> : null}
          <div className="max-h-[720px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="p-2">Candidate</th>
                  <th className="p-2">Store</th>
                  <th className="p-2">Recruiter</th>
                  <th className="p-2">Contact</th>
                  <th className="p-2">Status</th>
                  <th className="w-16 p-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{row.candidate.name}</td>
                    <td className="p-2">
                      {row.store.storeName}
                      <span className="block text-xs text-slate-500">
                        {row.store.city}, {row.store.state}
                      </span>
                    </td>
                    <td className="p-2">{row.candidate.recruiter || "—"}</td>
                    <td className="p-2">
                      {row.candidate.contactNumber ? (
                        <div className="flex gap-1">
                          <a
                            href={`tel:${normalizedPhone(row.candidate.contactNumber)}`}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                            title="Call candidate"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${normalizedPhone(row.candidate.contactNumber).replace("+", "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                            title="WhatsApp candidate"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2">{row.finalRemarks}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !rows.length ? (
              <p className="py-8 text-center text-slate-500">No lineups yet</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
