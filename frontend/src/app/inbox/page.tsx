"use client";

import { useEffect, useMemo, useState } from "react";
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
  CheckCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  messagingApi,
  type Conversation,
  type Message,
  type Contact,
} from "@/lib/api/messaging";

const filters = [
  { key: "all", label: "All", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "assigned", label: "Assigned to me", icon: UserCheck },
  { key: "starred", label: "Starred", icon: Star },
  { key: "labels", label: "Labels", icon: Tag },
];

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function conversationName(conversation: Conversation, contacts: Contact[]): string {
  const contact = contacts.find((c) => c.id === conversation.contact_id);
  return contact?.name?.trim() || "Customer";
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    const loadConversations = () => {
      setListError(null);
      Promise.all([messagingApi.listConversations(), messagingApi.listContacts()])
        .then(([convs, ctcs]) => {
          if (!active) return;
          setConversations(convs);
          setContacts(ctcs);
          if (convs.length > 0) setActiveId((prev) => prev ?? convs[0].id);
        })
        .catch((err: unknown) => {
          if (!active) return;
          setListError(err instanceof Error ? err.message : "Failed to load conversations");
        })
        .finally(() => {
          if (active) setListLoading(false);
        });
    };

    setListLoading(true);
    loadConversations();

    // Poll for real-time updates (new inbound messages, unread counts).
    const interval = setInterval(loadConversations, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let active = true;
    const loadMessages = () => {
      setMessagesError(null);
      messagingApi
        .listMessages(activeId)
        .then((msgs) => {
          if (!active) return;
          setMessages(msgs);
        })
        .catch((err: unknown) => {
          if (!active) return;
          setMessagesError(err instanceof Error ? err.message : "Failed to load messages");
        })
        .finally(() => {
          if (active) setMessagesLoading(false);
        });
    };

    setMessagesLoading(true);
    loadMessages();

    // Poll the active thread so new replies appear without a reload.
    const interval = setInterval(loadMessages, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeId]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const filteredConversations = useMemo(() => {
    const q = query.toLowerCase().trim();
    return conversations.filter((c) => {
      if (q) {
        const name = conversationName(c, contacts).toLowerCase();
        if (!name.includes(q) && !(c.subject ?? "").toLowerCase().includes(q)) {
          return false;
        }
      }
      switch (filter) {
        case "unread":
          return c.unread_count > 0;
        case "assigned":
          return Boolean(c.assigned_to);
        case "starred":
        case "labels":
          return true;
        default:
          return true;
      }
    });
  }, [conversations, contacts, filter, query]);

  async function handleSend() {
    const text = draft.trim();
    if (!activeId || !text || sending) return;
    setSending(true);
    setDraft("");
    try {
      const sent = await messagingApi.sendMessage(activeId, text);
      setMessages((prev) => [...prev, sent]);
    } catch (err: unknown) {
      setDraft(text);
      setMessagesError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const activeContact = active ? contacts.find((c) => c.id === active.contact_id) ?? null : null;

  return (
    <AppShell title="Inbox" subtitle="Manage all your page conversations in one place">
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        {/* Left: conversation list */}
        <div className="flex w-full flex-col border-r border-slate-200 sm:w-80 lg:w-96">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-navy">Conversations</h2>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search conversations…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
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
            {listError && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-red-600">{listError}</p>
              </div>
            )}

            {listLoading && (
              <div className="space-y-3 px-4 py-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-3.5 w-3/5" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!listLoading && !listError && filteredConversations.length === 0 && (
              <div className="flex h-full items-center justify-center px-4">
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            )}

            {!listLoading &&
              !listError &&
              filteredConversations.map((c) => {
                const name = conversationName(c, contacts);
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors hover:bg-slate-50",
                      activeId === c.id && "bg-brand-50/60 hover:bg-brand-50/60"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar name={name} />
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                          c.unread_count > 0 ? "bg-brand-500" : "bg-slate-300"
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            c.unread_count > 0 ? "font-semibold text-navy" : "font-medium text-navy"
                          )}
                        >
                          {name}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatTimestamp(c.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-slate-500">
                          {c.subject ?? "No messages"}
                        </p>
                        {c.unread_count > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Middle: chat area */}
        <div className="hidden flex-1 flex-col md:flex">
          {active ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={conversationName(active, contacts)} className="h-10 w-10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy">
                        {conversationName(active, contacts)}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Globe className="h-3 w-3" />
                      {active.page_id}
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
                {messagesLoading && (
                  <div className="space-y-4">
                    <div className="flex items-end gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-12 w-64 rounded-2xl" />
                    </div>
                    <div className="flex justify-end">
                      <Skeleton className="h-12 w-56 rounded-2xl" />
                    </div>
                  </div>
                )}

                {!messagesLoading && messagesError && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-red-600">{messagesError}</p>
                  </div>
                )}

                {!messagesLoading && !messagesError && messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-slate-400">No messages yet</p>
                  </div>
                )}

                {!messagesLoading &&
                  !messagesError &&
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[75%] items-end gap-2",
                        msg.direction === "outbound" && "ml-auto justify-end"
                      )}
                    >
                      {msg.direction === "inbound" && (
                        <Avatar name={conversationName(active, contacts)} className="h-7 w-7 shrink-0" />
                      )}
                      <div>
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            msg.direction === "inbound"
                              ? "rounded-bl-md border border-slate-200 bg-white text-navy"
                              : "rounded-br-md bg-brand-600 text-white"
                          )}
                        >
                          {msg.body ?? ""}
                        </div>
                        <div
                          className={cn(
                            "mt-1 flex items-center gap-1 text-[11px] text-slate-400",
                            msg.direction === "outbound" && "justify-end"
                          )}
                        >
                          <span>{formatTimestamp(msg.created_at)}</span>
                          {msg.direction === "outbound" && (
                            <CheckCheck className="h-3.5 w-3.5 text-brand-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
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
                  <Button
                    size="md"
                    className="h-11 w-11 p-0"
                    loading={sending}
                    disabled={!draft.trim()}
                    onClick={handleSend}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-slate-400">Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {/* Right: customer details */}
        <div className="hidden w-72 flex-col border-l border-slate-200 lg:flex">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-navy">Customer details</h3>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {active && activeContact ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    name={activeContact.name ?? "Customer"}
                    src={activeContact.profile_url ?? undefined}
                    className="h-16 w-16 text-lg"
                  />
                  <p className="mt-2 text-sm font-semibold text-navy">
                    {activeContact.name ?? "Customer"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activeContact.last_interaction_at
                      ? `Last active ${formatTimestamp(activeContact.last_interaction_at)}`
                      : "No recent activity"}
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Lead status
                  </p>
                  <Badge variant="neutral">{activeContact.lead_status}</Badge>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Lead score
                  </p>
                  <p className="text-sm font-semibold text-navy">{activeContact.lead_score}</p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Product interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeContact.product_interests?.length ? (
                      activeContact.product_interests.map((p) => (
                        <Badge key={p} variant="muted">
                          {p}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 pt-10 text-center">
                <p className="text-xs text-slate-400">No customer details available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
