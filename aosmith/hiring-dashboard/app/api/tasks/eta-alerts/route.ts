import { NextResponse } from "next/server";
import { requireTasksUser } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { listEtaAlertsForUser, scanEtaBreaches, serializeEtaAlert } from "@/lib/tasks/eta-alerts";

export async function GET() {
  try {
    const user = await requireTasksUser();
    await scanEtaBreaches();
    const alerts = await listEtaAlertsForUser(user.id, user);
    return NextResponse.json({ alerts: alerts.map(serializeEtaAlert) });
  } catch (error) {
    return tasksApiError(error, "Failed to load ETA alerts.");
  }
}
