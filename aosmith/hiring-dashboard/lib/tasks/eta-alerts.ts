import { prisma } from "@/lib/prisma";
import type { OpsTaskStatus } from "@prisma/client";
import type { TaskCapabilities } from "@/lib/tasks/permissions";
import { canViewAllTasksForUser } from "@/lib/tasks/permissions";
import { tasksWhereForUser } from "@/lib/tasks/visibility";

const ACTIVE_STATUSES: OpsTaskStatus[] = ["TODO", "IN_PROGRESS"];

type EtaTaskShape = {
  id: string;
  dueAt: Date | null;
  status: string;
  updatedAt: Date;
  etaBreachedAt: Date | null;
};

function shouldMarkEtaBreach(task: EtaTaskShape, now: Date) {
  if (!task.dueAt || task.etaBreachedAt) return false;

  if (task.status === "COMPLETED" || task.status === "CANCELLED") {
    return task.updatedAt.getTime() > task.dueAt.getTime();
  }

  return task.dueAt.getTime() <= now.getTime();
}

export async function ensureEtaBreachForTask(taskId: string) {
  const now = new Date();
  const task = await prisma.opsTask.findUnique({
    where: { id: taskId },
    select: { id: true, dueAt: true, status: true, updatedAt: true, etaBreachedAt: true },
  });
  if (!task || !shouldMarkEtaBreach(task, now)) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const updatedTask = await tx.opsTask.update({
      where: { id: task.id },
      data: { etaBreachedAt: task.dueAt || now },
      select: { id: true, etaBreachedAt: true },
    });

    await tx.opsTaskEtaAlert.upsert({
      where: { taskId: task.id },
      create: {
        taskId: task.id,
        breachedAt: updatedTask.etaBreachedAt || now,
      },
      update: {
        breachedAt: updatedTask.etaBreachedAt || now,
      },
    });

    return updatedTask;
  });
}

export async function scanEtaBreaches() {
  const now = new Date();
  const candidates = await prisma.opsTask.findMany({
    where: {
      dueAt: { not: null },
      etaBreachedAt: null,
    },
    select: {
      id: true,
      dueAt: true,
      status: true,
      updatedAt: true,
      etaBreachedAt: true,
    },
  });

  let created = 0;
  for (const task of candidates) {
    if (!shouldMarkEtaBreach(task, now)) continue;
    const result = await ensureEtaBreachForTask(task.id);
    if (result) created += 1;
  }
  return { scanned: candidates.length, breached: created };
}

const etaAlertInclude = {
  acknowledgedBy: { select: { id: true, name: true, designation: true, email: true } },
  task: {
    select: {
      id: true,
      title: true,
      status: true,
      dueAt: true,
      etaBreachedAt: true,
      assigneeId: true,
      createdById: true,
      assignee: { select: { id: true, name: true, designation: true, email: true } },
      members: { select: { userId: true } },
    },
  },
} as const;

export async function listEtaAlerts() {
  return prisma.opsTaskEtaAlert.findMany({
    include: etaAlertInclude,
    orderBy: [{ acknowledgedAt: "asc" }, { breachedAt: "desc" }],
  });
}

function userRelevantTaskFilter(userId: string) {
  return {
    OR: [
      { assigneeId: userId },
      { createdById: userId },
      { members: { some: { userId } } },
    ],
    status: { in: ACTIVE_STATUSES },
  };
}

export async function listEtaAlertsForUser(userId: string, user: TaskCapabilities) {
  const taskFilter = canViewAllTasksForUser(user)
    ? userRelevantTaskFilter(userId)
    : {
        AND: [tasksWhereForUser(userId, user), { status: { in: ACTIVE_STATUSES } }],
      };

  return prisma.opsTaskEtaAlert.findMany({
    where: { task: taskFilter },
    include: etaAlertInclude,
    orderBy: { breachedAt: "desc" },
  });
}

type EtaAlertRecord = Awaited<ReturnType<typeof listEtaAlertsForUser>>[number];

export function serializeEtaAlert(alert: EtaAlertRecord) {
  return {
    id: alert.id,
    breachedAt: alert.breachedAt.toISOString(),
    createdAt: alert.createdAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: alert.acknowledgedBy,
    task: {
      id: alert.task.id,
      title: alert.task.title,
      status: alert.task.status,
      dueAt: alert.task.dueAt?.toISOString() ?? null,
      etaBreachedAt: alert.task.etaBreachedAt?.toISOString() ?? null,
      assignee: alert.task.assignee,
    },
  };
}

export async function acknowledgeEtaAlert(alertId: string, adminUserId: string) {
  return prisma.opsTaskEtaAlert.update({
    where: { id: alertId },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: adminUserId,
    },
    include: etaAlertInclude,
  });
}
