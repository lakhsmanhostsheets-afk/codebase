import { NextResponse } from "next/server";
import { requireTasksAdmin } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { scanEtaBreaches } from "@/lib/tasks/eta-alerts";

export async function POST() {
  try {
    await requireTasksAdmin();
    const result = await scanEtaBreaches();
    return NextResponse.json(result);
  } catch (error) {
    return tasksApiError(error, "Failed to scan ETA breaches.");
  }
}
