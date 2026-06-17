"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTasksUser } from "@/components/tasks/tasks-user-context";
import { formatDateTimeIST } from "@/lib/datetime";
import {
  getEtaSnoozeUntil,
  listenForEtaSnoozeMessages,
  registerEtaNotificationWorker,
  showEtaBreachNotifications,
  snoozeEtaAlerts,
} from "@/lib/client/eta-notifications";

type EtaAlert = {
  id: string;
  breachedAt: string;
  task: {
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    assignee: { id: string; name: string; designation?: string | null } | null;
  };
};

export function DueTaskAlerts() {
  const { user } = useTasksUser();
  const [alerts, setAlerts] = useState<EtaAlert[]>([]);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadAlerts = useCallback(async () => {
    const response = await fetch("/api/tasks/eta-alerts");
    const data = await response.json();
    if (response.ok) setAlerts(data.alerts || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    void registerEtaNotificationWorker();
    void getEtaSnoozeUntil().then(setSnoozeUntil);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAlerts();
    const onFocus = () => void loadAlerts();
    const onVisible = () => {
      if (!document.hidden) void loadAlerts();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadAlerts, user]);

  useEffect(() => {
    return listenForEtaSnoozeMessages((until) => setSnoozeUntil(until));
  }, []);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(() => {
      refresh();
      if (user) void loadAlerts();
    }, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadAlerts, user]);

  useEffect(() => {
    if (!alerts.length || isSnoozed(snoozeUntil, now)) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
      return;
    }
    if (Notification.permission !== "granted") return;

    void showEtaBreachNotifications(
      alerts.map((alert) => ({
        id: alert.id,
        task: {
          id: alert.task.id,
          title: alert.task.title,
          dueAt: alert.task.dueAt ? formatDateTimeIST(alert.task.dueAt) : null,
        },
      })),
    );
  }, [alerts, now, snoozeUntil]);

  const isSnoozedActive = isSnoozed(snoozeUntil, now);

  async function snooze() {
    const until = await snoozeEtaAlerts();
    setSnoozeUntil(until);
  }

  if (!user || !alerts.length || isSnoozedActive) return null;

  return (
    <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">
          ETA breach alert{alerts.length > 1 ? ` (${alerts.length})` : ""}
        </p>
        <button
          type="button"
          onClick={() => void snooze()}
          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800"
        >
          Snooze 15 min
        </button>
      </div>
      <p className="mt-1 text-xs text-amber-800">
        These tasks are past their due time on tasks assigned to you, created by you, or where you are tagged.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <Link href={`/tasks/${alert.task.id}`} className="font-medium underline">
              {alert.task.title}
            </Link>{" "}
            (due {alert.task.dueAt ? formatDateTimeIST(alert.task.dueAt) : "not set"}, breached{" "}
            {formatDateTimeIST(alert.breachedAt)})
          </li>
        ))}
      </ul>
    </div>
  );
}

function isSnoozed(snoozeUntil: number | null, now: number) {
  return snoozeUntil !== null && now < snoozeUntil;
}
