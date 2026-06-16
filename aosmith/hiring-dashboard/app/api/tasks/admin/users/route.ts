import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTasksAdmin } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { createOpsUser, deactivateOpsUser, listOpsUsers } from "@/lib/tasks/users";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function GET() {
  try {
    await requireTasksAdmin();
    const users = await listOpsUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return tasksApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireTasksAdmin();
    const body = createUserSchema.parse(await request.json());
    const user = await createOpsUser(body);
    return NextResponse.json({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
  } catch (error) {
    return tasksApiError(error, "Failed to create user.");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireTasksAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }
    const user = await deactivateOpsUser(userId);
    return NextResponse.json({ user });
  } catch (error) {
    return tasksApiError(error, "Failed to deactivate user.");
  }
}
