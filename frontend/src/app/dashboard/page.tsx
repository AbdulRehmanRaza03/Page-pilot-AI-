"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Inbox,
  Users,
  Send,
  Plus,
  Workflow,
  UserPlus,
  UserPlus as LeadIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi, messagingApi } from "@/lib/api/messaging";
import type { Conversation, Contact } from "@/lib/api/messaging";

type DashboardStats = {
  connected_pages: number;
  contacts: number;
  conversations: number;
  unread_conversations: number;
  messages: number;
  campaigns: number;
  new_leads: number;
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function leadBadgeVariant(leadStatus: string): "success" | "info" | "muted" | "neutral" {
  switch (leadStatus.toLowerCase()) {
    case "qualified":
      return "success";
    case "interested":
      return "info";
    case "new":
      return "neutral";
    default:
      return "muted";
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, convRes, contactsRes] = await Promise.all([
          analyticsApi.dashboard(),
          messagingApi.listConversations(),
          messagingApi.listContacts(),
        ]);
        if (!active) return;
        setStats(statsRes);
        setConversations(convRes);
        setContacts(contactsRes);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const kpiCards = [
    {
      label: "Connected Pages",
      value: stats?.connected_pages ?? 0,
      icon: Globe,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Conversations",
      value: stats?.conversations ?? 0,
      icon: Inbox,
      color: "bg-brand-50 text-brand-600",
    },
    {
      label: "Leads",
      value: stats?.contacts ?? 0,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Messages Sent",
      value: stats?.messages ?? 0,
      icon: Send,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "New Leads",
      value: stats?.new_leads ?? 0,
      icon: LeadIcon,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  if (loading) {
    return (
      <AppShell title="Welcome back 👋" subtitle="Here's what's happening with your pages today.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-8 w-24" />
                <Skeleton className="mt-2 h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Welcome back 👋" subtitle="Here's what's happening with your pages today.">
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="transition-shadow hover:shadow-card-hover">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-navy">{formatNumber(kpi.value)}</p>
                <p className="mt-1 text-sm text-slate-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            {conversations.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No conversations yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {conversations.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    <Avatar name={c.subject ?? "Chat"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-navy">
                          {c.subject ?? "Conversation"}
                        </p>
                        <span className="text-xs text-slate-400">{relativeTime(c.last_message_at)}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{c.status}</p>
                    </div>
                    {c.unread_count > 0 && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Leads</CardTitle>
            <Link href="/leads" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No leads yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {contacts.slice(0, 5).map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <Avatar name={l.name ?? "Anonymous"} src={l.profile_url ?? undefined} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{l.name ?? "Anonymous"}</p>
                      <p className="truncate text-xs text-slate-500">Lead score {l.lead_score}</p>
                    </div>
                    <Badge variant={leadBadgeVariant(l.lead_status)}>
                      {l.lead_status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
