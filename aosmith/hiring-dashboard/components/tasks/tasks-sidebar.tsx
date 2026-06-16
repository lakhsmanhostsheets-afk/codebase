"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckSquare,
  ListChecks,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TasksUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
};

const MEMBER_NAV = [
  { href: "/tasks", label: "My Tasks", icon: ListChecks },
  { href: "/tasks/new", label: "New Task", icon: Plus },
] as const;

const ADMIN_NAV = [
  { href: "/tasks/admin", label: "All Tasks", icon: CheckSquare },
  { href: "/tasks/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/tasks/admin/users", label: "Users", icon: Users },
  { href: "/tasks/admin/fields", label: "Custom Fields", icon: Settings },
] as const;

export function TasksSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<TasksUser | null>(null);

  useEffect(() => {
    void fetch("/api/tasks/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    await fetch("/api/tasks/auth/logout", { method: "POST" });
    window.location.href = "/tasks/login";
  }

  const navItems = user?.role === "ADMIN" ? [...MEMBER_NAV, ...ADMIN_NAV] : MEMBER_NAV;

  return (
    <aside className="relative flex h-dvh w-[260px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0f172a] text-white">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 font-bold">
            T
          </div>
          <div>
            <p className="font-heading text-base font-bold">Task Tracker</p>
            <p className="text-xs text-slate-400">Team operations POC</p>
          </div>
        </div>
        {user ? (
          <p className="mt-3 truncate text-xs text-slate-400">
            {user.name} · {user.role === "ADMIN" ? "Admin" : "Member"}
          </p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/tasks" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white text-slate-900"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
