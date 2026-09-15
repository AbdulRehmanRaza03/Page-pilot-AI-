"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { workspacesApi, type TeamMember } from "@/lib/api/workspaces";

const roleVariant: Record<string, "neutral" | "info" | "success" | "muted"> = {
  owner: "neutral",
  admin: "info",
  member: "success",
  agent: "muted",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    workspacesApi
      .teamMembers()
      .then((data) => {
        if (active) setMembers(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load team");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="Team & Roles" subtitle="Manage members, roles, and permissions for your workspace.">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Members of your PagePilot workspace.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="py-6 text-center text-sm text-red-600">{error}</p>
          ) : members.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-navy">No team members yet</p>
              <p className="mt-1 text-xs text-slate-500">Members you invite will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{m.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.email}</p>
                  </div>
                  <Badge variant={roleVariant[m.role] ?? "neutral"}>{m.role_label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-600" />
        <p>
          Roles &amp; permissions are enforced at the API layer. The AI assistant respects the same
          permission model for every action it performs.
        </p>
      </div>
    </AppShell>
  );
}
