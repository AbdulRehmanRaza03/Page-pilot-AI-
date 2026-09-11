"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api/ai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await aiApi.chat(text);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
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
