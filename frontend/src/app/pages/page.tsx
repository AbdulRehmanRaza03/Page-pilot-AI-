"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Globe,
  Plus,
  MoreHorizontal,
  Settings,
  Link2,
  Inbox,
  RefreshCw,
  Users,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { facebookApi, type FacebookPage } from "@/lib/api/facebook";

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

  useEffect(() => {
    // Show a toast-like state after OAuth callback redirect.
    if (searchParams.get("facebook") === "connected") {
      setError("Facebook account connected! Now select your pages.");
    } else if (searchParams.get("facebook") === "error") {
      setError("Facebook connection failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await facebookApi.listPages();
      setPages(data);
    } catch {
      // No pages yet — that's fine.
      setPages([]);
    } finally {
      setLoading(false);
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

  const handleDisconnect = async (pageId: string) => {
    try {
      await facebookApi.disconnectPage(pageId);
      await loadPages();
    } catch {
      setError("Failed to disconnect page.");
    }
  };

  return (
    <AppShell
      title="Facebook Pages"
      subtitle="Connect and manage the pages PagePilot automates for you."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {loading ? "Loading pages..." : `${pages.length} page${pages.length === 1 ? "" : "s"} connected`}
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
            PagePilot connects through Facebook&apos;s official Graph API. We only access
            messages, comments, and lead forms — never your password — and you can revoke
            access at any time.
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
            Connect your first Facebook Page to start managing conversations automatically.
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
                      {page.category && (
                        <p className="text-xs text-slate-400">{page.category}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-slate-400"
                    aria-label={`More options for ${page.name}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-3">
                  <Badge variant={page.status === "connected" ? "success" : "muted"}>
                    {page.status}
                  </Badge>
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
    </AppShell>
  );
}
