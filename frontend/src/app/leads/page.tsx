"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
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
import { Skeleton } from "@/components/ui/skeleton";
import { messagingApi, type Contact } from "@/lib/api/messaging";

function statusVariant(
  status: string
): "info" | "warning" | "neutral" | "success" | "danger" | "muted" {
  const s = status.toLowerCase();
  if (s.includes("new")) return "info";
  if (s.includes("contact")) return "warning";
  if (s.includes("qualif")) return "neutral";
  if (s.includes("interest")) return "success";
  if (s.includes("convert")) return "success";
  if (s.includes("lost")) return "muted";
  return "neutral";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LeadsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    messagingApi
      .listContacts()
      .then((data) => {
        if (!active) return;
        setContacts(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load leads");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [contacts, query]);

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
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60">
                  <th className="px-5 py-3">
                    <button className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Score
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Last Interaction
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-5 py-3.5">
                        <Skeleton className="h-3.5 w-8" />
                      </td>
                      <td className="px-5 py-3.5">
                        <Skeleton className="h-3.5 w-24" />
                      </td>
                      <td className="px-5 py-3.5" />
                    </tr>
                  ))}

                {!loading &&
                  !error &&
                  filtered.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={contact.name ?? "Contact"}
                            src={contact.profile_url ?? undefined}
                            className="h-9 w-9"
                          />
                          <div>
                            <p className="font-medium text-navy">{contact.name ?? "Contact"}</p>
                            <p className="text-xs text-slate-400">{contact.psid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusVariant(contact.lead_status)}>
                          {contact.lead_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-navy">{contact.lead_score}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {formatDate(contact.last_interaction_at)}
                      </td>
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

          {error && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-sm text-slate-400">No leads yet</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-400">
              Showing {filtered.length} of {contacts.length} leads
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
