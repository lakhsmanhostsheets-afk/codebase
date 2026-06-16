"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Building2, Users } from "lucide-react";

type OverviewStats = {
  openPositions: number;
  lineups: number;
  stores: number;
};

export function SidebarOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summaryRes, storesRes] = await Promise.all([
          fetch("/api/dashboard/summary"),
          fetch("/api/stores"),
        ]);
        const summary = await summaryRes.json();
        const storesData = await storesRes.json();

        if (!cancelled) {
          setStats({
            openPositions: summary.totals?.openPositionCount ?? 0,
            lineups: summary.totals?.lineUpCount ?? 0,
            stores: storesData.stores?.length ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setStats({ openPositions: 0, lineups: 0, stores: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = [
    { label: "Open positions", value: stats?.openPositions, icon: BarChart3 },
    { label: "In pipeline", value: stats?.lineups, icon: Users },
    { label: "Stores", value: stats?.stores, icon: Building2 },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/90">
          Overview
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.04] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <row.icon className="h-3.5 w-3.5 text-cyan-300/90" />
              <span className="text-[11px] text-indigo-100/85">{row.label}</span>
            </div>
            {loading ? (
              <span className="h-4 w-8 animate-pulse rounded bg-white/10" />
            ) : (
              <span className="font-heading text-sm font-bold tabular-nums text-white">
                {row.value ?? 0}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <Link
          href="/"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-[10px] font-medium text-indigo-100 transition hover:bg-white/10"
        >
          Dashboard
        </Link>
        <Link
          href="/stores"
          className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-center text-[10px] font-medium text-indigo-100 transition hover:bg-white/10"
        >
          Stores
        </Link>
      </div>
    </div>
  );
}
