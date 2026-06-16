import { NextResponse } from "next/server";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { listFieldDefinitions } from "@/lib/tasks/fields";

export async function GET() {
  try {
    await requireTasksUser();
    const fields = await listFieldDefinitions(true);
    return NextResponse.json({ fields });
  } catch (error) {
    return tasksApiError(error);
  }
}
