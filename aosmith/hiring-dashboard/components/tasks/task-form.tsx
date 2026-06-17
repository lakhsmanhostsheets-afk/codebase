"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { OPS_TASK_PRIORITIES, OPS_TASK_STATUSES } from "@/lib/tasks/constants";
import { useTasksUser } from "@/components/tasks/tasks-user-context";

type TeamMember = { id: string; name: string; designation: string | null; email: string };
type FieldDef = {
  id: string;
  label: string;
  fieldType: string;
  optionsJson: string | null;
  isRequired: boolean;
};

type TaskFormProps = {
  mode: "create" | "edit";
  taskId?: string;
  initial?: {
    createdById?: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueAt: string;
    assigneeId: string;
    taggedUserIds: string[];
    fieldValues: Record<string, string>;
    statusNote?: string;
  };
};

const emptyInitial = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueAt: "",
  assigneeId: "",
  taggedUserIds: [] as string[],
  fieldValues: {} as Record<string, string>,
  statusNote: "",
};

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffsetMinutes = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - tzOffsetMinutes * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export function TaskForm({ mode, taskId, initial }: TaskFormProps) {
  const { user } = useTasksUser();
  const router = useRouter();
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...initial,
          dueAt: initial.dueAt ? toDatetimeLocalValue(initial.dueAt) : "",
        }
      : emptyInitial,
  );
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canAssignTasks = !!user && (user.role === "ADMIN" || user.canAssignTask);
  const canManageAccess =
    mode === "create" || user?.role === "ADMIN" || (!!initial?.createdById && initial.createdById === user?.id);

  useEffect(() => {
    void Promise.all([
      fetch("/api/tasks/team").then((r) => r.json()),
      fetch("/api/tasks/fields").then((r) => r.json()),
    ]).then(([teamData, fieldsData]) => {
      setTeam(teamData.team || []);
      setFields(fieldsData.fields || []);
      const uid = user?.id || "";
      setCurrentUserId(uid);
      if (mode === "create") {
        setForm((prev) => {
          if (prev.assigneeId) return prev;
          return { ...prev, assigneeId: uid };
        });
      }
    });
  }, [mode, user?.id]);

  useEffect(() => {
    if (!canAssignTasks && currentUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, assigneeId: currentUserId }));
    }
  }, [canAssignTasks, currentUserId]);

  function updateField(key: keyof typeof form, value: string | string[]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCustomField(fieldId: string, value: string) {
    setForm((prev) => ({
      ...prev,
      fieldValues: { ...prev.fieldValues, [fieldId]: value },
    }));
  }

  const needsStatusNote =
    mode === "edit" && !!initial?.status && form.status !== initial.status;

  function toggleTagged(userId: string) {
    setForm((prev) => {
      const set = new Set(prev.taggedUserIds);
      if (set.has(userId)) set.delete(userId);
      else set.add(userId);
      return { ...prev, taggedUserIds: Array.from(set) };
    });
  }

  function renderCustomFieldInput(field: FieldDef) {
    const value = form.fieldValues[field.id] || "";
    if (field.fieldType === "SELECT" && field.optionsJson) {
      let options: string[] = [];
      try {
        options = JSON.parse(field.optionsJson) as string[];
      } catch {
        options = field.optionsJson.split(",").map((s) => s.trim());
      }
      return (
        <select
          value={value}
          onChange={(e) => updateCustomField(field.id, e.target.value)}
          className={inputClassName}
          required={field.isRequired}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
    if (field.fieldType === "DATE") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => updateCustomField(field.id, e.target.value)}
          className={inputClassName}
          required={field.isRequired}
        />
      );
    }
    if (field.fieldType === "NUMBER") {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => updateCustomField(field.id, e.target.value)}
          className={inputClassName}
          required={field.isRequired}
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => updateCustomField(field.id, e.target.value)}
        className={inputClassName}
        required={field.isRequired}
      />
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueAt: form.dueAt || null,
      assigneeId: canAssignTasks ? form.assigneeId || currentUserId : currentUserId,
      taggedUserIds: form.taggedUserIds.filter((id) => id !== form.assigneeId),
      fieldValues: Object.entries(form.fieldValues).map(([fieldDefinitionId, value]) => ({
        fieldDefinitionId,
        value,
      })),
      ...(needsStatusNote ? { statusNote: form.statusNote } : {}),
    };

    try {
      if (needsStatusNote && !(form.statusNote ?? "").trim()) {
        throw new Error("Please add a note when changing task status.");
      }
      const url = mode === "create" ? "/api/tasks" : `/api/tasks/${taskId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save task.");
      router.push(`/tasks/${data.task.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <FormField label="Title">
        <input
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className={inputClassName}
          required
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          className={`${inputClassName} min-h-[100px] py-2`}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Status">
          <select
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className={inputClassName}
          >
            {OPS_TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Priority">
          <select
            value={form.priority}
            onChange={(e) => updateField("priority", e.target.value)}
            className={inputClassName}
          >
            {OPS_TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {needsStatusNote ? (
        <FormField label="Status change note" hint="Required whenever status is changed.">
          <textarea
            value={form.statusNote}
            onChange={(e) => updateField("statusNote", e.target.value)}
            rows={3}
            className={`${inputClassName} min-h-[80px] py-2`}
            required
          />
        </FormField>
      ) : null}

      <FormField label="Due date & time">
        <input
          type="datetime-local"
          value={form.dueAt}
          onChange={(e) => updateField("dueAt", e.target.value)}
          className={inputClassName}
        />
      </FormField>

      <FormField label="Assign to">
        <select
          value={form.assigneeId}
          onChange={(e) => updateField("assigneeId", e.target.value)}
          className={inputClassName}
          disabled={!canAssignTasks}
        >
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.designation ? ` - ${m.designation}` : ""} ({m.email})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tag team members" hint="Tagged members can see and collaborate on this task.">
        <div className="flex flex-wrap gap-2">
          {team
            .filter((m) => m.id !== form.assigneeId)
            .map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.taggedUserIds.includes(m.id)}
                  onChange={() => toggleTagged(m.id)}
                  disabled={!canManageAccess}
                />
                <span>
                  {m.name}
                  {m.designation ? ` - ${m.designation}` : ""}
                </span>
              </label>
            ))}
        </div>
      </FormField>

      {fields.length > 0 ? (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-800">Custom fields</p>
          {fields.map((field) => (
            <FormField key={field.id} label={field.label}>
              {renderCustomFieldInput(field)}
            </FormField>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
