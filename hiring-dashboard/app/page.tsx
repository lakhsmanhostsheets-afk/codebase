"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Upload } from "lucide-react";

type Totals = {
  totalCount: number;
  openPositionCount: number;
  lineUpCount: number;
  feedbackAwaited: number;
  rejected: number;
  selected: number;
  shortlisted: number;
  backedOut: number;
  onHold: number;
};

type StateRow = {
  state: string;
  totalCount: number;
  openPositionCount: number;
  stores: number;
  cities: number;
};

type SavedDashboard = {
  id: string;
  name: string;
  filtersJson: string;
  layoutJson: string;
};

const emptyTotals: Totals = {
  totalCount: 0,
  openPositionCount: 0,
  lineUpCount: 0,
  feedbackAwaited: 0,
  rejected: 0,
  selected: 0,
  shortlisted: 0,
  backedOut: 0,
  onHold: 0,
};

const defaultWidgetOrder = ["summary", "chart", "table"];

export default function Home() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [accountName, setAccountName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [states, setStates] = useState<StateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importLog, setImportLog] = useState<string>("");
  const [widgetOrder, setWidgetOrder] = useState<string[]>(defaultWidgetOrder);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
  const [dashboardName, setDashboardName] = useState("City Overview");

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

  async function fetchSummary() {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/summary?${queryString}`);
      if (!response.ok) throw new Error("Failed to load dashboard data.");
      const data = await response.json();
      setTotals(data.totals || emptyTotals);
      setStates(data.states || []);
    } catch (error) {
      setImportLog(error instanceof Error ? error.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDashboards() {
    try {
      const response = await fetch("/api/dashboards");
      if (!response.ok) return;
      const data = await response.json();
      setSavedDashboards(data.dashboards ?? []);
    } catch {
      // no-op
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    setLoading(true);
    setImportLog("Importing workbook...");
    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");
      setImportLog(
        `Imported rows: ${data.rowsImported}/${data.rowsRead}. Errors: ${data.errors?.length ?? 0}`,
      );
      await fetchSummary();
    } catch (error) {
      setImportLog(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function downloadExport(format: "excel" | "pdf") {
    const url = `/api/exports/${format}?${queryString}`;
    window.open(url, "_blank");
  }

  async function saveDashboard() {
    const payload = {
      name: dashboardName,
      filtersJson: JSON.stringify({ state, city, supervisor, accountName, fromDate, toDate }),
      layoutJson: JSON.stringify(widgetOrder),
      widgets: [
        { title: "KPI Summary", widgetType: "summary", configJson: "{}", orderIndex: 0 },
        { title: "State Comparison", widgetType: "chart", configJson: "{}", orderIndex: 1 },
        { title: "State Table", widgetType: "table", configJson: "{}", orderIndex: 2 },
      ],
    };

    const response = await fetch("/api/dashboards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setImportLog(`Dashboard "${dashboardName}" saved.`);
      await fetchDashboards();
    } else {
      setImportLog("Could not save dashboard.");
    }
  }

  function loadSavedDashboard(raw: SavedDashboard) {
    try {
      const filters = JSON.parse(raw.filtersJson) as Record<string, string>;
      const savedLayout = JSON.parse(raw.layoutJson) as string[];
      setState(filters.state || "");
      setCity(filters.city || "");
      setSupervisor(filters.supervisor || "");
      setAccountName(filters.accountName || "");
      setFromDate(filters.fromDate || "");
      setToDate(filters.toDate || "");
      setWidgetOrder(savedLayout);
      setDashboardName(raw.name);
    } catch {
      setImportLog("Failed to load saved dashboard config.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hiring Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Import legacy Excel files, normalize store-level data, and render multi-view dashboards.
        </p>
        </div>
        <button onClick={logout} className="rounded-md border px-3 py-2 text-sm">
          Logout
        </button>
      </header>

      <section className="mb-4 grid gap-3 rounded-lg border p-4 md:grid-cols-3 xl:grid-cols-6">
        <input
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="State"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={supervisor}
          onChange={(e) => setSupervisor(e.target.value)}
          placeholder="Supervisor"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Account"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          type="date"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <input
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          type="date"
          className="h-10 rounded-md border px-3 text-sm"
        />
      </section>

      <section className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={fetchSummary}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {loading ? "Loading..." : "Refresh Dashboard"}
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm">
          <Upload className="h-4 w-4" />
          Import workbook
          <input type="file" accept=".xlsx,.xls,.xlsm" className="hidden" onChange={handleImport} />
        </label>
        <button
          onClick={() => downloadExport("excel")}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </button>
        <button
          onClick={() => downloadExport("pdf")}
          className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
        <input
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          placeholder="Dashboard name"
          className="h-10 rounded-md border px-3 text-sm"
        />
        <button onClick={saveDashboard} className="rounded-md border px-4 py-2 text-sm">
          Save Dashboard
        </button>
        <button onClick={fetchDashboards} className="rounded-md border px-4 py-2 text-sm">
          Reload Saved
        </button>
      </section>

      <section className="mb-4 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
        {importLog || "No import activity yet."}
      </section>

      {savedDashboards.length ? (
        <section className="mb-4 rounded-lg border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Saved Dashboards
          </p>
          <div className="flex flex-wrap gap-2">
            {savedDashboards.map((dash) => (
              <button
                key={dash.id}
                onClick={() => loadSavedDashboard(dash)}
                className="rounded-md border px-3 py-1 text-sm"
              >
                {dash.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Dashboard Builder
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setWidgetOrder(defaultWidgetOrder)}
              className="rounded-md border px-3 py-1 text-xs"
            >
              Reset Layout
            </button>
            <button
              onClick={() => setWidgetOrder((prev) => [prev[1], prev[2], prev[0]])}
              className="rounded-md border px-3 py-1 text-xs"
            >
              Rotate Widgets
            </button>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-12">
          {widgetOrder.includes("summary") ? (
            <div key="summary" className="rounded-md border bg-background p-3 lg:col-span-12">
              <div className="mb-2 text-xs font-medium text-muted-foreground">KPI Summary</div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {Object.entries(totals).map(([key, value]) => (
                <div key={key} className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">{key}</p>
                  <p className="text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            </div>
          ) : null}

          {widgetOrder.includes("chart") ? (
            <div key="chart" className="rounded-md border bg-background p-3 lg:col-span-8">
              <div className="mb-2 text-xs font-medium text-muted-foreground">State Comparison</div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={states}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="state" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalCount" fill="#52525b" />
                  <Bar dataKey="openPositionCount" fill="#18181b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            </div>
          ) : null}

          {widgetOrder.includes("table") ? (
            <div key="table" className="rounded-md border bg-background p-3 lg:col-span-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">State Table</div>
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="sticky top-0 bg-background text-left">
                  <tr className="border-b">
                    <th className="p-2">State</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Open</th>
                    <th className="p-2">Stores</th>
                    <th className="p-2">Cities</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((row) => (
                    <tr key={row.state} className="border-b">
                      <td className="p-2">{row.state}</td>
                      <td className="p-2">{row.totalCount}</td>
                      <td className="p-2">{row.openPositionCount}</td>
                      <td className="p-2">{row.stores}</td>
                      <td className="p-2">{row.cities}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
