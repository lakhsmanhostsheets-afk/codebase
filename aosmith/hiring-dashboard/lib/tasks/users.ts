import type { OpsRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/tasks/auth";

export async function listOpsUsers() {
  return prisma.opsUser.findMany({
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
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function listActiveTeamMembers() {
  return prisma.opsUser.findMany({
    where: { isActive: true },
    select: { id: true, name: true, designation: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function createOpsUser(input: {
  email: string;
  name: string;
  designation?: string;
  password: string;
  role: OpsRole;
  canCreateTask?: boolean;
  canAssignTask?: boolean;
  canViewAllTasks?: boolean;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.opsUser.create({
    data: {
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      designation: input.designation?.trim() || null,
      passwordHash,
      role: input.role,
      canCreateTask: input.role === "ADMIN" ? true : (input.canCreateTask ?? true),
      canAssignTask: input.role === "ADMIN" ? true : (input.canAssignTask ?? true),
      canViewAllTasks: input.role === "ADMIN" ? true : (input.canViewAllTasks ?? false),
    },
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
      createdAt: true,
    },
  });
}

export async function deactivateOpsUser(userId: string) {
  return prisma.opsUser.update({
    where: { id: userId },
    data: { isActive: false },
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
}

export async function updateOpsUser(
  userId: string,
  input: {
    name: string;
    designation?: string;
    canCreateTask?: boolean;
    canAssignTask?: boolean;
    canViewAllTasks?: boolean;
  },
) {
  const existing = await prisma.opsUser.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!existing) {
    throw new Error("User not found.");
  }

  return prisma.opsUser.update({
    where: { id: userId },
    data: {
      name: input.name.trim(),
      designation:
        input.designation !== undefined ? (input.designation.trim() || null) : undefined,
      canCreateTask:
        input.canCreateTask !== undefined
          ? existing.role === "ADMIN"
            ? true
            : input.canCreateTask
          : undefined,
      canAssignTask:
        input.canAssignTask !== undefined
          ? existing.role === "ADMIN"
            ? true
            : input.canAssignTask
          : undefined,
      canViewAllTasks:
        input.canViewAllTasks !== undefined
          ? existing.role === "ADMIN"
            ? true
            : input.canViewAllTasks
          : undefined,
    },
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
}
