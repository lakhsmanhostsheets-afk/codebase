import { NextResponse } from "next/server";
import { z } from "zod";
import type { OpsTaskPriority, OpsTaskStatus } from "@prisma/client";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { listTasks, createTask } from "@/lib/tasks/tasks";

const createSchema = z.object({
  title: z.string().min(1),
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

export async function GET(request: Request) {
  try {
    const user = await requireTasksUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as OpsTaskStatus | null;
    const search = searchParams.get("search") || undefined;
    const assigneeId = searchParams.get("assigneeId") || undefined;

    const tasks = await listTasks(user.id, user.role, {
      status: status || undefined,
      search,
      assigneeId,
    });
    return NextResponse.json({ tasks });
  } catch (error) {
    return tasksApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireTasksUser();
    const body = createSchema.parse(await request.json());
    const task = await createTask(user.id, {
      ...body,
      status: body.status as OpsTaskStatus | undefined,
      priority: body.priority as OpsTaskPriority | undefined,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return tasksApiError(error, "Failed to create task.");
  }
}
