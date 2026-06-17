import type { Prisma } from "@prisma/client";
import { canViewAllTasksForUser, type TaskCapabilities } from "@/lib/tasks/permissions";

export function tasksWhereForUser(userId: string, user: TaskCapabilities): Prisma.OpsTaskWhereInput {
  if (canViewAllTasksForUser(user)) return {};

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
  user: TaskCapabilities,
) {
  if (canViewAllTasksForUser(user)) return true;
  if (task.assigneeId === userId) return true;
  if (task.createdById === userId) return true;
  return task.members.some((m) => m.userId === userId);
}
