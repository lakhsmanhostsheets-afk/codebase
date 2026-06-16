import type { OpsRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/tasks/auth";

export async function listOpsUsers() {
  return prisma.opsUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function listActiveTeamMembers() {
  return prisma.opsUser.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function createOpsUser(input: {
  email: string;
  name: string;
  password: string;
  role: OpsRole;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.opsUser.create({
    data: {
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash,
      role: input.role,
    },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
}

export async function deactivateOpsUser(userId: string) {
  return prisma.opsUser.update({
    where: { id: userId },
    data: { isActive: false },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
}
