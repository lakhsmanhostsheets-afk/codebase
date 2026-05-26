"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { LocationSelects } from "@/components/forms/location-selects";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { FormField, inputClassName } from "@/components/ui/form-field";

type PositionRow = {
  id: string;
  designation: string;
  positionCount: number;
  openPositionCount: number;
  dateOfOpen: string | null;
  store: {
    id: string;
    storeName: string;
    city: string;
    state: string;
    country: string;
    address: string;
    accountName: string;
    supervisor: string | null;
    poa: string | null;
    region: string | null;
    vertical: string | null;
  };
};

const initialForm = {
  vertical: "R4",
  dateOfOpen: "",
  accountName: "AO Smith",
  region: "",
  country: "India",
  state: "",
  city: "",
  storeAddress: "",
  storeName: "",
  supervisor: "",
  poa: "",
  designation: "ISP",
  positionCount: "1",
  openPositionCount: "1",
};

export default function OpenPositionsPage() {
  const [form, setForm] = useState(initialForm);
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadRows() {
    setLoading(true);
    const response = await fetch("/api/open-positions");
    const data = await response.json();
    if (response.ok) setRows(data.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  function startEdit(row: PositionRow) {
    setEditingId(row.id);
    setForm({
      vertical: row.store.vertical || "R4",
      dateOfOpen: row.dateOfOpen ? row.dateOfOpen.slice(0, 10) : "",
      accountName: row.store.accountName,
      region: row.store.region || "",
      country: row.store.country || "India",
      state: row.store.state,
      city: row.store.city,
      storeAddress: row.store.address,
      storeName: row.store.storeName,
      supervisor: row.store.supervisor || "",
      poa: row.store.poa || "",
      designation: row.designation,
      positionCount: String(row.positionCount),
      openPositionCount: String(row.openPositionCount),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editingId) {
        const response = await fetch(`/api/open-positions/${editingId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            designation: form.designation,
            positionCount: Number(form.positionCount),
            openPositionCount: Number(form.openPositionCount),
            dateOfOpen: form.dateOfOpen || null,
            store: {
              accountName: form.accountName,
              storeName: form.storeName,
              country: form.country,
              state: form.state,
              city: form.city,
              address: form.storeAddress,
              supervisor: form.supervisor,
              poa: form.poa,
              region: form.region,
              vertical: form.vertical,
            },
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Update failed");
        setMessage(`Updated ${data.row.store.storeName}.`);
      } else {
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
      }
      resetForm();
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this open position?")) return;
    const res = await fetch(`/api/open-positions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Delete failed");
      return;
    }
    if (editingId === id) resetForm();
    await loadRows();
  }

  return (
    <>
      <PageHeader
        title="Open Positions"
        description="Add or edit store openings — same fields as the AO Smith Open list sheet."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-indigo-900">
            {editingId ? "Edit opening" : "New opening"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Vertical">
              <input
                className={inputClassName}
                value={form.vertical}
                onChange={(e) => update("vertical", e.target.value)}
              />
            </FormField>
            <FormField label="Date of open">
              <input
                type="date"
                className={inputClassName}
                value={form.dateOfOpen}
                onChange={(e) => update("dateOfOpen", e.target.value)}
              />
            </FormField>
            <FormField label="Account name">
              <input
                className={inputClassName}
                value={form.accountName}
                onChange={(e) => update("accountName", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Region">
              <input
                className={inputClassName}
                value={form.region}
                onChange={(e) => update("region", e.target.value)}
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
            <FormField label="Store name" className="sm:col-span-2">
              <input
                className={inputClassName}
                value={form.storeName}
                onChange={(e) => update("storeName", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Store address" className="sm:col-span-2">
              <input
                className={inputClassName}
                value={form.storeAddress}
                onChange={(e) => update("storeAddress", e.target.value)}
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
            <FormField label="Designation">
              <input
                className={inputClassName}
                value={form.designation}
                onChange={(e) => update("designation", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Position count">
              <input
                type="number"
                min={1}
                className={inputClassName}
                value={form.positionCount}
                onChange={(e) => update("positionCount", e.target.value)}
                required
              />
            </FormField>
            {editingId ? (
              <FormField label="Open count">
                <input
                  type="number"
                  min={0}
                  className={inputClassName}
                  value={form.openPositionCount}
                  onChange={(e) => update("openPositionCount", e.target.value)}
                  required
                />
              </FormField>
            ) : null}
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
              {saving ? "Saving…" : editingId ? "Update opening" : "Save open position"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">All openings ({rows.length})</p>
          {loading ? <PageLoader overlay label="Loading openings…" /> : null}
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="p-2">Store</th>
                  <th className="p-2">City</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Open</th>
                  <th className="w-16 p-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{row.store.storeName}</td>
                    <td className="p-2">{row.store.city}</td>
                    <td className="p-2">{row.designation}</td>
                    <td className="p-2">
                      {row.openPositionCount}/{row.positionCount}
                    </td>
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
              <p className="py-8 text-center text-slate-500">No records yet</p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
