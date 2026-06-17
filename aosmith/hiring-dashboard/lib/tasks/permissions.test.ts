import assert from "node:assert/strict";
import test from "node:test";
import {
  canAssignTasksForUser,
  canCreateTasksForUser,
  canViewAllTasksForUser,
} from "@/lib/tasks/permissions";
import { canAccessTask, tasksWhereForUser } from "@/lib/tasks/visibility";

test("member capabilities honor explicit flags", () => {
  const user = {
    role: "MEMBER" as const,
    canCreateTask: false,
    canAssignTask: true,
    canViewAllTasks: false,
  };

  assert.equal(canCreateTasksForUser(user), false);
  assert.equal(canAssignTasksForUser(user), true);
  assert.equal(canViewAllTasksForUser(user), false);
});

test("admin keeps universal access", () => {
  const user = {
    role: "ADMIN" as const,
    canCreateTask: false,
    canAssignTask: false,
    canViewAllTasks: false,
  };

  assert.equal(canCreateTasksForUser(user), true);
  assert.equal(canAssignTasksForUser(user), true);
  assert.equal(canViewAllTasksForUser(user), true);
  assert.deepEqual(tasksWhereForUser("user-1", user), {});
});

test("non-admin access allows creator, assignee, and explicit members", () => {
  const user = {
    role: "MEMBER" as const,
    canCreateTask: true,
    canAssignTask: true,
    canViewAllTasks: false,
  };

  const task = {
    assigneeId: "assignee-1",
    createdById: "creator-1",
    members: [{ userId: "member-1" }],
  };

  assert.equal(canAccessTask(task, "creator-1", user), true);
  assert.equal(canAccessTask(task, "assignee-1", user), true);
  assert.equal(canAccessTask(task, "member-1", user), true);
  assert.equal(canAccessTask(task, "outsider-1", user), false);
});
