"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Globe,
  Plus,
  MoreHorizontal,
  Inbox,
  Loader2,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { facebookApi, type FacebookPage } from "@/lib/api/facebook";

type AvailablePage = {
  page_id: string;
  name: string;
  category: string | null;
  tasks: string[] | null;
};

export default function PagesPage() {
  return (
    <Suspense fallback={null}>
      <PagesContent />
    </Suspense>
  );
}

function PagesContent() {
  const searchParams = useSearchParams();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Page selection modal state
  const [available, setAvailable] = useState<AvailablePage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [picking, setPicking] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (searchParams.get("facebook") === "connected") {
      setError(null);
      loadAvailablePages();
    } else if (searchParams.get("facebook") === "error") {
      setError("Facebook connection failed. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await facebookApi.listPages();
      setPages(data);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePages = async () => {
    setPicking(true);
    try {
      const data = await facebookApi.availablePages();
      setAvailable(data.pages);
      setSelected(new Set());
      setShowPicker(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError("Could not load your Facebook Pages: " + msg);
      setShowPicker(false);
    } finally {
      setPicking(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await facebookApi.oauthStart();
      window.location.href = url;
    } catch {
      setError("Unable to start Facebook connection.");
      setConnecting(false);
    }
  };

  const togglePage = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLinkSelected = async () => {
    setLinking(true);
    try {
      const ids = Array.from(selected);
      for (const id of ids) {
        await facebookApi.connectPage(id);
      }
      setShowPicker(false);
      await loadPages();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to connect selected pages: " + msg);
    } finally {
      setLinking(false);
    }
  };

  const handleDisconnect = async (pageId: string) => {
    try {
      await facebookApi.disconnectPage(pageId);
      await loadPages();
    } catch {
      setError("Failed to disconnect page.");
    }
  };

  const connectedCount = pages.length;

  return (
    <AppShell
      title="Facebook Pages"
      subtitle="Connect and manage the pages PagePilot automates for you."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {loading ? "Loading pages..." : `${connectedCount} page${connectedCount === 1 ? "" : "s"} connected`}
        </p>
        <Button size="md" onClick={handleConnect} disabled={connecting} loading={connecting}>
          {!connecting && <Plus className="h-4 w-4" />}
          Connect Facebook Page
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-900">Your data is protected</p>
          <p className="mt-0.5 text-sm text-brand-800">
            PagePilot connects through Facebook&apos;s official Graph API — never your
            password. You can revoke access at any time.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Globe className="h-7 w-7 text-brand-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-navy">No Facebook Pages connected yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Connect your Facebook account and select the pages you want to manage.
          </p>
          <Button className="mt-5" onClick={handleConnect} loading={connecting}>
            <Plus className="h-4 w-4" />
            Connect Facebook Page
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className="flex flex-col transition-shadow hover:shadow-card-hover">
              <CardContent className="flex flex-1 flex-col pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={page.name}
                      className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-base text-white"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-navy">{page.name}</h3>
                      {page.category && <p className="text-xs text-slate-400">{page.category}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="px-2 text-slate-400" aria-label="More options">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-3">
                  <Badge variant="success">Connected</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Inbox className="h-3.5 w-3.5" />
                    View Inbox
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={() => handleDisconnect(page.page_id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Page selection modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-navy">Select your pages</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose one or more Facebook Pages to connect.
                </p>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 max-h-72 overflow-y-auto space-y-2">
              {picking ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : available.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No Facebook Pages found for your account.
                </p>
              ) : (
                available.map((p) => (
                  <label
                    key={p.page_id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                      selected.has(p.page_id)
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-brand-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(p.page_id)}
                      onChange={() => togglePage(p.page_id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <Avatar
                      name={p.name}
                      className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-sm text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{p.name}</p>
                      {p.category && <p className="truncate text-xs text-slate-400">{p.category}</p>}
                    </div>
                    {selected.has(p.page_id) && <Check className="h-4 w-4 text-brand-600" />}
                  </label>
                ))
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPicker(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={selected.size === 0 || linking}
                loading={linking}
                onClick={handleLinkSelected}
              >
                Connect {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
