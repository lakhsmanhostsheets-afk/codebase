"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useTasksUser } from "@/components/tasks/tasks-user-context";
import { formatDateTimeIST } from "@/lib/datetime";

const SNOOZE_MINUTES = 15;
const SNOOZE_KEY = "tasks:snoozeUntil";
const NOTIFIED_KEY = "tasks:notifiedEtaBreach";

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

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function DueTaskAlerts() {
  const { user } = useTasksUser();
  const [alerts, setAlerts] = useState<EtaAlert[]>([]);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(() =>
    readStorage<number | null>(SNOOZE_KEY, null),
  );
  const [notifiedIds, setNotifiedIds] = useState<string[]>(() =>
    readStorage<string[]>(NOTIFIED_KEY, []),
  );
  const [now, setNow] = useState(() => Date.now());

  const loadAlerts = useCallback(async () => {
    const response = await fetch("/api/tasks/eta-alerts");
    const data = await response.json();
    if (response.ok) setAlerts(data.alerts || []);
  }, []);

  useEffect(() => {
    if (!user) return;
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
    if (!("Notification" in window) || !alerts.length) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
      return;
    }
    if (Notification.permission !== "granted") return;

    const nextNotified = new Set(notifiedIds);
    let changed = false;
    for (const alert of alerts) {
      if (nextNotified.has(alert.id)) continue;
      new Notification("ETA breached", {
        body: `${alert.task.title} was due at ${alert.task.dueAt ? formatDateTimeIST(alert.task.dueAt) : "unknown time"}`,
      });
      nextNotified.add(alert.id);
      changed = true;
    }
    if (changed) {
      const value = Array.from(nextNotified);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifiedIds(value);
      window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(value));
    }
  }, [alerts, notifiedIds]);

  const isSnoozed = snoozeUntil !== null && now < snoozeUntil;

  function snooze() {
    const next = Date.now() + SNOOZE_MINUTES * 60 * 1000;
    setSnoozeUntil(next);
    window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
  }

  if (!user || !alerts.length || isSnoozed) return null;

  return (
    <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">ETA breach alert</p>
        <button
          type="button"
          onClick={snooze}
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
