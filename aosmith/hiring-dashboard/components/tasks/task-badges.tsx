import { formatDueDateIST } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { OPS_TASK_PRIORITIES, OPS_TASK_STATUSES } from "@/lib/tasks/constants";

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-rose-100 text-rose-700",
  };
  const label = OPS_TASK_STATUSES.find((s) => s.value === status)?.label || status;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[status] || colors.TODO)}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-amber-100 text-amber-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
  };
  const label = OPS_TASK_PRIORITIES.find((p) => p.value === priority)?.label || priority;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[priority] || colors.MEDIUM)}>
      {label}
    </span>
  );
}

export function OverdueBadge({ isOverdue }: { isOverdue: boolean }) {
  if (!isOverdue) return null;
  return (
    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
      Overdue
    </span>
  );
}

export function formatDueDate(dueAt: string | null) {
  return formatDueDateIST(dueAt);
}
