"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type UserAnalytics = {
  userId: string;
  name: string;
  email: string;
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  pieData: { name: string; value: number; key: string }[];
};

const PIE_COLORS = ["#10b981", "#6366f1"];

export function UserPieCharts({ perUser }: { perUser: UserAnalytics[] }) {
  const withTasks = perUser.filter((u) => u.total > 0);

  if (!withTasks.length) {
    return (
      <p className="text-sm text-slate-500">No assigned tasks yet. Analytics will appear once tasks are created.</p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {withTasks.map((user) => (
        <div key={user.userId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2">
            <h3 className="font-semibold text-slate-900">{user.name}</h3>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={user.pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : "")}
                >
                  {user.pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-slate-600">
            <span>Total: {user.total}</span>
            <span className="text-red-600">Overdue: {user.overdue}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
