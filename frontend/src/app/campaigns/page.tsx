"use client";

import { useEffect, useState } from "react";
import { Plus, Globe, MessageSquare, Trash2, Send, Sparkles } from "lucide-react";
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
  queued: "info",
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

function formatSchedule(date: string | null): string {
  if (!date) return "Send now";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Broadcast form
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [recipientLimit, setRecipientLimit] = useState<string>("all");
  const [customLimit, setCustomLimit] = useState("");
  const [gapSeconds, setGapSeconds] = useState(8);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCampaigns = async () => {
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
      setFormError("Template name and message are required.");
      return;
    }
    // Resolve recipient limit: "all" -> null, or a number.
    let limit: number | null = null;
    if (recipientLimit === "custom") {
      const n = parseInt(customLimit, 10);
      if (Number.isNaN(n) || n < 1) {
        setFormError("Enter a valid number of recipients.");
        return;
      }
      limit = n;
    } else if (recipientLimit !== "all") {
      limit = parseInt(recipientLimit, 10);
    }
    setFormError(null);
    setCreating(true);
    try {
      await campaignsApi.create({
        name: name.trim(),
        message: message.trim(),
        schedule_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
        recipient_limit: limit,
        gap_seconds: gapSeconds,
      });
      setName("");
      setMessage("");
      setScheduleAt("");
      setRecipientLimit("all");
      setCustomLimit("");
      await loadCampaigns();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (c: Campaign) => {
    try {
      const next = !c.enabled;
      await campaignsApi.toggle(c.id, next);
      setCampaigns((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, enabled: next, status: next ? "running" : "paused" } : x))
      );
      // If enabling and no future schedule, trigger send immediately.
      if (next && !c.schedule_at) {
        const summary = await campaignsApi.send(c.id);
        void summary;
        await loadCampaigns();
      }
    } catch {
      /* surface error */
    }
  };

  const handleSendNow = async (c: Campaign) => {
    try {
      await campaignsApi.send(c.id);
      await loadCampaigns();
    } catch {
      /* surface error */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await campaignsApi.remove(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      /* surface error */
    }
  };

  return (
    <AppShell title="Broadcasts" subtitle="Send a template to all your leads, on your schedule.">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Broadcasts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Write one message, send it to every lead in your inbox, one by one.
          </p>
        </div>
      </div>

      {/* Create broadcast form */}
      <Card className="mt-5">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <h3 className="text-base font-semibold text-navy">New broadcast template</h3>
          </div>
          <form onSubmit={handleCreate} className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                placeholder="Template name (e.g. Winter Sale Offer)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                title="Schedule a future send (leave empty to send now)"
              />
            </div>
            <textarea
              rows={3}
              placeholder="Your message template…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Recipients</label>
                <select
                  value={recipientLimit}
                  onChange={(e) => setRecipientLimit(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-navy focus:border-brand-500 focus:outline-none"
                >
                  <option value="all">All leads</option>
                  <option value="5">First 5</option>
                  <option value="10">First 10</option>
                  <option value="50">First 50</option>
                  <option value="custom">Custom…</option>
                </select>
              </div>
              {recipientLimit === "custom" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">How many?</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 25"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Gap between sends (seconds, min 5)</label>
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={gapSeconds}
                  onChange={(e) => setGapSeconds(Math.max(5, parseInt(e.target.value, 10) || 5))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {scheduleAt ? `Will send at ${formatSchedule(new Date(scheduleAt).toISOString())}` : "Sends immediately"} · gap {gapSeconds}s
              </p>
              <Button type="submit" loading={creating}>
                <Plus className="h-4 w-4" /> Create template
              </Button>
            </div>
          </form>
          {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
        </CardContent>
      </Card>

      {/* Campaigns list */}
      <Card className="mt-6 overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-base font-semibold text-navy">All broadcasts</h3>
        </div>

        {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
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
            <p className="mt-2 text-sm font-medium text-navy">No broadcasts yet</p>
            <p className="mt-1 text-xs text-slate-500">Create your first template above.</p>
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
                    {c.message_template || "No template"} · {formatSchedule(c.schedule_at)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={toVariant(c.status)}>{c.status}</Badge>
                    <span className="text-xs text-slate-400">
                      {c.sent_count}/{c.total_count} sent
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendNow(c)}
                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  aria-label={`Send now ${c.name}`}
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(c)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    c.enabled ? "bg-brand-600" : "bg-slate-300"
                  }`}
                  aria-label={`Toggle ${c.name}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      c.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
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
