import { isTaskOverdue } from "@/lib/tasks/auth";

type TaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  assigneeId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  assignee?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string };
  members?: { userId: string; user: { id: string; name: string; email: string } }[];
  fieldValues?: {
    id: string;
    value: string;
    fieldDefinition: { id: string; label: string; slug: string; fieldType: string };
  }[];
  notes?: {
    id: string;
    body: string;
    createdAt: Date;
    author: { id: string; name: string };
  }[];
  activities?: {
    id: string;
    message: string;
    createdAt: Date;
    author: { id: string; name: string };
  }[];
};

export function serializeTask(task: TaskWithRelations) {
  return {
    ...task,
    assigneeId: task.assigneeId,
    dueAt: task.dueAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    isOverdue: isTaskOverdue(task.dueAt, task.status),
    notes: task.notes?.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    activities: task.activities?.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
