import { prisma } from "@/lib/prisma";

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

export async function listEtaAlerts() {
  return prisma.opsTaskEtaAlert.findMany({
    include: {
      acknowledgedBy: { select: { id: true, name: true, designation: true, email: true } },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          etaBreachedAt: true,
          assignee: { select: { id: true, name: true, designation: true, email: true } },
        },
      },
    },
    orderBy: [{ acknowledgedAt: "asc" }, { breachedAt: "desc" }],
  });
}

export async function acknowledgeEtaAlert(alertId: string, adminUserId: string) {
  return prisma.opsTaskEtaAlert.update({
    where: { id: alertId },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedById: adminUserId,
    },
    include: {
      acknowledgedBy: { select: { id: true, name: true, designation: true, email: true } },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          etaBreachedAt: true,
          assignee: { select: { id: true, name: true, designation: true, email: true } },
        },
      },
    },
  });
}
