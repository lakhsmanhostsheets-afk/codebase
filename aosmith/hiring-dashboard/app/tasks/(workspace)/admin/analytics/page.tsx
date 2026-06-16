"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { UserPieCharts } from "@/components/tasks/user-pie-charts";

type Analytics = {
  perUser: {
    userId: string;
    name: string;
    email: string;
    completed: number;
    pending: number;
    overdue: number;
    total: number;
    pieData: { name: string; value: number; key: string }[];
  }[];
  totals: { completed: number; pending: number; overdue: number; total: number };
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/tasks/admin/analytics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Task Analytics"
        description="Completed vs pending tasks per team member."
      />

      <div className="space-y-6 p-6">
        {loading ? (
          <PageLoader />
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total tasks", value: data.totals.total },
                { label: "Completed", value: data.totals.completed },
                { label: "Pending", value: data.totals.pending },
                { label: "Overdue", value: data.totals.overdue, warn: true },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${card.warn ? "text-red-600" : "text-slate-900"}`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
            <UserPieCharts perUser={data.perUser} />
          </>
        ) : (
          <p className="text-sm text-slate-500">Failed to load analytics.</p>
        )}
      </div>
    </>
  );
}
