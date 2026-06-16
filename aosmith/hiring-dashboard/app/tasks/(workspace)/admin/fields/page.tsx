"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { OPS_FIELD_TYPES } from "@/lib/tasks/constants";

type FieldDef = {
  id: string;
  label: string;
  slug: string;
  fieldType: string;
  optionsJson: string | null;
  orderIndex: number;
  isRequired: boolean;
  isActive: boolean;
};

const emptyForm = {
  label: "",
  fieldType: "TEXT",
  optionsJson: "",
  isRequired: false,
};

export default function AdminFieldsPage() {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadFields() {
    setLoading(true);
    const res = await fetch("/api/tasks/admin/fields");
    const data = await res.json();
    if (res.ok) setFields(data.fields || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadFields();
  }, []);

  async function createField(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const optionsJson =
        form.fieldType === "SELECT" && form.optionsJson
          ? JSON.stringify(form.optionsJson.split(",").map((s) => s.trim()).filter(Boolean))
          : null;

      const res = await fetch("/api/tasks/admin/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          fieldType: form.fieldType,
          optionsJson,
          isRequired: form.isRequired,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create field.");
      setForm(emptyForm);
      setMessage("Field created.");
      await loadFields();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create field.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateField(id: string) {
    const res = await fetch(`/api/tasks/admin/fields?id=${id}`, { method: "DELETE" });
    if (res.ok) await loadFields();
  }

  return (
    <>
      <PageHeader
        title="Custom Fields"
        description="Define extra fields for tasks, such as Client Name or Store."
      />

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form onSubmit={createField} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Add field</h2>
          <div className="space-y-3">
            <FormField label="Label" hint='e.g. "Client Name"'>
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={inputClassName}
                required
              />
            </FormField>
            <FormField label="Type">
              <select
                value={form.fieldType}
                onChange={(e) => setForm((f) => ({ ...f, fieldType: e.target.value }))}
                className={inputClassName}
              >
                {OPS_FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>
            {form.fieldType === "SELECT" ? (
              <FormField label="Options" hint="Comma-separated values">
                <input
                  value={form.optionsJson}
                  onChange={(e) => setForm((f) => ({ ...f, optionsJson: e.target.value }))}
                  className={inputClassName}
                  placeholder="Client A, Client B, Client C"
                />
              </FormField>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
              />
              Required on task forms
            </label>
          </div>
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add Field"}
          </button>
        </form>

        <div>
          <h2 className="mb-4 font-semibold text-slate-900">Defined fields</h2>
          {loading ? (
            <PageLoader />
          ) : fields.length === 0 ? (
            <p className="text-sm text-slate-500">No custom fields yet.</p>
          ) : (
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {field.label}
                      {!field.isActive ? (
                        <span className="ml-2 text-xs text-slate-400">(inactive)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500">
                      {field.fieldType}
                      {field.isRequired ? " · required" : ""}
                    </p>
                  </div>
                  {field.isActive ? (
                    <button
                      type="button"
                      onClick={() => deactivateField(field.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
