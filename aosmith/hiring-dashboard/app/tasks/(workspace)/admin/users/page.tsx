"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { FormField, inputClassName } from "@/components/ui/form-field";

type OpsUserRow = {
  id: string;
  email: string;
  name: string;
  designation?: string | null;
  role: string;
  isActive: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canViewAllTasks: boolean;
  createdAt: string;
  _count: { assignedTasks: number };
};

const emptyForm = {
  name: "",
  designation: "",
  email: "",
  password: "",
  role: "MEMBER",
  canCreateTask: true,
  canAssignTask: true,
  canViewAllTasks: false,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<OpsUserRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDesignation, setEditingDesignation] = useState("");
  const [editingCanCreateTask, setEditingCanCreateTask] = useState(true);
  const [editingCanAssignTask, setEditingCanAssignTask] = useState(true);
  const [editingCanViewAllTasks, setEditingCanViewAllTasks] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/tasks/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/tasks/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user.");
      setForm(emptyForm);
      setMessage("User created.");
      await loadUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateUser(userId: string) {
    if (!confirm("Delete this user account? This performs a soft delete (deactivation).")) return;
    const res = await fetch(`/api/tasks/admin/users?userId=${userId}`, { method: "DELETE" });
    if (res.ok) await loadUsers();
  }

  async function saveUserName(userId: string) {
    const name = editingName.trim();
    if (!name) return;
    const res = await fetch("/api/tasks/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        name,
        designation: editingDesignation,
        canCreateTask: editingCanCreateTask,
        canAssignTask: editingCanAssignTask,
        canViewAllTasks: editingCanViewAllTasks,
      }),
    });
    if (res.ok) {
      setEditingUserId(null);
      setEditingName("");
      await loadUsers();
    }
  }

  return (
    <>
      <PageHeader title="Users" description="Create and manage team accounts for the task tracker." />

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <form onSubmit={createUser} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Create user</h2>
          <div className="space-y-3">
            <FormField label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClassName}
                required
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClassName}
                required
              />
            </FormField>
            <FormField label="Designation">
              <input
                value={form.designation}
                onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                className={inputClassName}
                placeholder="e.g. Ops Executive"
              />
            </FormField>
            <FormField label="Password">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputClassName}
                minLength={6}
                required
              />
            </FormField>
            <FormField label="Role">
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className={inputClassName}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </FormField>
            {form.role !== "ADMIN" ? (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.canCreateTask}
                    onChange={(e) => setForm((f) => ({ ...f, canCreateTask: e.target.checked }))}
                  />
                  Can create tasks
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.canAssignTask}
                    onChange={(e) => setForm((f) => ({ ...f, canAssignTask: e.target.checked }))}
                  />
                  Can assign tasks
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.canViewAllTasks}
                    onChange={(e) => setForm((f) => ({ ...f, canViewAllTasks: e.target.checked }))}
                  />
                  Can view all tasks
                </label>
              </>
            ) : null}
          </div>
          {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create User"}
          </button>
        </form>

        <div>
          <h2 className="mb-4 font-semibold text-slate-900">All users</h2>
          {loading ? (
            <PageLoader />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Tasks</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        {editingUserId === u.id ? (
                          <div className="space-y-2">
                            <input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className={`${inputClassName} h-8`}
                            />
                            <input
                              value={editingDesignation}
                              onChange={(e) => setEditingDesignation(e.target.value)}
                              className={`${inputClassName} h-8`}
                              placeholder="Designation"
                            />
                            {u.role !== "ADMIN" ? (
                              <div className="grid gap-1 text-xs text-slate-600">
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingCanCreateTask}
                                    onChange={(e) => setEditingCanCreateTask(e.target.checked)}
                                  />
                                  Create tasks
                                </label>
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingCanAssignTask}
                                    onChange={(e) => setEditingCanAssignTask(e.target.checked)}
                                  />
                                  Assign tasks
                                </label>
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={editingCanViewAllTasks}
                                    onChange={(e) => setEditingCanViewAllTasks(e.target.checked)}
                                  />
                                  View all tasks
                                </label>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{u.name}</p>
                            {u.designation ? (
                              <p className="text-xs text-slate-500">{u.designation}</p>
                            ) : null}
                          </div>
                        )}
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">{u._count.assignedTasks}</td>
                      <td className="px-4 py-3">{u.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {u.role === "ADMIN"
                          ? "All permissions"
                          : [
                              u.canCreateTask ? "Create" : null,
                              u.canAssignTask ? "Assign" : null,
                              u.canViewAllTasks ? "View all" : null,
                            ]
                              .filter(Boolean)
                              .join(", ") || "None"}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <div className="flex gap-2">
                            {editingUserId === u.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void saveUserName(u.id)}
                                  className="text-xs text-indigo-600 hover:underline"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUserId(null);
                                    setEditingName("");
                                    setEditingDesignation("");
                                    setEditingCanCreateTask(true);
                                    setEditingCanAssignTask(true);
                                    setEditingCanViewAllTasks(false);
                                  }}
                                  className="text-xs text-slate-600 hover:underline"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUserId(u.id);
                                  setEditingName(u.name);
                                  setEditingDesignation(u.designation || "");
                                  setEditingCanCreateTask(u.canCreateTask);
                                  setEditingCanAssignTask(u.canAssignTask);
                                  setEditingCanViewAllTasks(u.canViewAllTasks);
                                }}
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deactivateUser(u.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
