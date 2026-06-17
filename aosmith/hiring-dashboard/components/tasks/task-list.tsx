"use client";

import Link from "next/link";
import { StatusBadge, PriorityBadge, OverdueBadge, formatDueDate } from "@/components/tasks/task-badges";

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  isOverdue: boolean;
  assignee?: { id: string; name: string; designation?: string | null } | null;
  members?: { user: { id: string; name: string; designation?: string | null } }[];
};

type TaskListProps = {
  tasks: TaskRow[];
  showAssignee?: boolean;
  emptyMessage?: string;
};

export function TaskList({ tasks, showAssignee = false, emptyMessage = "No tasks found." }: TaskListProps) {
  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Task</th>
            {showAssignee ? <th className="px-4 py-3">Assignee</th> : null}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3">Tagged</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/80">
              <td className="px-4 py-3">
                <Link href={`/tasks/${task.id}`} className="font-medium text-indigo-600 hover:underline">
                  {task.title}
                </Link>
                {task.isOverdue ? (
                  <span className="ml-2">
                    <OverdueBadge isOverdue />
                  </span>
                ) : null}
              </td>
              {showAssignee ? (
                <td className="px-4 py-3 text-slate-600">
                  {task.assignee ? (
                    <div>
                      <p>{task.assignee.name}</p>
                      {task.assignee.designation ? (
                        <p className="text-xs text-slate-500">{task.assignee.designation}</p>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              ) : null}
              <td className="px-4 py-3">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={task.priority} />
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDueDate(task.dueAt)}</td>
              <td className="px-4 py-3 text-slate-500">
                {task.members?.length
                  ? task.members
                      .map((m) =>
                        m.user.designation
                          ? `${m.user.name} (${m.user.designation})`
                          : m.user.name,
                      )
                      .join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
