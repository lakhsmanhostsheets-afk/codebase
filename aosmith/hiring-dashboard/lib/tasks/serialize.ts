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
  etaBreachedAt?: Date | null;
  assignee?: { id: string; name: string; designation: string | null; email: string } | null;
  createdBy?: { id: string; name: string; designation: string | null; email: string };
  members?: {
    userId: string;
    user: { id: string; name: string; designation: string | null; email: string };
  }[];
  fieldValues?: {
    id: string;
    value: string;
    fieldDefinition: { id: string; label: string; slug: string; fieldType: string };
  }[];
  notes?: {
    id: string;
    body: string;
    createdAt: Date;
    author: { id: string; name: string; designation: string | null };
  }[];
  activities?: {
    id: string;
    message: string;
    createdAt: Date;
    author: { id: string; name: string; designation: string | null };
  }[];
};

type TaskListShape = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  assignee?: { id: string; name: string; designation: string | null } | null;
  members?: {
    userId: string;
    user: { id: string; name: string; designation: string | null };
  }[];
};

export function serializeTaskList(task: TaskListShape) {
  return {
    ...task,
    dueAt: task.dueAt?.toISOString() ?? null,
    isOverdue: isTaskOverdue(task.dueAt, task.status),
  };
}

export function serializeTask(task: TaskWithRelations) {
  return {
    ...task,
    assigneeId: task.assigneeId,
    dueAt: task.dueAt?.toISOString() ?? null,
    etaBreachedAt: task.etaBreachedAt?.toISOString() ?? null,
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
