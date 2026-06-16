"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { FormField, inputClassName } from "@/components/ui/form-field";

type OpsUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { assignedTasks: number };
};

const emptyForm = { name: "", email: "", password: "", role: "MEMBER" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<OpsUserRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/tasks/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => {
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
    if (!confirm("Deactivate this user? They will no longer be able to sign in.")) return;
    const res = await fetch(`/api/tasks/admin/users?userId=${userId}`, { method: "DELETE" });
    if (res.ok) await loadUsers();
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
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">{u._count.assignedTasks}</td>
                      <td className="px-4 py-3">{u.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <button
                            type="button"
                            onClick={() => deactivateUser(u.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Deactivate
                          </button>
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
