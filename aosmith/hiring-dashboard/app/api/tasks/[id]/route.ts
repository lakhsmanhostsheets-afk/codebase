import { NextResponse } from "next/server";
import { z } from "zod";
import type { OpsTaskPriority, OpsTaskStatus } from "@prisma/client";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { getTaskById, updateTask, cancelTask } from "@/lib/tasks/tasks";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueAt: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  taggedUserIds: z.array(z.string()).optional(),
  fieldValues: z
    .array(z.object({ fieldDefinitionId: z.string(), value: z.string() }))
    .optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireTasksUser();
    const { id } = await context.params;
    const task = await getTaskById(id, user.id, user.role);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error) {
    return tasksApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireTasksUser();
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const task = await updateTask(id, user.id, user.role, {
      ...body,
      status: body.status as OpsTaskStatus | undefined,
      priority: body.priority as OpsTaskPriority | undefined,
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error) {
    return tasksApiError(error, "Failed to update task.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireTasksUser();
    const { id } = await context.params;
    const task = await cancelTask(id, user.id, user.role);
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error) {
    return tasksApiError(error, "Failed to cancel task.");
  }
}
