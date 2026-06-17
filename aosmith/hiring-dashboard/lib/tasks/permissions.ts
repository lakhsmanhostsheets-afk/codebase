import type { OpsRole } from "@prisma/client";

export type TaskCapabilities = {
  role: OpsRole;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canViewAllTasks: boolean;
};

export function canCreateTasksForUser(user: TaskCapabilities) {
  return user.role === "ADMIN" || user.canCreateTask;
}

export function canAssignTasksForUser(user: TaskCapabilities) {
  return user.role === "ADMIN" || user.canAssignTask;
}

export function canViewAllTasksForUser(user: TaskCapabilities) {
  return user.role === "ADMIN" || user.canViewAllTasks;
}
