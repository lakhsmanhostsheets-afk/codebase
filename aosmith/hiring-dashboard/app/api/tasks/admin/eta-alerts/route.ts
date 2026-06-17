import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTasksAdmin } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { acknowledgeEtaAlert, listEtaAlerts } from "@/lib/tasks/eta-alerts";

const acknowledgeSchema = z.object({
  alertId: z.string().min(1),
});

function serializeAlert(alert: Awaited<ReturnType<typeof listEtaAlerts>>[number]) {
  return {
    ...alert,
    breachedAt: alert.breachedAt.toISOString(),
    createdAt: alert.createdAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
    task: {
      ...alert.task,
      dueAt: alert.task.dueAt?.toISOString() ?? null,
      etaBreachedAt: alert.task.etaBreachedAt?.toISOString() ?? null,
    },
  };
}

export async function GET() {
  try {
    await requireTasksAdmin();
    const alerts = await listEtaAlerts();
    return NextResponse.json({ alerts: alerts.map(serializeAlert) });
  } catch (error) {
    return tasksApiError(error, "Failed to load ETA alerts.");
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireTasksAdmin();
    const body = acknowledgeSchema.parse(await request.json());
    const alert = await acknowledgeEtaAlert(body.alertId, admin.id);
    return NextResponse.json({ alert: serializeAlert(alert) });
  } catch (error) {
    return tasksApiError(error, "Failed to update ETA alert.");
  }
}
