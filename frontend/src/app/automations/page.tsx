"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles, Trash2, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { automationsApi, type Automation } from "@/lib/api/automations";

function formatDate(date: string): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [replyText, setReplyText] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadAutomations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await automationsApi.list();
      setAutomations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAutomations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setFormError(null);
    setCreating(true);
    try {
      await automationsApi.create({
        name: name.trim(),
        trigger: { type: "trigger", config: { event: "incoming_message" } },
        ...(keyword.trim()
          ? { condition: { type: "condition", config: { kind: "keyword", value: keyword.trim() } } }
          : {}),
        action: {
          type: "action",
          config: {
            kind: "send_message",
            text: replyText.trim() || `Automated reply for "${keyword.trim() || name.trim()}"`,
          },
        },
      });
      setName("");
      setKeyword("");
      setReplyText("");
      await loadAutomations();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create automation");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (a: Automation) => {
    const next = !a.enabled;
    // Optimistic update
    setAutomations((prev) =>
      prev.map((item) => (item.id === a.id ? { ...item, enabled: next } : item))
    );
    try {
      await automationsApi.toggle(a.id, next);
    } catch {
      // Revert on failure
      setAutomations((prev) =>
        prev.map((item) => (item.id === a.id ? { ...item, enabled: a.enabled } : item))
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await automationsApi.remove(id);
      setAutomations((prev) => prev.filter((item) => item.id !== id));
    } catch {
      /* could surface an error toast here */
    }
  };

  return (
    <AppShell title="Automations" subtitle="Design powerful workflows that run on autopilot.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Main: automation list */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-navy">Your automations</h3>
              <span className="text-xs text-slate-500">
                {loading ? "Loading…" : `${automations.length} total`}
              </span>
            </div>

            {error && <p className="pt-3 text-sm text-red-600">{error}</p>}

            {loading ? (
              <div className="mt-3 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !error && automations.length === 0 ? (
              <div className="mt-3 px-2 py-10 text-center">
                <Zap className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-navy">No automations yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Create your first automation to respond automatically.
                </p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {automations.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{a.name}</p>
                      <p className="text-xs text-slate-400">Created {formatDate(a.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={`Delete ${a.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Toggle enabled={a.enabled} onClick={() => handleToggle(a)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right: create form */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
                <Plus className="h-4 w-4 text-brand-600" /> New automation
              </h3>
              <form onSubmit={handleCreate} className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Name</label>
                  <Input
                    placeholder="e.g. Lead follow-up"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Keyword condition</label>
                  <Input
                    placeholder="e.g. pricing"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Reply text</label>
                  <Input
                    placeholder="e.g. Thanks for reaching out!"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <Button type="submit" loading={creating} className="w-full">
                  <Plus className="h-4 w-4" /> Create automation
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 text-sm text-slate-500">
              <p className="flex items-center gap-2 font-medium text-navy">
                <Sparkles className="h-4 w-4 text-brand-600" /> Automations
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                Automations respond automatically when a customer sends a message matching your
                keyword.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        enabled ? "bg-brand-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
