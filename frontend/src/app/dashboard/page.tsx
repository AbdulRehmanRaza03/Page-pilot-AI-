"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Inbox,
  Users,
  Send,
  Plus,
  Workflow,
  UserPlus,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const kpis = [
  { label: "Connected Pages", value: "12", change: "+8%", up: true, icon: Globe, color: "bg-blue-50 text-blue-600" },
  { label: "Conversations", value: "1,284", change: "+23%", up: true, icon: Inbox, color: "bg-brand-50 text-brand-600" },
  { label: "Leads", value: "347", change: "+12%", up: true, icon: Users, color: "bg-purple-50 text-purple-600" },
  { label: "Messages Sent", value: "8,912", change: "-3%", up: false, icon: Send, color: "bg-emerald-50 text-emerald-600" },
];

const conversations = [
  { name: "Sarah Johnson", preview: "Hi, do you have this in size M?", time: "2m", unread: true },
  { name: "Mike Chen", preview: "What's the return policy?", time: "18m", unread: true },
  { name: "Emma Davis", preview: "Thanks, I'll take it!", time: "1h", unread: false },
  { name: "Ahmed Ali", preview: "Do you ship internationally?", time: "3h", unread: false },
];

const leads = [
  { name: "John Smith", page: "ABC Clothing", status: "Qualified", score: 92 },
  { name: "Lisa Wang", page: "Fit Gear Co", status: "Interested", score: 78 },
  { name: "David Kim", page: "ABC Clothing", status: "New", score: 45 },
];

const chartBars = [35, 55, 42, 70, 58, 80, 95, 75, 60, 88, 72, 52];

export default function DashboardPage() {
  return (
    <AppShell title="Welcome back 👋" subtitle="Here's what's happening with your pages today.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="transition-shadow hover:shadow-card-hover">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-navy">{kpi.value}</p>
                <p className="mt-1 text-sm text-slate-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Messages over time</CardTitle>
            <div className="flex gap-1 text-xs">
              <button className="rounded-md bg-brand-50 px-2 py-1 font-medium text-brand-700">7d</button>
              <button className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">30d</button>
              <button className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">90d</button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {chartBars.map((h, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-200 to-brand-500 transition-all group-hover:from-brand-300 group-hover:to-brand-600"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4" /> Create Campaign
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Workflow className="h-4 w-4" /> New Automation
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="h-4 w-4" /> Add Contact
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Globe className="h-4 w-4" /> Connect Page
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Conversations</CardTitle>
            <Link href="/inbox" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {conversations.map((c) => (
                <li key={c.name} className="flex items-center gap-3 py-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium text-navy">{c.name}</p>
                      <span className="text-xs text-slate-400">{c.time}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{c.preview}</p>
                  </div>
                  {c.unread && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
            <Link href="/leads" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {leads.map((l) => (
                <li key={l.name} className="flex items-center gap-3 py-3">
                  <Avatar name={l.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{l.name}</p>
                    <p className="truncate text-xs text-slate-500">{l.page}</p>
                  </div>
                  <Badge variant={l.status === "Qualified" ? "success" : l.status === "Interested" ? "info" : "muted"}>
                    {l.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
