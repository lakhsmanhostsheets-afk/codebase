"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { TaskRow } from "@/components/tasks/task-list";
import { useTasksUser } from "@/components/tasks/tasks-user-context";

const SNOOZE_MINUTES = 15;
const SNOOZE_KEY = "tasks:snoozeUntil";
const NOTIFIED_KEY = "tasks:notifiedDue";

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
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(() =>
    readStorage<number | null>(SNOOZE_KEY, null),
  );
  const [notifiedIds, setNotifiedIds] = useState<string[]>(() =>
    readStorage<string[]>(NOTIFIED_KEY, []),
  );
  const [now, setNow] = useState(() => Date.now());

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (user) params.set("assigneeId", user.id);
    const response = await fetch(`/api/tasks?${params.toString()}`);
    const data = await response.json();
    if (response.ok) setTasks(data.tasks || []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTasks();
    const onFocus = () => void loadTasks();
    const onVisible = () => {
      if (!document.hidden) void loadTasks();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadTasks, user]);

  useEffect(() => {
    const onVisibleOrFocus = () => setNow(Date.now());
    const timer = window.setInterval(onVisibleOrFocus, 30000);
    window.addEventListener("focus", onVisibleOrFocus);
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onVisibleOrFocus);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
    };
  }, []);

  const dueTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueAt) return false;
        if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
        return new Date(task.dueAt).getTime() <= now;
      }),
    [now, tasks],
  );

  useEffect(() => {
    if (!("Notification" in window) || !dueTasks.length) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
      return;
    }
    if (Notification.permission !== "granted") return;

    const nextNotified = new Set(notifiedIds);
    let changed = false;
    for (const task of dueTasks) {
      if (nextNotified.has(task.id)) continue;
      new Notification("Task due", {
        body: `${task.title} is due now (${task.dueAt ? new Date(task.dueAt).toLocaleString("en-IN") : ""})`,
      });
      nextNotified.add(task.id);
      changed = true;
    }
    if (changed) {
      const value = Array.from(nextNotified);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifiedIds(value);
      window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(value));
    }
  }, [dueTasks, notifiedIds]);

  const isSnoozed = snoozeUntil !== null && now < snoozeUntil;

  function snooze() {
    const next = Date.now() + SNOOZE_MINUTES * 60 * 1000;
    setSnoozeUntil(next);
    window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(next));
  }

  if (!dueTasks.length || isSnoozed) return null;

  return (
    <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Due task alert</p>
        <button
          type="button"
          onClick={snooze}
          className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800"
        >
          Snooze 15 min
        </button>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {dueTasks.map((task) => (
          <li key={task.id}>
            <Link href={`/tasks/${task.id}`} className="font-medium underline">
              {task.title}
            </Link>{" "}
            ({task.dueAt ? new Date(task.dueAt).toLocaleString("en-IN") : "No due date"})
          </li>
        ))}
      </ul>
    </div>
  );
}
