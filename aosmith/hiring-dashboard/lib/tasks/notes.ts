import { prisma } from "@/lib/prisma";
import { canAccessTask } from "@/lib/tasks/visibility";

export async function listTaskNotes(taskId: string, userId: string, role: "ADMIN" | "MEMBER") {
  const task = await prisma.opsTask.findUnique({
    where: { id: taskId },
    include: { members: true },
  });
  if (!task || !canAccessTask(task, userId, role)) return null;

  const notes = await prisma.opsTaskNote.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function addTaskNote(
  taskId: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
  body: string,
) {
  const task = await prisma.opsTask.findUnique({
    where: { id: taskId },
    include: { members: true },
  });
  if (!task || !canAccessTask(task, userId, role)) return null;

  const note = await prisma.$transaction(async (tx) => {
    const created = await tx.opsTaskNote.create({
      data: { taskId, authorId: userId, body: body.trim() },
      include: { author: { select: { id: true, name: true } } },
    });
    await tx.opsTaskActivity.create({
      data: { taskId, authorId: userId, message: "Note added" },
    });
    return created;
  });

  return { ...note, createdAt: note.createdAt.toISOString() };
}
