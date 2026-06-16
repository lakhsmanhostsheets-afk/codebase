import type { OpsTaskPriority, OpsTaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeTask } from "@/lib/tasks/serialize";
import { tasksWhereForUser, canAccessTask } from "@/lib/tasks/visibility";

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  members: { include: { user: { select: { id: true, name: true, email: true } } } },
  fieldValues: {
    include: {
      fieldDefinition: { select: { id: true, label: true, slug: true, fieldType: true } },
    },
  },
} as const;

const taskDetailInclude = {
  ...taskInclude,
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: { author: { select: { id: true, name: true } } },
  },
  activities: {
    orderBy: { createdAt: "desc" as const },
    include: { author: { select: { id: true, name: true } } },
  },
};

export type ListTasksFilters = {
  status?: OpsTaskStatus;
  search?: string;
  assigneeId?: string;
};

export async function listTasks(
  userId: string,
  role: "ADMIN" | "MEMBER",
  filters: ListTasksFilters = {},
) {
  const where: import("@prisma/client").Prisma.OpsTaskWhereInput = {
    AND: [
      tasksWhereForUser(userId, role),
      ...(filters.status ? [{ status: filters.status }] : []),
      ...(filters.assigneeId ? [{ assigneeId: filters.assigneeId }] : []),
      ...(filters.search
        ? [
            {
              OR: [
                { title: { contains: filters.search, mode: "insensitive" as const } },
                { description: { contains: filters.search, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const tasks = await prisma.opsTask.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
  });

  return tasks.map(serializeTask);
}

export async function getTaskById(taskId: string, userId: string, role: "ADMIN" | "MEMBER") {
  const task = await prisma.opsTask.findUnique({
    where: { id: taskId },
    include: {
      ...taskDetailInclude,
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!task) return null;
  if (!canAccessTask(task, userId, role)) return null;
  return serializeTask(task);
}

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: OpsTaskStatus;
  priority?: OpsTaskPriority;
  dueAt?: string | null;
  assigneeId?: string | null;
  taggedUserIds?: string[];
  fieldValues?: { fieldDefinitionId: string; value: string }[];
};

export async function createTask(userId: string, input: CreateTaskInput) {
  const taggedUserIds = (input.taggedUserIds || []).filter((id) => id !== input.assigneeId);

  const task = await prisma.opsTask.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status || "TODO",
      priority: input.priority || "MEDIUM",
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      assigneeId: input.assigneeId || userId,
      createdById: userId,
      members: {
        create: taggedUserIds.map((uid) => ({ userId: uid })),
      },
      fieldValues: input.fieldValues?.length
        ? {
            create: input.fieldValues.map((fv) => ({
              fieldDefinitionId: fv.fieldDefinitionId,
              value: fv.value,
            })),
          }
        : undefined,
      activities: {
        create: { authorId: userId, message: "Task created" },
      },
    },
    include: taskDetailInclude,
  });

  return serializeTask(task);
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export async function updateTask(
  taskId: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
  input: UpdateTaskInput,
) {
  const existing = await prisma.opsTask.findUnique({
    where: { id: taskId },
    include: { members: true },
  });
  if (!existing) return null;
  if (!canAccessTask(existing, userId, role)) return null;

  const activities: { authorId: string; message: string }[] = [];

  if (input.status && input.status !== existing.status) {
    activities.push({
      authorId: userId,
      message: `Status changed from ${existing.status} to ${input.status}`,
    });
  }
  if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
    activities.push({ authorId: userId, message: "Assignee updated" });
  }

  const taggedUserIds = input.taggedUserIds
    ? input.taggedUserIds.filter((id) => id !== (input.assigneeId ?? existing.assigneeId))
    : undefined;

  if (taggedUserIds) {
    const existingIds = new Set(existing.members.map((m) => m.userId));
    const newIds = taggedUserIds.filter((id) => !existingIds.has(id));
    if (newIds.length) {
      activities.push({
        authorId: userId,
        message: `Tagged ${newIds.length} team member(s)`,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    if (taggedUserIds) {
      await tx.opsTaskMember.deleteMany({ where: { taskId } });
      if (taggedUserIds.length) {
        await tx.opsTaskMember.createMany({
          data: taggedUserIds.map((uid) => ({ taskId, userId: uid })),
        });
      }
    }

    if (input.fieldValues?.length) {
      for (const fv of input.fieldValues) {
        await tx.opsTaskFieldValue.upsert({
          where: {
            taskId_fieldDefinitionId: {
              taskId,
              fieldDefinitionId: fv.fieldDefinitionId,
            },
          },
          create: {
            taskId,
            fieldDefinitionId: fv.fieldDefinitionId,
            value: fv.value,
          },
          update: { value: fv.value },
        });
      }
    }

    if (activities.length) {
      await tx.opsTaskActivity.createMany({ data: activities.map((a) => ({ taskId, ...a })) });
    }

    await tx.opsTask.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueAt !== undefined
          ? { dueAt: input.dueAt ? new Date(input.dueAt) : null }
          : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      },
    });
  });

  return getTaskById(taskId, userId, role);
}

export async function cancelTask(taskId: string, userId: string, role: "ADMIN" | "MEMBER") {
  return updateTask(taskId, userId, role, { status: "CANCELLED" });
}

export async function listTasksGroupedByAssignee() {
  const users = await prisma.opsUser.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      assignedTasks: {
        include: taskInclude,
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    user: { id: u.id, name: u.name, email: u.email, role: u.role },
    tasks: u.assignedTasks.map(serializeTask),
    counts: {
      total: u.assignedTasks.length,
      completed: u.assignedTasks.filter((t) => t.status === "COMPLETED").length,
      pending: u.assignedTasks.filter(
        (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
      ).length,
    },
  }));
}
