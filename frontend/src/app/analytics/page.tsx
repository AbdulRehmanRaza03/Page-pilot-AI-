"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  Inbox,
  Send,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api/messaging";

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

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-card-hover">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-2xl font-bold text-navy">{formatNumber(value)}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsApi.dashboard();
        if (active) setStats(res);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    { label: "Conversations", value: stats?.conversations ?? 0, icon: Inbox, color: "bg-brand-50 text-brand-600" },
    { label: "Contacts", value: stats?.contacts ?? 0, icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Messages", value: stats?.messages ?? 0, icon: Send, color: "bg-emerald-50 text-emerald-600" },
    { label: "New Leads", value: stats?.new_leads ?? 0, icon: Users, color: "bg-amber-50 text-amber-600" },
    { label: "Connected Pages", value: stats?.connected_pages ?? 0, icon: Globe, color: "bg-blue-50 text-blue-600" },
  ];

  const isEmpty =
    !loading &&
    !error &&
    stats !== null &&
    stats.connected_pages === 0 &&
    stats.contacts === 0 &&
    stats.conversations === 0 &&
    stats.unread_conversations === 0 &&
    stats.messages === 0 &&
    stats.campaigns === 0 &&
    stats.new_leads === 0;

  return (
    <AppShell
      title="Analytics"
      subtitle="Track performance across your connected Facebook Pages."
    >
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-5">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-7 w-20" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isEmpty ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500">No analytics data yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
