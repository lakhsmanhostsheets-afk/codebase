"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Users,
  FileSpreadsheet,
  LogOut,
  Sparkles,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const ICONS = {
  "/": LayoutDashboard,
  "/stores": MapPin,
  "/open-positions": Store,
  "/lineups": Users,
  "/import": FileSpreadsheet,
} as const;

const DECOR_STATS = [
  { label: "Active regions", value: "12+", icon: MapPin },
  { label: "Pipeline health", value: "Live", icon: TrendingUp },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="relative flex h-dvh w-[280px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0b1224] text-white shadow-2xl shadow-indigo-950/40">
      {/* Decorative background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(99,102,241,0.45) 0%, transparent 45%), radial-gradient(circle at 80% 90%, rgba(14,165,233,0.35) 0%, transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -left-16 top-24 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-32 h-40 w-40 rounded-full bg-cyan-400/25 blur-3xl" />

      {/* Brand */}
      <div className="relative z-10 border-b border-white/10 px-6 py-7">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Hiring intelligence
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-500 to-cyan-400 font-bold shadow-lg shadow-indigo-500/30">
            V5
          </div>
          <div>
            <p className="font-heading text-lg font-bold leading-tight tracking-tight">
              V5 Global Solutions
            </p>
            <p className="text-xs text-indigo-200/90">Recruitment Hub</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200/80">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          Smart dashboards · Store-level hiring
        </p>
      </div>

      {/* Decorative stat hooks */}
      <div className="relative z-10 grid grid-cols-2 gap-2 px-4 py-3">
        {DECOR_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm"
          >
            <stat.icon className="mb-1 h-3.5 w-3.5 text-cyan-300" />
            <p className="font-heading text-sm font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-indigo-200/70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-300/60">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.href];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-start gap-3 overflow-hidden rounded-2xl px-3 py-3 transition-all duration-200",
                active
                  ? "bg-white text-slate-900 shadow-lg shadow-indigo-900/20"
                  : "text-indigo-100 hover:bg-white/10 hover:text-white",
              )}
            >
              {active ? (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-cyan-400" />
              ) : null}
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition",
                  active
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                    : "bg-white/10 group-hover:bg-white/15",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span
                  className={cn(
                    "block text-xs",
                    active ? "text-slate-500" : "text-indigo-300/80",
                  )}
                >
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer promo card (visual hook) */}
      <div className="relative z-10 p-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/40 to-cyan-600/20 p-4 backdrop-blur-md">
          <p className="font-heading text-xs font-semibold text-white">Pro tip</p>
          <p className="mt-1 text-[11px] leading-relaxed text-indigo-100/90">
            Import your Excel once, then manage openings and lineups from the menu.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" />
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-indigo-100 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
