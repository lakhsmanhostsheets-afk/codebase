"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { TaskList, type TaskRow } from "@/components/tasks/task-list";
import { inputClassName } from "@/components/ui/form-field";
import { OPS_TASK_STATUSES } from "@/lib/tasks/constants";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  async function loadTasks() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/tasks?${params}`);
    const data = await res.json();
    if (res.ok) setTasks(data.tasks || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Tasks assigned to you, created by you, or where you are tagged."
        actions={
          <Link
            href="/tasks/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className={`${inputClassName} max-w-xs`}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${inputClassName} max-w-[180px]`}
          >
            <option value="">All statuses</option>
            {OPS_TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadTasks}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
          >
            Apply filters
          </button>
        </div>

        {loading ? <PageLoader /> : <TaskList tasks={tasks} />}
      </div>
    </>
  );
}
