import type { OpsTaskPriority, OpsTaskStatus } from "@prisma/client";
import { parseDueAtIST } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { ensureEtaBreachForTask } from "@/lib/tasks/eta-alerts";
import {
  canAssignTasksForUser,
  canCreateTasksForUser,
  type TaskCapabilities,
} from "@/lib/tasks/permissions";
import { serializeTask, serializeTaskList } from "@/lib/tasks/serialize";
import { tasksWhereForUser, canAccessTask, canEditTask } from "@/lib/tasks/visibility";

const taskListSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueAt: true,
  assignee: { select: { id: true, name: true, designation: true } },
  members: {
    include: { user: { select: { id: true, name: true, designation: true } } },
  },
} as const;

const taskDetailInclude = {
  assignee: { select: { id: true, name: true, designation: true, email: true } },
  createdBy: { select: { id: true, name: true, designation: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, designation: true, email: true } } },
  },
  fieldValues: {
    include: {
      fieldDefinition: { select: { id: true, label: true, slug: true, fieldType: true } },
    },
  },
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: { author: { select: { id: true, name: true, designation: true } } },
  },
  activities: {
    orderBy: { createdAt: "desc" as const },
    include: { author: { select: { id: true, name: true, designation: true } } },
  },
};

export type ListTasksFilters = {
  status?: OpsTaskStatus;
  search?: string;
  assigneeId?: string;
  onlyAssignedToUser?: boolean;
  createdById?: string;
  onlyCreatedByUser?: boolean;
};

export async function listTasks(
  userId: string,
  user: TaskCapabilities,
  filters: ListTasksFilters = {},
) {
  const where: import("@prisma/client").Prisma.OpsTaskWhereInput = {
    AND: [
      tasksWhereForUser(userId, user),
      ...(filters.status ? [{ status: filters.status }] : []),
      ...(filters.onlyAssignedToUser
        ? [{ assigneeId: userId }]
        : filters.assigneeId
          ? [{ assigneeId: filters.assigneeId }]
          : []),
      ...(filters.onlyCreatedByUser
        ? [{ createdById: userId }]
        : filters.createdById
          ? [{ createdById: filters.createdById }]
          : []),
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
    select: taskListSelect,
    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
  });

  return tasks.map(serializeTaskList);
}

export async function getTaskById(taskId: string, userId: string, user: TaskCapabilities) {
  const task = await prisma.opsTask.findUnique({
    where: { id: taskId },
    include: {
      ...taskDetailInclude,
      members: {
        include: { user: { select: { id: true, name: true, designation: true, email: true } } },
      },
    },
  });

  if (!task) return null;
  if (!canAccessTask(task, userId, user)) return null;
  return { ...serializeTask(task), canEdit: canEditTask(task, userId, user) };
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

export async function createTask(
  userId: string,
  user: TaskCapabilities,
  input: CreateTaskInput,
) {
  if (!canCreateTasksForUser(user)) {
    throw new Error("Forbidden");
  }
  if (!canAssignTasksForUser(user) && input.assigneeId && input.assigneeId !== userId) {
    throw new Error("Forbidden");
  }

  const taggedUserIds = (input.taggedUserIds || []).filter((id) => id !== input.assigneeId);
  const assigneeId = input.assigneeId || userId;
  const accessUserIds = Array.from(
    new Set([assigneeId, ...taggedUserIds].filter((value): value is string => Boolean(value))),
  );

  const task = await prisma.opsTask.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: input.status || "TODO",
      priority: input.priority || "MEDIUM",
      dueAt: input.dueAt ? parseDueAtIST(input.dueAt) : null,
      assigneeId,
      createdById: userId,
      members: {
        create: accessUserIds.map((uid) => ({ userId: uid, grantedById: userId })),
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

  await ensureEtaBreachForTask(task.id);
  return serializeTask(task);
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  statusNote?: string;
};

export async function updateTask(
  taskId: string,
  userId: string,
  user: TaskCapabilities,
  input: UpdateTaskInput,
) {
  const existing = await prisma.opsTask.findUnique({
    where: { id: taskId },
    include: { members: true },
  });
  if (!existing) return null;
  if (!canAccessTask(existing, userId, user)) return null;
  const canManageAccess = user.role === "ADMIN" || existing.createdById === userId;
  if (!canAssignTasksForUser(user) && input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
    throw new Error("Forbidden");
  }
  if (!canManageAccess && input.taggedUserIds !== undefined) {
    throw new Error("Forbidden");
  }

  const activities: { authorId: string; message: string }[] = [];

  if (input.status && input.status !== existing.status) {
    const statusNote = input.statusNote?.trim();
    if (!statusNote) {
      throw new Error("A note is required whenever task status changes.");
    }
    activities.push({
      authorId: userId,
      message: `Status changed from ${existing.status} to ${input.status}`,
    });
  }
  if (input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId) {
    activities.push({ authorId: userId, message: "Assignee updated" });
  }

  const nextAssigneeId = input.assigneeId ?? existing.assigneeId;
  const taggedUserIds = input.taggedUserIds
    ? input.taggedUserIds.filter((id) => id !== nextAssigneeId)
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
      const accessUserIds = Array.from(
        new Set(
          [nextAssigneeId, ...taggedUserIds].filter((value): value is string => Boolean(value)),
        ),
      );
      await tx.opsTaskMember.deleteMany({ where: { taskId } });
      if (accessUserIds.length) {
        await tx.opsTaskMember.createMany({
          data: accessUserIds.map((uid) => ({ taskId, userId: uid, grantedById: userId })),
        });
      }
    } else if (
      input.assigneeId !== undefined &&
      input.assigneeId !== existing.assigneeId &&
      input.assigneeId
    ) {
      await tx.opsTaskMember.upsert({
        where: { taskId_userId: { taskId, userId: input.assigneeId } },
        create: { taskId, userId: input.assigneeId, grantedById: userId },
        update: { grantedById: userId },
      });
    }

    if (input.fieldValues?.length) {
      await Promise.all(
        input.fieldValues.map((fv) =>
          tx.opsTaskFieldValue.upsert({
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
          }),
        ),
      );
    }

    if (activities.length) {
      await tx.opsTaskActivity.createMany({ data: activities.map((a) => ({ taskId, ...a })) });
    }

    if (input.status && input.status !== existing.status) {
      await tx.opsTaskNote.create({
        data: {
          taskId,
          authorId: userId,
          body: input.statusNote?.trim() || "",
        },
      });
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
          ? { dueAt: input.dueAt ? parseDueAtIST(input.dueAt) : null }
          : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      },
    });
  });

  await ensureEtaBreachForTask(taskId);
  return getTaskById(taskId, userId, user);
}

export async function cancelTask(
  taskId: string,
  userId: string,
  user: TaskCapabilities,
  statusNote?: string,
) {
  return updateTask(taskId, userId, user, { status: "CANCELLED", statusNote });
}

export async function listTasksGroupedByAssignee() {
  const users = await prisma.opsUser.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      designation: true,
      email: true,
      role: true,
      assignedTasks: {
        select: taskListSelect,
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((u) => ({
    user: { id: u.id, name: u.name, designation: u.designation, email: u.email, role: u.role },
    tasks: u.assignedTasks.map(serializeTaskList),
    counts: {
      total: u.assignedTasks.length,
      completed: u.assignedTasks.filter((t) => t.status === "COMPLETED").length,
      pending: u.assignedTasks.filter(
        (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
      ).length,
    },
  }));
}
