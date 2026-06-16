import { NextResponse } from "next/server";
import { requireTasksAdmin } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { getTasksAnalytics } from "@/lib/tasks/analytics";
import { listTasksGroupedByAssignee } from "@/lib/tasks/tasks";

export async function GET(request: Request) {
  try {
    await requireTasksAdmin();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "grouped") {
      const grouped = await listTasksGroupedByAssignee();
      return NextResponse.json({ grouped });
    }

    const analytics = await getTasksAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    return tasksApiError(error);
  }
}
