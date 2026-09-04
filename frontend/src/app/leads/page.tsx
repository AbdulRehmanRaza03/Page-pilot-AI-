"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Globe,
  MoreHorizontal,
  Mail,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type LeadStatus = "New" | "Contacted" | "Qualified" | "Interested" | "Converted" | "Lost";

const statusVariant: Record<LeadStatus, "info" | "warning" | "neutral" | "success" | "danger" | "muted"> = {
  New: "info",
  Contacted: "warning",
  Qualified: "neutral",
  Interested: "success",
  Converted: "success",
  Lost: "muted",
};

type Lead = {
  id: string;
  name: string;
  email: string;
  source: string;
  page: string;
  status: LeadStatus;
  lastActivity: string;
  assignedTo: string;
  created: string;
};

const leads: Lead[] = [
  {
    id: "1",
    name: "Maya Johnson",
    email: "maya.j@example.com",
    source: "Facebook",
    page: "Acme Fitness",
    status: "Qualified",
    lastActivity: "2 min ago",
    assignedTo: "Sarah Lee",
    created: "Today",
  },
  {
    id: "2",
    name: "Liam Carter",
    email: "liam.c@example.com",
    source: "Instagram",
    page: "Bloom Interiors",
    status: "Interested",
    lastActivity: "18 min ago",
    assignedTo: "Sarah Lee",
    created: "Today",
  },
  {
    id: "3",
    name: "Sofia Reyes",
    email: "sofia.r@example.com",
    source: "Facebook",
    page: "Acme Fitness",
    status: "New",
    lastActivity: "1 hr ago",
    assignedTo: "Unassigned",
    created: "Today",
  },
  {
    id: "4",
    name: "Noah Williams",
    email: "noah.w@example.com",
    source: "Facebook",
    page: "Bloom Interiors",
    status: "Contacted",
    lastActivity: "3 hr ago",
    assignedTo: "David Kim",
    created: "Yesterday",
  },
  {
    id: "5",
    name: "Emma Thompson",
    email: "emma.t@example.com",
    source: "Instagram",
    page: "Acme Fitness",
    status: "Converted",
    lastActivity: "5 hr ago",
    assignedTo: "David Kim",
    created: "Yesterday",
  },
  {
    id: "6",
    name: "Olivia Brown",
    email: "olivia.b@example.com",
    source: "Facebook",
    page: "Bloom Interiors",
    status: "Lost",
    lastActivity: "1 day ago",
    assignedTo: "Sarah Lee",
    created: "2 days ago",
  },
  {
    id: "7",
    name: "James Wilson",
    email: "james.w@example.com",
    source: "Facebook",
    page: "Acme Fitness",
    status: "Qualified",
    lastActivity: "1 day ago",
    assignedTo: "Unassigned",
    created: "3 days ago",
  },
  {
    id: "8",
    name: "Ava Martinez",
    email: "ava.m@example.com",
    source: "Instagram",
    page: "Bloom Interiors",
    status: "New",
    lastActivity: "2 days ago",
    assignedTo: "David Kim",
    created: "4 days ago",
  },
];

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const filtered = leads.filter((l) => {
    const q = query.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.page.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell title="Leads" subtitle="Track and manage your pipeline">
      <div className="flex flex-col gap-5">
        {/* toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search leads…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="md">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="md">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-5 py-3">
                    <button className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Source
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Page
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Last Activity
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Assigned To
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Created
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} className="h-9 w-9" />
                        <div>
                          <p className="font-medium text-navy">{lead.name}</p>
                          <p className="text-xs text-slate-400">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        {lead.source}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{lead.page}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{lead.lastActivity}</td>
                    <td className="px-5 py-3.5">
                      {lead.assignedTo === "Unassigned" ? (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Avatar name={lead.assignedTo} className="h-6 w-6 text-[10px]" />
                          <span className="text-slate-600">{lead.assignedTo}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{lead.created}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {leads.length} leads
            </p>
            <div className="flex items-center gap-1">
              {["Prev", "1", "2", "Next"].map((p, i) => (
                <button
                  key={i}
                  className={
                    p === "1"
                      ? "flex h-8 items-center rounded-lg bg-brand-600 px-3 text-xs font-medium text-white"
                      : "flex h-8 items-center rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
