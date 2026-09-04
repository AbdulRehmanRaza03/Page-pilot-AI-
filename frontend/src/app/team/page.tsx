"use client";

import { ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const members = [
  { name: "Abdul Rehman", email: "abdul@pagepilot.com", role: "Owner", status: "Active" },
  { name: "Sara Khan", email: "sara@pagepilot.com", role: "Admin", status: "Active" },
  { name: "Ali Raza", email: "ali@pagepilot.com", role: "Member", status: "Active" },
  { name: "Hira Ahmed", email: "hira@pagepilot.com", role: "Agent", status: "Invited" },
];

const roleBadge: Record<string, "neutral" | "info" | "success" | "muted"> = {
  Owner: "neutral",
  Admin: "info",
  Member: "success",
  Agent: "muted",
};

export default function TeamPage() {
  return (
    <AppShell title="Team & Roles" subtitle="Manage members, roles, and permissions for your workspace.">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Invite teammates and control what they can access.</p>
        <Button>
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.email} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
                <Badge variant={roleBadge[m.role]}>{m.role}</Badge>
                <Badge variant={m.status === "Active" ? "success" : "warning"}>{m.status}</Badge>
              </li>
            ))}
          </ul>
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
