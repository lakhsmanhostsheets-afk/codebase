import { NextResponse } from "next/server";
import { z } from "zod";
import { requireTasksAdmin } from "@/lib/tasks/auth";
import { tasksApiError } from "@/lib/tasks/api";
import { acknowledgeEtaAlert, listEtaAlerts, serializeEtaAlert } from "@/lib/tasks/eta-alerts";

const acknowledgeSchema = z.object({
  alertId: z.string().min(1),
});

export async function GET() {
  try {
    await requireTasksAdmin();
    const alerts = await listEtaAlerts();
    return NextResponse.json({ alerts: alerts.map(serializeEtaAlert) });
  } catch (error) {
    return tasksApiError(error, "Failed to load ETA alerts.");
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireTasksAdmin();
    const body = acknowledgeSchema.parse(await request.json());
    const alert = await acknowledgeEtaAlert(body.alertId, admin.id);
    return NextResponse.json({ alert: serializeEtaAlert(alert) });
  } catch (error) {
    return tasksApiError(error, "Failed to update ETA alert.");
  }
}
