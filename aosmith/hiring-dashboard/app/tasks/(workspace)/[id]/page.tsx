"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { NotesPanel } from "@/components/tasks/notes-panel";
import { StatusBadge, PriorityBadge, OverdueBadge, formatDueDate } from "@/components/tasks/task-badges";
import { TasksLoadingState } from "@/components/tasks/tasks-loading-state";

type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  etaBreachedAt?: string | null;
  isOverdue: boolean;
  assigneeId: string | null;
  assignee?: { id: string; name: string; designation?: string | null } | null;
  createdBy?: { id: string; name: string; designation?: string | null };
  members?: { userId: string; user: { name: string; designation?: string | null } }[];
  fieldValues?: { fieldDefinition: { id: string; label: string }; value: string }[];
  notes?: {
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string; designation?: string | null };
  }[];
  activities?: {
    id: string;
    message: string;
    createdAt: string;
    author: { name: string; designation?: string | null };
  }[];
};

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = String(params.id);
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void fetch(`/api/tasks/${taskId}`)
      .then((r) => r.json())
      .then((d) => setTask(d.task || null))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) {
    return (
      <>
        <PageHeader title="Task" description="Loading..." />
        <div className="p-6">
          <TasksLoadingState label="Loading task details..." />
        </div>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <PageHeader title="Task not found" description="This task may have been removed or you lack access." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={task.title}
        description={`Assigned to ${task.assignee?.name || "—"} · Created by ${task.createdBy?.name || "—"}`}
        actions={
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm"
          >
            {editing ? "Cancel edit" : "Edit task"}
          </button>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-6">
          {editing ? (
            <TaskForm
              mode="edit"
              taskId={taskId}
              initial={{
                createdById: task.createdBy?.id,
                title: task.title,
                description: task.description || "",
                status: task.status,
                priority: task.priority,
                dueAt: task.dueAt || "",
                assigneeId: task.assigneeId || task.assignee?.id || "",
                taggedUserIds: task.members?.map((m) => m.userId) || [],
                fieldValues: Object.fromEntries(
                  (task.fieldValues || []).map((fv) => [fv.fieldDefinition.id, fv.value]),
                ),
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <OverdueBadge isOverdue={task.isOverdue} />
              </div>
              {task.description ? (
                <p className="mb-4 whitespace-pre-wrap text-sm text-slate-700">{task.description}</p>
              ) : null}
              <dl className="grid gap-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-slate-500">Due:</dt>
                  <dd>{formatDueDate(task.dueAt)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500">Tagged:</dt>
                  <dd>
                    {task.members
                      ?.map((m) =>
                        m.user.designation
                          ? `${m.user.name} (${m.user.designation})`
                          : m.user.name,
                      )
                      .join(", ") || "—"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-500">ETA breached:</dt>
                  <dd>{task.etaBreachedAt ? new Date(task.etaBreachedAt).toLocaleString("en-IN") : "No"}</dd>
                </div>
              </dl>
              {task.fieldValues?.length ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-sm font-semibold">Custom fields</p>
                  <dl className="space-y-1 text-sm">
                    {task.fieldValues.map((fv) => (
                      <div key={fv.fieldDefinition.id} className="flex gap-2">
                        <dt className="text-slate-500">{fv.fieldDefinition.label}:</dt>
                        <dd>{fv.value || "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Notes</h2>
            <NotesPanel taskId={taskId} initialNotes={task.notes || []} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Activity</h2>
          <div className="space-y-2">
            {(task.activities || []).length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              task.activities?.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                  <p className="text-slate-800">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {a.author.name}
                    {a.author.designation ? ` (${a.author.designation})` : ""} ·{" "}
                    {new Date(a.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
