"use client";

import { useState } from "react";
import {
  Search,
  Inbox,
  Mail,
  UserCheck,
  Star,
  Tag,
  Globe,
  Phone,
  Paperclip,
  Smile,
  Send,
  Sparkles,
  MoreVertical,
  Clock,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  name: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  starred: boolean;
  assigned: boolean;
  page: string;
  label: string;
  message: string;
};

const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Maya Johnson",
    preview: "Hi! I'd love to know if you ship to Canada?",
    timestamp: "2m",
    unread: true,
    starred: true,
    assigned: false,
    page: "Acme Fitness",
    label: "shipping",
    message:
      "Hi! I'd love to know if you ship to Canada? I'm looking to order the new running shoes in a size 8.",
  },
  {
    id: "c2",
    name: "Liam Carter",
    preview: "Thanks, that worked perfectly!",
    timestamp: "18m",
    unread: true,
    starred: false,
    assigned: false,
    page: "Acme Fitness",
    label: "support",
    message:
      "Thanks, that worked perfectly! The delivery tracking link finally loaded and I can see it's out for delivery today.",
  },
  {
    id: "c3",
    name: "Sofia Reyes",
    preview: "What are your return policies?",
    timestamp: "1h",
    unread: false,
    starred: false,
    assigned: true,
    page: "Bloom Interiors",
    label: "returns",
    message:
      "What are your return policies? I bought a set of linen curtains last week but the color is slightly off from the photos.",
  },
  {
    id: "c4",
    name: "Noah Williams",
    preview: "Do you have a wholesale catalog?",
    timestamp: "3h",
    unread: false,
    starred: true,
    assigned: true,
    page: "Bloom Interiors",
    label: "wholesale",
    message:
      "Do you have a wholesale catalog? I run a boutique and I'm interested in carrying some of your pieces.",
  },
  {
    id: "c5",
    name: "Emma Thompson",
    preview: "My order #48219 hasn't arrived.",
    timestamp: "5h",
    unread: false,
    starred: false,
    assigned: false,
    page: "Acme Fitness",
    label: "orders",
    message:
      "My order #48219 hasn't arrived yet and it was supposed to be here two days ago. Can you help me track it down?",
  },
  {
    id: "c6",
    name: "Olivia Brown",
    preview: "That's great news, thank you!",
    timestamp: "1d",
    unread: false,
    starred: false,
    assigned: false,
    page: "Bloom Interiors",
    label: "support",
    message:
      "That's great news, thank you! I really appreciate how quickly you resolved the sizing question for me.",
  },
];

const filters = [
  { key: "all", label: "All", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "assigned", label: "Assigned to me", icon: UserCheck },
  { key: "starred", label: "Starred", icon: Star },
  { key: "labels", label: "Labels", icon: Tag },
];

export default function InboxPage() {
  const [activeId, setActiveId] = useState("c1");
  const [filter, setFilter] = useState("all");
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  return (
    <AppShell title="Inbox" subtitle="Manage all your page conversations in one place">
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {/* Left: conversation list */}
        <div className="flex w-full flex-col border-r border-slate-200 sm:w-80 lg:w-96">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-navy">Conversations</h2>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search conversations…" className="pl-9" />
            </div>
            <div className="mt-3 flex gap-1 overflow-x-auto">
              {filters.map((f) => {
                const Icon = f.icon;
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors hover:bg-slate-50",
                  activeId === c.id && "bg-brand-50/60 hover:bg-brand-50/60"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={c.name} />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                      c.unread ? "bg-brand-500" : "bg-slate-300"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        c.unread ? "font-semibold text-navy" : "font-medium text-navy"
                      )}
                    >
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{c.timestamp}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">{c.preview}</p>
                    {c.unread && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                        {conversations.filter((x) => x.unread).length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span className="truncate text-xs text-slate-400">{c.page}</span>
                    {c.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: chat area */}
        <div className="hidden flex-1 flex-col md:flex">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={active.name} className="h-10 w-10" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-navy">{active.name}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Globe className="h-3 w-3" />
                  {active.page}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-5 py-5">
            <div className="flex flex-col items-center">
              <span className="mb-4 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-400">
                Today
              </span>
            </div>

            <div className="flex max-w-[75%] items-end gap-2">
              <Avatar name={active.name} className="h-7 w-7 shrink-0" />
              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy shadow-sm">
                {active.message}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[75%]">
                <div className="rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm text-white shadow-sm">
                  Thanks for reaching out! Let me check that for you right away.
                </div>
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                  <span>11:42 AM</span>
                  <CheckCheck className="h-3.5 w-3.5 text-brand-500" />
                </div>
              </div>
            </div>

            <div className="flex max-w-[75%] items-end gap-2">
              <Avatar name={active.name} className="h-7 w-7 shrink-0" />
              <div>
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy shadow-sm">
                  Perfect, thank you so much for the fast response!
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <span>11:44 AM</span>
                </div>
              </div>
            </div>
          </div>

          {/* composer */}
          <div className="border-t border-slate-200 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI suggestion
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                <textarea
                  rows={1}
                  placeholder="Type a reply…"
                  className="w-full resize-none bg-transparent text-sm text-navy placeholder:text-slate-400 focus:outline-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-[11px] text-slate-400">Enter to send</span>
                </div>
              </div>
              <Button size="md" className="h-11 w-11 p-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: customer details */}
        <div className="hidden w-72 flex-col border-l border-slate-200 lg:flex">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-navy">Customer details</h3>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <div className="flex flex-col items-center text-center">
              <Avatar name={active.name} className="h-16 w-16 text-lg" />
              <p className="mt-2 text-sm font-semibold text-navy">{active.name}</p>
              <p className="text-xs text-slate-400">Customer since Jun 2024</p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Lead status
              </p>
              <Badge variant="info">Qualified</Badge>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Labels
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="neutral">{active.label}</Badge>
                <Badge variant="muted">new</Badge>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Assigned agent
              </p>
              <div className="flex items-center gap-2">
                <Avatar name="Sarah Lee" className="h-7 w-7 text-xs" />
                <div>
                  <p className="text-xs font-medium text-navy">Sarah Lee</p>
                  <p className="text-[11px] text-slate-400">Support</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                Source page
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-navy">{active.page}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Recent activity
              </p>
              <div className="space-y-3">
                {[
                  { icon: MessageSquare, text: "Replied to DM", time: "2 min ago" },
                  { icon: Clock, text: "Opened your message", time: "1 hr ago" },
                  { icon: UserCheck, text: "Became a lead", time: "Yesterday" },
                ].map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <Icon className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                      <div>
                        <p className="text-xs text-navy">{a.text}</p>
                        <p className="text-[11px] text-slate-400">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Notes
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  Interested in the premium running shoe line. Ask about size 8 stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
