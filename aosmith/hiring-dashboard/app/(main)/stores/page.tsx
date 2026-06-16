"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { LocationSelects } from "@/components/forms/location-selects";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { FormField, inputClassName } from "@/components/ui/form-field";

type StoreRow = {
  id: string;
  accountName: string;
  storeName: string;
  country: string;
  city: string;
  state: string;
  address: string;
  supervisor: string | null;
  poa: string | null;
  region: string | null;
  vertical: string | null;
  _count: { openPositions: number; lineups: number };
};

const emptyForm = {
  accountName: "AO Smith",
  storeName: "",
  country: "India",
  state: "",
  city: "",
  address: "",
  supervisor: "",
  poa: "",
  region: "",
  vertical: "R4",
};

export default function StoresPage() {
  const [rows, setRows] = useState<StoreRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadRows() {
    setLoading(true);
    const res = await fetch("/api/stores");
    const data = await res.json();
    if (res.ok) setRows(data.stores || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  function startEdit(row: StoreRow) {
    setEditingId(row.id);
    setForm({
      accountName: row.accountName,
      storeName: row.storeName,
      country: row.country || "India",
      state: row.state,
      city: row.city,
      address: row.address,
      supervisor: row.supervisor || "",
      poa: row.poa || "",
      region: row.region || "",
      vertical: row.vertical || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const url = editingId ? `/api/stores/${editingId}` : "/api/stores";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(editingId ? "Store updated." : "Store created.");
      resetForm();
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete store "${name}"? This removes linked openings and lineups.`)) return;
    const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Delete failed");
      return;
    }
    if (editingId === id) resetForm();
    await loadRows();
  }

  return (
    <>
      <PageHeader
        title="Stores"
        description="Master list of stores. Edits apply everywhere (open positions, lineups, dashboard)."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="relative space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-indigo-900">
            {editingId ? "Edit store" : "Add store"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Account name">
              <input
                className={inputClassName}
                value={form.accountName}
                onChange={(e) => update("accountName", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Store name" className="sm:col-span-2">
              <input
                className={inputClassName}
                value={form.storeName}
                onChange={(e) => update("storeName", e.target.value)}
                required
              />
            </FormField>
            <LocationSelects
              country={form.country}
              state={form.state}
              city={form.city}
              onCountryChange={(v) => update("country", v)}
              onStateChange={(v) => update("state", v)}
              onCityChange={(v) => update("city", v)}
              required
            />
            <FormField label="Address" className="sm:col-span-2">
              <input
                className={inputClassName}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Supervisor">
              <input
                className={inputClassName}
                value={form.supervisor}
                onChange={(e) => update("supervisor", e.target.value)}
              />
            </FormField>
            <FormField label="POA">
              <input
                className={inputClassName}
                value={form.poa}
                onChange={(e) => update("poa", e.target.value)}
              />
            </FormField>
            <FormField label="Region">
              <input
                className={inputClassName}
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
              />
            </FormField>
            <FormField label="Vertical">
              <input
                className={inputClassName}
                value={form.vertical}
                onChange={(e) => update("vertical", e.target.value)}
              />
            </FormField>
          </div>
          {message ? (
            <p
              className={`text-sm ${message.includes("failed") || message.includes("Delete") ? "text-red-600" : "text-emerald-700"}`}
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
              {saving ? "Saving…" : editingId ? "Update store" : "Save store"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">All stores ({rows.length})</p>
          {loading ? <PageLoader overlay label="Loading stores…" /> : null}
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="p-2">Store</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Open</th>
                  <th className="p-2">Lineups</th>
                  <th className="p-2 w-20" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{row.storeName}</td>
                    <td className="p-2 text-slate-600">
                      {row.city}, {row.state}
                    </td>
                    <td className="p-2">{row._count.openPositions}</td>
                    <td className="p-2">{row._count.lineups}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id, row.storeName)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Delete"
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
              <p className="py-8 text-center text-slate-500">No stores yet</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
