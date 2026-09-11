"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Mail,
  MoreHorizontal,
  Phone,
  Filter,
  MessageSquare,
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

export default function ContactsPage() {
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
        setError(err instanceof Error ? err.message : "Failed to load contacts");
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
    <AppShell title="Contacts" subtitle="Your audience, organized">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search contacts…"
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
              Add Contact
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center shadow-card">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Skeleton className="h-3.5 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-card">
            <p className="text-sm text-slate-400">No contacts yet</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={contact.name ?? "Contact"}
                      src={contact.profile_url ?? undefined}
                      className="h-11 w-11"
                    />
                    <div>
                      <p className="font-semibold text-navy">{contact.name ?? "Contact"}</p>
                      <p className="text-xs text-slate-400">{contact.psid}</p>
                    </div>
                  </div>
                  <button className="text-slate-300 transition-colors hover:text-slate-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant={statusVariant(contact.lead_status)}>
                    {contact.lead_status}
                  </Badge>
                  <Badge variant="muted">Score {contact.lead_score}</Badge>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Last interaction</span>
                    <span className="text-xs text-slate-400">
                      {formatDate(contact.last_interaction_at)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
