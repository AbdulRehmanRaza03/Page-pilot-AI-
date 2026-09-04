"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronDown,
  Download,
  Globe,
  Inbox,
  Send,
  Target,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const kpis = [
  {
    label: "Total Conversations",
    value: "1,284",
    change: "+23.4%",
    up: true,
    icon: Inbox,
    color: "bg-brand-50 text-brand-600",
  },
  {
    label: "New Leads",
    value: "347",
    change: "+12.1%",
    up: true,
    icon: Users,
    color: "bg-purple-50 text-purple-600",
  },
  {
    label: "Messages Sent",
    value: "8,912",
    change: "-3.2%",
    up: false,
    icon: Send,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Response Rate",
    value: "96.8%",
    change: "+4.6%",
    up: true,
    icon: Target,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Conversion Rate",
    value: "18.2%",
    change: "+2.3%",
    up: true,
    icon: TrendingUp,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Avg. Response Time",
    value: "42s",
    change: "-8.5%",
    up: true,
    icon: Clock,
    color: "bg-rose-50 text-rose-600",
  },
];

const ranges = ["24h", "7d", "30d", "90d", "12m"];

const pages = ["All Pages", "ABC Clothing", "Fit Gear Co", "Tech Haven"];

// Chart data — heights as percentages for the 12 data points
const conversationTrend = [38, 52, 44, 66, 58, 72, 60, 84, 76, 92, 85, 100];
const leadGrowth = [20, 28, 25, 40, 36, 50, 46, 62, 58, 74, 70, 88];
const messageVolume = [55, 42, 68, 50, 76, 62, 88, 70, 80, 92, 74, 96];
const days = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function TrendChart({
  data,
  color = "from-brand-200 to-brand-500",
}: {
  data: number[];
  color?: string;
}) {
  return (
    <div>
      <div className="flex h-52 items-end gap-2">
        {data.map((h, i) => (
          <div key={i} className="group relative flex-1">
            <div
              className={`w-full rounded-t-md bg-gradient-to-t ${color} transition-all duration-200 group-hover:opacity-80`}
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        {days.map((d) => (
          <span key={d} className="flex-1 text-center">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState("30d");
  const [page, setPage] = useState("All Pages");
  const [showPageMenu, setShowPageMenu] = useState(false);

  return (
    <AppShell
      title="Analytics"
      subtitle="Track performance across your connected Facebook Pages."
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  range === r
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:text-navy"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Page filter */}
          <div className="relative">
            <button
              onClick={() => setShowPageMenu((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Globe className="h-4 w-4 text-slate-400" />
              {page}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {showPageMenu && (
              <div className="absolute left-0 top-11 z-10 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-card">
                {pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPage(p);
                      setShowPageMenu(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" className="text-slate-600">
            <Calendar className="h-4 w-4" />
            Custom range
          </Button>
          <Button size="md">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.label}
              className="transition-shadow hover:shadow-card-hover"
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      kpi.up ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {kpi.up ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {kpi.change}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-bold text-navy">{kpi.value}</p>
                <p className="mt-1 text-xs text-slate-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Conversation Trend</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Total conversations over time
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +23.4%
            </span>
          </CardHeader>
          <CardContent>
            <TrendChart data={conversationTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Growth</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500">New leads captured</p>
          </CardHeader>
          <CardContent>
            <TrendChart data={leadGrowth} color="from-emerald-200 to-emerald-500" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500">Messages sent & received</p>
          </CardHeader>
          <CardContent>
            <TrendChart data={messageVolume} color="from-blue-200 to-blue-500" />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500">
              Where your conversations come from
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Facebook Messenger", value: 68, color: "bg-brand-600" },
                { label: "Page Posts & Comments", value: 21, color: "bg-blue-500" },
                { label: "Instagram Direct", value: 11, color: "bg-purple-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-navy">{row.label}</span>
                    <span className="text-slate-500">{row.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${row.color}`}
                      style={{ width: `${row.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
