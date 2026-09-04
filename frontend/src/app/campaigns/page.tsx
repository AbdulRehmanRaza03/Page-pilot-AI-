"use client";

import {
  Plus,
  Zap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  MoreHorizontal,
  Search,
  ChevronRight,
  Globe,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Status = "Draft" | "Scheduled" | "Running" | "Paused" | "Completed" | "Failed";

const kpis = [
  { label: "Active", value: "4", sub: "Live right now", icon: Zap, color: "bg-brand-50 text-brand-600" },
  { label: "Scheduled", value: "3", sub: "Upcoming sends", icon: Calendar, color: "bg-amber-50 text-amber-600" },
  { label: "Completed", value: "28", sub: "This quarter", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
];

const campaigns: {
  name: string;
  audience: string;
  status: Status;
  sent: string;
  delivered: string;
  read: string;
  ctr: string;
  date: string;
}[] = [
  { name: "Summer Sale Blast", audience: "Warm Leads (1,240)", status: "Running", sent: "1,240", delivered: "1,198", read: "874", ctr: "12.4%", date: "May 14" },
  { name: "Abandoned Cart — 24h", audience: "Cart Added (312)", status: "Scheduled", sent: "—", delivered: "—", read: "—", ctr: "—", date: "May 16" },
  { name: "New Product Teaser", audience: "Engaged Followers (3,905)", status: "Completed", sent: "3,905", delivered: "3,721", read: "2,103", ctr: "9.8%", date: "May 4" },
  { name: "Follow-up — No Reply", audience: "Interested (487)", status: "Paused", sent: "186", delivered: "181", read: "92", ctr: "5.1%", date: "May 10" },
  { name: "VIP Early Access", audience: "Repeat Buyers (203)", status: "Draft", sent: "—", delivered: "—", read: "—", ctr: "—", date: "—" },
  { name: "Win-back Campaign", audience: "Inactive 60d (728)", status: "Failed", sent: "0", delivered: "0", read: "0", ctr: "0%", date: "May 12" },
];

const statusVariant: Record<Status, "success" | "warning" | "info" | "muted" | "danger" | "neutral"> = {
  Draft: "neutral",
  Scheduled: "info",
  Running: "success",
  Paused: "warning",
  Completed: "muted",
  Failed: "danger",
};

const steps = ["Audience", "Message", "Schedule", "Review"];

export default function CampaignsPage() {
  return (
    <AppShell title="Campaigns" subtitle="Plan, schedule, and track your messenger campaigns.">
      {/* Header + KPI row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reach the right audience at the right moment, automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Search className="h-4 w-4" /> Search
          </Button>
          <Button>
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </div>
      </div>

      {/* Multi-step pill hint */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-2.5 text-xs text-brand-700">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Plus className="h-3.5 w-3.5" /> New campaign flow
        </span>
        <span className="hidden text-brand-300 sm:inline">·</span>
        <div className="flex items-center">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-2.5 py-1 font-medium text-brand-700">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                  {i + 1}
                </span>
                {step}
              </span>
              {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-brand-300" />}
            </div>
          ))}
        </div>
        <span className="ml-auto hidden items-center gap-1 text-brand-500 sm:inline-flex">
          6 steps total <ArrowRight className="h-3 w-3" />
        </span>
      </div>

      {/* KPI mini-cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="transition-shadow hover:shadow-card-hover">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-navy">{kpi.value}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <p className="text-sm font-medium text-navy">{kpi.label}</p>
                  <span className="text-xs text-slate-400">· {kpi.sub}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaigns table */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h3 className="text-base font-semibold text-navy">All campaigns</h3>
            <p className="text-xs text-slate-500">6 campaigns · updated just now</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Filter…" className="h-9 w-40 pl-9 sm:w-56" />
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Audience</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Sent</th>
                <th className="px-5 py-3 text-right font-medium">Delivered</th>
                <th className="px-5 py-3 text-right font-medium">Read</th>
                <th className="px-5 py-3 text-right font-medium">CTR</th>
                <th className="px-5 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaigns.map((c) => (
                <tr key={c.name} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Globe className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-navy">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{c.audience}</td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariant[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-600">{c.sent}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{c.delivered}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{c.read}</td>
                  <td className="px-5 py-4 text-right font-medium text-navy">{c.ctr}</td>
                  <td className="px-5 py-4 text-right text-slate-500">{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>Showing 6 of 34 campaigns</span>
          <Button variant="outline" size="sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
