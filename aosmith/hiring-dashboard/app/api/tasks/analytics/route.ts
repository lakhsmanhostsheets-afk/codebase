import { NextResponse } from "next/server";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { getTasksAnalytics } from "@/lib/tasks/analytics";

export async function GET() {
  try {
    const user = await requireTasksUser();
    const analytics = await getTasksAnalytics(user.id);
    return NextResponse.json(analytics);
  } catch (error) {
    return tasksApiError(error);
  }
}
