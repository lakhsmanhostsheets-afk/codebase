"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  FileSpreadsheet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const ICONS = {
  "/": LayoutDashboard,
  "/open-positions": Store,
  "/lineups": Users,
  "/import": FileSpreadsheet,
} as const;

export function AppSidebar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-indigo-100 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 text-white">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          AO Smith Hiring
        </p>
        <h1 className="mt-1 text-lg font-bold">Recruitment Hub</h1>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.href];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-start gap-3 rounded-xl px-3 py-3 transition",
                active
                  ? "bg-white text-indigo-900 shadow-md"
                  : "text-indigo-100 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span
                  className={cn(
                    "block text-xs",
                    active ? "text-indigo-600" : "text-indigo-300",
                  )}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-indigo-100 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
