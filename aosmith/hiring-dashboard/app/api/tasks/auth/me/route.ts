import { NextResponse } from "next/server";
import { getTasksSessionUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";

export async function GET() {
  try {
    const user = await getTasksSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    return tasksApiError(error);
  }
}
