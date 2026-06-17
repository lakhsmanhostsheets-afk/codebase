"use client";

import { TasksSidebar } from "@/components/tasks/tasks-sidebar";
import { DueTaskAlerts } from "@/components/tasks/due-task-alerts";
import { useEffect, useState } from "react";
import { TasksUserProvider, type TasksUser } from "@/components/tasks/tasks-user-context";

export default function TasksWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TasksUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let active = true;

    void fetch("/api/tasks/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setUser(data.user || null);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (!active) return;
        setLoadingUser(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <TasksUserProvider user={user} loading={loadingUser}>
      <div className="flex h-dvh w-full overflow-hidden bg-slate-50">
        <TasksSidebar />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <DueTaskAlerts />
          {children}
        </div>
      </div>
    </TasksUserProvider>
  );
}
