"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDateTimeIST } from "@/lib/datetime";

type EtaAlert = {
  id: string;
  breachedAt: string;
  acknowledgedAt: string | null;
  task: {
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    etaBreachedAt: string | null;
    assignee: { id: string; name: string; designation?: string | null; email: string } | null;
  };
};

export function EtaAlertsPanel() {
  const [alerts, setAlerts] = useState<EtaAlert[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    setLoading(true);
    const response = await fetch("/api/tasks/admin/eta-alerts");
    const data = await response.json();
    if (response.ok) {
      setAlerts(data.alerts || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/tasks/admin/eta-alerts")
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok) {
          setAlerts(data.alerts || []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.acknowledgedAt).length,
    [alerts],
  );

  async function acknowledge(alertId: string) {
    const response = await fetch("/api/tasks/admin/eta-alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId }),
    });
    if (response.ok) {
      await loadAlerts();
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading ETA alerts...</p>;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-amber-900">
          ETA breaches {unreadCount ? `(${unreadCount} new)` : ""}
        </p>
        <button
          type="button"
          onClick={() => void loadAlerts()}
          className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs text-amber-800"
        >
          Refresh
        </button>
      </div>

      {!alerts.length ? (
        <p className="mt-2 text-sm text-amber-900">No ETA breaches recorded.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
              <p className="font-medium text-slate-900">
                <Link href={`/tasks/${alert.task.id}`} className="underline">
                  {alert.task.title}
                </Link>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Breached at {formatDateTimeIST(alert.breachedAt)} · Due{" "}
                {alert.task.dueAt ? formatDateTimeIST(alert.task.dueAt) : "Not set"} ·
                Current status {alert.task.status}
              </p>
              {alert.task.assignee ? (
                <p className="mt-1 text-xs text-slate-500">
                  Assignee: {alert.task.assignee.name}
                  {alert.task.assignee.designation ? ` (${alert.task.assignee.designation})` : ""}
                </p>
              ) : null}
              {!alert.acknowledgedAt ? (
                <button
                  type="button"
                  onClick={() => void acknowledge(alert.id)}
                  className="mt-2 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
                >
                  Mark as read
                </button>
              ) : (
                <p className="mt-2 text-xs text-emerald-700">
                  Read on {formatDateTimeIST(alert.acknowledgedAt)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
