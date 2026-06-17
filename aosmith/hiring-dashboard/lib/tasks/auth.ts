import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { OpsRole, OpsUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TASKS_SESSION_COOKIE } from "@/lib/tasks/constants";
import { createTasksSessionToken, parseTasksSessionToken } from "@/lib/tasks/session";

export type TasksUser = Pick<
  OpsUser,
  | "id"
  | "email"
  | "name"
  | "designation"
  | "role"
  | "isActive"
  | "canCreateTask"
  | "canAssignTask"
  | "canViewAllTasks"
>;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function ensureBootstrapAdmin() {
  const email = (process.env.TASKS_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.TASKS_ADMIN_PASSWORD || "";
  if (!email || !password) return null;

  const passwordHash = await hashPassword(password);

  // POC: always sync env-defined admin so Vercel credential changes take effect.
  return prisma.opsUser.upsert({
    where: { email },
    create: {
      email,
      name: "Tasks Admin",
      passwordHash,
      role: "ADMIN",
      canCreateTask: true,
      canAssignTask: true,
      canViewAllTasks: true,
    },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      canCreateTask: true,
      canAssignTask: true,
      canViewAllTasks: true,
    },
  });
}

export async function setTasksSessionCookie(userId: string) {
  const token = createTasksSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(TASKS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearTasksSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TASKS_SESSION_COOKIE);
}

export async function getTasksSessionUser(): Promise<TasksUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TASKS_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = parseTasksSessionToken(token);
  if (!payload) return null;

  const user = await prisma.opsUser.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      designation: true,
      role: true,
      isActive: true,
      canCreateTask: true,
      canAssignTask: true,
      canViewAllTasks: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export async function requireTasksUser() {
  const user = await getTasksSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireTasksAdmin() {
  const user = await requireTasksUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function authenticateTasksUser(email: string, password: string) {
  await ensureBootstrapAdmin();

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.opsUser.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    designation: user.designation,
    role: user.role as OpsRole,
    isActive: user.isActive,
    canCreateTask: user.canCreateTask,
    canAssignTask: user.canAssignTask,
    canViewAllTasks: user.canViewAllTasks,
  } satisfies TasksUser;
}

export async function changeTasksUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.opsUser.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new Error("User not found.");
  }
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect.");
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.opsUser.update({ where: { id: userId }, data: { passwordHash } });
}

export function isTaskOverdue(dueAt: Date | string | null, status: string) {
  if (!dueAt) return false;
  if (status === "COMPLETED" || status === "CANCELLED") return false;
  return new Date(dueAt).getTime() < Date.now();
}
