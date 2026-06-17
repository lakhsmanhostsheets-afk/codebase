"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EtaAlertsPanel } from "@/components/tasks/eta-alerts-panel";
import { TaskList, type TaskRow } from "@/components/tasks/task-list";

type GroupedUser = {
  user: { id: string; name: string; designation?: string | null; email: string; role: string };
  tasks: TaskRow[];
  counts: { total: number; completed: number; pending: number };
};

export default function AdminTasksPage() {
  const [grouped, setGrouped] = useState<GroupedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/tasks/admin/analytics?view=grouped")
      .then((r) => r.json())
      .then((d) => setGrouped(d.grouped || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="All Tasks by Person"
        description="Admin view of every team member's assigned tasks."
      />

      <div className="space-y-4 p-6">
        <EtaAlertsPanel />
        {loading ? (
          <PageLoader />
        ) : grouped.length === 0 ? (
          <p className="text-sm text-slate-500">No users or tasks yet.</p>
        ) : (
          grouped.map((row) => (
            <div key={row.user.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setExpanded((id) => (id === row.user.id ? null : row.user.id))}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">{row.user.name}</p>
                  {row.user.designation ? (
                    <p className="text-xs text-slate-500">{row.user.designation}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">{row.user.email}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-slate-600">Total: {row.counts.total}</span>
                  <span className="text-emerald-600">Done: {row.counts.completed}</span>
                  <span className="text-indigo-600">Pending: {row.counts.pending}</span>
                </div>
              </button>
              {expanded === row.user.id ? (
                <div className="border-t border-slate-100 p-4">
                  <TaskList
                    tasks={row.tasks}
                    emptyMessage="No tasks assigned to this person."
                  />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </>
  );
}
