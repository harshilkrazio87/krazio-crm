"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type ReportSummary = {
  tasksCompleted: number;
  tasksPending: number;
  leadsAdded: number;
  leadsWon: number;
  commissionPaid: number;
};

export type PerUserRow = {
  name: string;
  email: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionPct: number;
  leadsAdded: number;
  meetingsDone: number;
  commissionEarned: number;
};

export type LeadsOverTimeItem = { date: string; count: number };
export type StageItem = { name: string; value: number; color: string };
export type CommissionByPersonItem = { name: string; amount: number };

const STAGE_COLORS = ["#64748b", "#3b82f6", "#f59e0b", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444"];

export function ReportsCharts({
  range,
  summary,
  perUserStats,
  leadsOverTime,
  stageDistribution,
  commissionByPerson,
}: {
  range: string;
  summary: ReportSummary;
  perUserStats: PerUserRow[];
  leadsOverTime: LeadsOverTimeItem[];
  stageDistribution: StageItem[];
  commissionByPerson: CommissionByPersonItem[];
}) {
  const tabs = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
  ];

  const csvContent = useMemo(() => {
    const headers = ["Member", "Tasks Assigned", "Tasks Completed", "Completion %", "Leads Added", "Meetings Done", "Commission Earned"];
    const rows = perUserStats.map(
      (u) =>
        [u.name, u.tasksAssigned, u.tasksCompleted, u.completionPct + "%", u.leadsAdded, u.meetingsDone, u.commissionEarned].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }, [perUserStats]);

  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Summary, charts, and per-user performance. Select a date range.
          </p>
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.value}
              href={`/reports?range=${t.value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${range === t.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
          <p className="text-2xl font-bold">{summary.tasksCompleted}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Tasks Pending</p>
          <p className="text-2xl font-bold">{summary.tasksPending}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Leads Added</p>
          <p className="text-2xl font-bold">{summary.leadsAdded}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-green-500/10 to-green-600/5 p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Leads Won</p>
          <p className="text-2xl font-bold">{summary.leadsWon}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Commission Paid</p>
          <p className="text-2xl font-bold">₹{summary.commissionPaid.toFixed(0)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Tasks Completed by Member</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perUserStats} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasksCompleted" fill="#3b82f6" name="Tasks completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Leads Added Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={leadsOverTime} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Leads added" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Lead Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stageDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stageDistribution.map((_, i) => (
                  <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Commission per Person</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={commissionByPerson} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#22c55e" name="Commission" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Detailed Data</h3>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Member</th>
                <th className="text-right py-2 font-medium">Tasks Assigned</th>
                <th className="text-right py-2 font-medium">Tasks Completed</th>
                <th className="text-right py-2 font-medium">Completion %</th>
                <th className="text-right py-2 font-medium">Leads Added</th>
                <th className="text-right py-2 font-medium">Meetings Done</th>
                <th className="text-right py-2 font-medium">Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              {perUserStats.map((u) => (
                <tr key={u.email} className="border-b last:border-0">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2 text-right">{u.tasksAssigned}</td>
                  <td className="py-2 text-right">{u.tasksCompleted}</td>
                  <td className="py-2 text-right">{u.completionPct}%</td>
                  <td className="py-2 text-right">{u.leadsAdded}</td>
                  <td className="py-2 text-right">{u.meetingsDone}</td>
                  <td className="py-2 text-right">₹{u.commissionEarned.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {perUserStats.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">No data for this range.</p>
          )}
        </div>
      </div>
    </div>
  );
}
