"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api/ai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
  data?: any | null;
};

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your PagePilot assistant. I can help you find leads, draft replies, and run campaigns. What would you like to do?",
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    // Capture prior conversation (excluding the welcome message) as history.
    const history = messages
      .filter((m) => m !== WELCOME)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await aiApi.chat(text, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, tool: res.tool, data: res.data },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a reply");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const [confirming, setConfirming] = useState(false);

  const handleConfirmSend = async (message: string) => {
    setConfirming(true);
    try {
      const res = await aiApi.confirmSend(message);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${res.sent} sent, ${res.failed} failed, ${res.skipped} skipped.`,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AppShell title="PagePilot AI" subtitle="Your intelligent business assistant.">
      <div className="mx-auto flex max-w-3xl flex-col" style={{ height: "calc(100vh - 160px)" }}>
        {/* Conversation area */}
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto pr-1">
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <div key={i} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-card">
                    <p className="whitespace-pre-wrap text-sm text-navy">{m.content}</p>
                    {m.data?.contacts && Array.isArray(m.data.contacts) && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="mb-2 text-xs font-semibold text-slate-500">
                          {m.data.contacts.length} contact(s)
                        </p>
                        <ul className="space-y-1.5">
                          {m.data.contacts.slice(0, 10).map((c: any) => (
                            <li key={c.id} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-navy">{c.name}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-500">
                                {c.lead_status}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.tool === "send_campaign" && m.data?.audience !== undefined && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-800">Confirm campaign send</p>
                        <p className="mt-1 text-xs text-amber-700">
                          {m.data.audience} contact(s) will receive this message.
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-amber-700">
                          &quot;{m.data.message}&quot;
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmSend(m.data.message)}
                            loading={confirming}
                            disabled={confirming}
                          >
                            Confirm &amp; Send
                          </Button>
                          <Button size="sm" variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
                  {m.content}
                </div>
              </div>
            )
          )}

          {sending && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="max-w-[85%]">
                <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-card">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </div>

        {/* Input composer */}
        <div className="mt-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-card-hover">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — find leads, draft replies, run campaigns…"
              className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="px-2 text-xs text-slate-400">PagePilot can access your leads &amp; inbox</span>
              <Button
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => void handleSend()}
                disabled={!input.trim() || sending}
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
