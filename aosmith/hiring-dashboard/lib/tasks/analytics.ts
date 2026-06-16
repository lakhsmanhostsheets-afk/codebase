import { prisma } from "@/lib/prisma";
import { isTaskOverdue } from "@/lib/tasks/auth";

export async function getTasksAnalytics() {
  const users = await prisma.opsUser.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      assignedTasks: {
        select: { status: true, dueAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const perUser = users.map((u) => {
    const completed = u.assignedTasks.filter((t) => t.status === "COMPLETED").length;
    const cancelled = u.assignedTasks.filter((t) => t.status === "CANCELLED").length;
    const active = u.assignedTasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
    );
    const pending = active.length;
    const overdue = active.filter((t) => isTaskOverdue(t.dueAt, t.status)).length;

    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      completed,
      pending,
      cancelled,
      overdue,
      total: u.assignedTasks.length,
      pieData: [
        { name: "Completed", value: completed, key: "completed" },
        { name: "Pending", value: pending, key: "pending" },
      ],
    };
  });

  const totals = perUser.reduce(
    (acc, u) => ({
      completed: acc.completed + u.completed,
      pending: acc.pending + u.pending,
      overdue: acc.overdue + u.overdue,
      total: acc.total + u.total,
    }),
    { completed: 0, pending: 0, overdue: 0, total: 0 },
  );

  return { perUser, totals };
}
