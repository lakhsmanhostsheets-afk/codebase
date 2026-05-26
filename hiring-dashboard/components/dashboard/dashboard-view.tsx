"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KPI_METRICS } from "@/lib/constants";
import { PageLoader } from "@/components/ui/page-loader";
import { inputClassName } from "@/components/ui/form-field";

type Totals = Record<string, number>;
type StateRow = {
  state: string;
  totalCount: number;
  openPositionCount: number;
  stores: number;
  cities: number;
};
type FilterOptions = {
  states: string[];
  cities: string[];
  supervisors: string[];
  accounts: string[];
};

const emptyTotals: Totals = Object.fromEntries(KPI_METRICS.map((m) => [m.key, 0]));

export function DashboardView() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [accountName, setAccountName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [states, setStates] = useState<StateRow[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    states: [],
    cities: [],
    supervisors: [],
    accounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (city) params.set("city", city);
    if (supervisor) params.set("supervisor", supervisor);
    if (accountName) params.set("accountName", accountName);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    return params.toString();
  }, [accountName, city, fromDate, state, supervisor, toDate]);

  const hasData = (totals.totalCount ?? 0) > 0 || states.length > 0;

  async function fetchSummary() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/dashboard/summary?${queryString}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load dashboard.");
      setTotals({ ...emptyTotals, ...(data.totals || {}) });
      setStates(data.states || []);
      if (data.filterOptions) setFilterOptions(data.filterOptions);
      if (!data.totals?.totalCount && !data.states?.length) {
        setMessage("No data for these filters.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  function downloadExport(format: "excel" | "pdf") {
    window.open(`/api/exports/${format}?${queryString}`, "_blank");
  }

  function clearFilters() {
    setState("");
    setCity("");
    setSupervisor("");
    setAccountName("");
    setFromDate("");
    setToDate("");
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSummary();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced filter apply
  }, [queryString]);

  const filteredCities = useMemo(() => {
    if (!state) return filterOptions.cities;
    return filterOptions.cities;
  }, [filterOptions.cities, state]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Hiring summary by state, city, and pipeline status."
        actions={
          <>
            <button
              type="button"
              onClick={fetchSummary}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => downloadExport("excel")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
            <button
              type="button"
              onClick={() => downloadExport("pdf")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </>
        }
      />

      <div className="relative flex-1 space-y-6 p-6">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-start justify-center bg-slate-50/70 pt-24">
            <PageLoader label="Loading dashboard…" />
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filters (auto-apply)
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <select value={state} onChange={(e) => setState(e.target.value)} className={inputClassName}>
              <option value="">All states</option>
              {filterOptions.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClassName}>
              <option value="">All cities</option>
              {filteredCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className={inputClassName}
            >
              <option value="">All supervisors</option>
              {filterOptions.supervisors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={inputClassName}
            >
              <option value="">All accounts</option>
              {filterOptions.accounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <input
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              type="date"
              className={inputClassName}
              title="From date"
            />
            <input
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              type="date"
              className={inputClassName}
              title="To date"
            />
          </div>
        </section>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}{" "}
            {!hasData ? (
              <span className="ml-1">
                <Link href="/open-positions" className="font-semibold underline">
                  Add open position
                </Link>{" "}
                or{" "}
                <Link href="/import" className="font-semibold underline">
                  import Excel
                </Link>
                .
              </span>
            ) : null}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {KPI_METRICS.map((metric) => (
            <div
              key={metric.key}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className={`h-1.5 bg-gradient-to-r ${metric.color}`} />
              <div className="p-4">
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <p className={`font-heading mt-2 text-3xl font-bold ${metric.text}`}>
                  {totals[metric.key] ?? 0}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">State comparison</h2>
            <div className="h-[320px] w-full">
              {states.length ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                  <BarChart data={states} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="state" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalCount" name="Total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="openPositionCount" name="Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No chart data for current filters
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">By state</h2>
            <div className="max-h-[320px] overflow-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-indigo-50 text-left text-xs uppercase text-indigo-800">
                  <tr>
                    <th className="p-2.5">State</th>
                    <th className="p-2.5">Total</th>
                    <th className="p-2.5">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {states.length ? (
                    states.map((row) => (
                      <tr key={row.state} className="border-t border-slate-100 odd:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-800">{row.state}</td>
                        <td className="p-2.5">{row.totalCount}</td>
                        <td className="p-2.5 text-amber-700">{row.openPositionCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500">
                        No rows for filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
