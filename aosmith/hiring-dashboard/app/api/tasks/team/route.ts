import { NextResponse } from "next/server";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { listActiveTeamMembers } from "@/lib/tasks/users";

export async function GET() {
  try {
    await requireTasksUser();
    const team = await listActiveTeamMembers();
    return NextResponse.json({ team });
  } catch (error) {
    return tasksApiError(error);
  }
}
