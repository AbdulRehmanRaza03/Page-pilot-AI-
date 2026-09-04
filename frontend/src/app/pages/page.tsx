"use client";

import { useState } from "react";
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

type Status = "connected" | "attention" | "disconnected" | "expired";

const pages: {
  name: string;
  handle: string;
  status: Status;
  followers: string;
  messages: string;
  lastSynced: string;
  category: string;
}[] = [
  {
    name: "ABC Clothing",
    handle: "abc.clothing",
    status: "connected",
    followers: "48.2K",
    messages: "1,284",
    lastSynced: "2 min ago",
    category: "Apparel & Fashion",
  },
  {
    name: "Fit Gear Co",
    handle: "fitgearco",
    status: "connected",
    followers: "22.7K",
    messages: "856",
    lastSynced: "Just now",
    category: "Sports & Fitness",
  },
  {
    name: "Tech Haven",
    handle: "techhaven.store",
    status: "attention",
    followers: "15.4K",
    messages: "342",
    lastSynced: "3 hours ago",
    category: "Electronics",
  },
  {
    name: "Green Leaf Café",
    handle: "greenleaf.cafe",
    status: "connected",
    followers: "9.8K",
    messages: "210",
    lastSynced: "1 min ago",
    category: "Food & Beverage",
  },
  {
    name: "Luxe Interiors",
    handle: "luxe.interiors",
    status: "expired",
    followers: "31.5K",
    messages: "0",
    lastSynced: "12 days ago",
    category: "Home & Living",
  },
  {
    name: "Daily Muse",
    handle: "daily.muse",
    status: "disconnected",
    followers: "5.1K",
    messages: "0",
    lastSynced: "Never",
    category: "Media",
  },
];

const statusMeta: Record<
  Status,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  connected: { label: "Connected", variant: "success" },
  attention: { label: "Needs Attention", variant: "warning" },
  disconnected: { label: "Disconnected", variant: "muted" },
  expired: { label: "Expired", variant: "danger" },
};

export default function PagesPage() {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => setConnecting(false), 1800);
  };

  return (
    <AppShell
      title="Facebook Pages"
      subtitle="Connect and manage the pages PagePilot automates for you."
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {pages.filter((p) => p.status === "connected").length} of {pages.length}{" "}
          pages connected
        </p>
        <Button size="md" onClick={handleConnect} disabled={connecting}>
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Connect Facebook Page
        </Button>
      </div>

      {/* Trust banner */}
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

      {/* Pages grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => {
          const meta = statusMeta[page.status];
          return (
            <Card
              key={page.name}
              className="flex flex-col transition-shadow hover:shadow-card-hover"
            >
              <CardContent className="flex flex-1 flex-col pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={page.name}
                      className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-base text-white"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-navy">{page.name}</h3>
                      <p className="text-xs text-slate-400">@{page.handle}</p>
                    </div>
                  </div>
                  <button
                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`More options for ${page.name}`}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {page.category}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        Followers
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-navy">
                      {page.followers}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        Messages
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-navy">
                      {page.messages}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase tracking-wide">
                        Synced
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-navy">
                      {page.lastSynced}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {page.status === "connected" || page.status === "attention" ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Inbox className="h-3.5 w-3.5" />
                        View Inbox
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-3.5 w-3.5" />
                        Manage
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-500">
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Inbox className="h-3.5 w-3.5" />
                        View Inbox
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Link2 className="h-3.5 w-3.5" />
                        Reconnect
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Connect CTA card */}
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center transition-all hover:border-brand-300 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {connecting ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">Connect another page</p>
            <p className="mt-1 text-xs text-slate-500">
              Add a Facebook Page to automate its conversations.
            </p>
          </div>
          <span className="text-xs font-medium text-brand-600">+ Add Page</span>
        </button>
      </div>
    </AppShell>
  );
}
