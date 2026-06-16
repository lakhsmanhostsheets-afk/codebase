import type { OpsRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export function tasksWhereForUser(userId: string, role: OpsRole): Prisma.OpsTaskWhereInput {
  if (role === "ADMIN") return {};

  return {
    OR: [
      { assigneeId: userId },
      { createdById: userId },
      { members: { some: { userId } } },
    ],
  };
}

export function canAccessTask(
  task: { assigneeId: string | null; createdById: string; members: { userId: string }[] },
  userId: string,
  role: OpsRole,
) {
  if (role === "ADMIN") return true;
  if (task.assigneeId === userId) return true;
  if (task.createdById === userId) return true;
  return task.members.some((m) => m.userId === userId);
}
