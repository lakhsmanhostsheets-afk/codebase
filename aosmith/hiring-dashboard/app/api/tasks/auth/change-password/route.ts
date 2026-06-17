import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTasksUser, changeTasksUserPassword } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const user = await requireTasksUser();
    const body = schema.parse(await request.json());
    await changeTasksUserPassword(user.id, body.currentPassword, body.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return tasksApiError(error, "Failed to change password.");
  }
}
