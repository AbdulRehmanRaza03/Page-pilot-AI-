"use client";

import { useEffect, useState } from "react";
import { Plus, Globe, MessageSquare, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { campaignsApi, type Campaign } from "@/lib/api/campaigns";

type StatusVariant = "success" | "warning" | "info" | "muted" | "danger" | "neutral";

const statusVariant: Record<string, StatusVariant> = {
  draft: "neutral",
  scheduled: "info",
  running: "success",
  active: "success",
  paused: "warning",
  completed: "muted",
  failed: "danger",
};

function toVariant(status: string): StatusVariant {
  return statusVariant[status.toLowerCase()] ?? "neutral";
}

function formatDate(date: string): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [pageId, setPageId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.list();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setFormError("Name and message are required.");
      return;
    }
    setFormError(null);
    setCreating(true);
    try {
      await campaignsApi.create({
        name: name.trim(),
        page_id: pageId.trim() || undefined,
        message: message.trim(),
      });
      setName("");
      setMessage("");
      setPageId("");
      await loadCampaigns();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await campaignsApi.remove(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* could surface an error toast here */
    }
  };

  return (
    <AppShell title="Campaigns" subtitle="Plan, schedule, and track your messenger campaigns.">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reach the right audience at the right moment, automatically.
          </p>
        </div>
      </div>

      {/* Create campaign form */}
      <Card className="mt-5">
        <CardContent className="pt-5">
          <h3 className="text-base font-semibold text-navy">Create campaign</h3>
          <form onSubmit={handleCreate} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Campaign name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="submit" loading={creating}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </form>
          {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
        </CardContent>
      </Card>

      {/* Campaigns list */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h3 className="text-base font-semibold text-navy">All campaigns</h3>
            <p className="text-xs text-slate-500">
              {loading ? "Loading…" : `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {error && (
          <p className="px-5 pt-3 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : !error && campaigns.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-navy">No campaigns yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Create your first campaign above to start reaching your audience.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-50">
            {campaigns.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-slate-50/60">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {c.message_template || "No message template"} · {formatDate(c.created_at)}
                  </p>
                </div>
                <Badge variant={toVariant(c.status)}>{c.status}</Badge>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
