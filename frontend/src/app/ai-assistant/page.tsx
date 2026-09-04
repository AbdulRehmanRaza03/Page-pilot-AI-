"use client";

import {
  Sparkles,
  Users,
  Plus,
  Play,
  Lightbulb,
  FileText,
  PenLine,
  Paperclip,
  Mic,
  ArrowUp,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const suggestedPrompts = [
  { icon: Sparkles, label: "Summarize my unread conversations" },
  { icon: PenLine, label: "Draft a professional reply" },
  { icon: Lightbulb, label: "Who should I follow up with today?" },
  { icon: FileText, label: "Write this week's campaign report" },
];

const hotLeads = [
  { name: "Sarah Johnson", page: "ABC Clothing", score: 92 },
  { name: "Mike Chen", page: "Fit Gear Co", score: 88 },
  { name: "Emma Davis", page: "ABC Clothing", score: 81 },
];


export default function AiAssistantPage() {
  return (
    <AppShell title="PagePilot AI" subtitle="Your intelligent business assistant.">
      <div className="mx-auto max-w-3xl">
        {/* Conversation area */}
        <div className="space-y-6">
          {/* AI greeting */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="max-w-[85%]">
              <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-card">
                <p className="text-sm text-navy">
                  Hi! I&apos;m your PagePilot assistant. I can help you find leads, draft replies,
                  and run campaigns. What would you like to do?
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedPrompts.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                    >
                      <Icon className="h-3.5 w-3.5 text-brand-500" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
              Show me today&apos;s hot leads
            </div>
          </div>

          {/* AI response with data */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="max-w-[85%]">
              <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-4 shadow-card">
                <p className="text-sm text-navy">
                  I found <span className="font-semibold text-brand-700">24 hot leads</span> for
                  today — up 8% from yesterday. Here are your top 3:
                </p>

                <div className="mt-3 space-y-2">
                  {hotLeads.map((lead) => (
                    <div
                      key={lead.name}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                    >
                      <Avatar name={lead.name} className="h-8 w-8 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy">{lead.name}</p>
                        <p className="truncate text-xs text-slate-500">{lead.page}</p>
                      </div>
                      <Badge variant="success">Hot · {lead.score}</Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm">
                    <Users className="h-3.5 w-3.5" /> View Leads
                  </Button>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3.5 w-3.5" /> Create Campaign
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Play className="h-3.5 w-3.5" /> Start Follow-up
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* User message 2 */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm text-white shadow-sm">
              Draft a follow-up for Sarah Johnson
            </div>
          </div>

          {/* AI response 2 */}
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="max-w-[85%]">
              <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-4 shadow-card">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <PenLine className="h-3.5 w-3.5 text-brand-500" />
                  Suggested reply
                </div>
                <blockquote className="mt-2 border-l-2 border-brand-200 pl-3 text-sm leading-relaxed text-slate-700">
                  Hi Sarah, thanks for your interest in the Studio Hoodie! I also have it in the
                  Deep Navy you asked about. Would you like me to reserve one for you? 😊
                </blockquote>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Send to Sarah
                  </Button>
                  <Button size="sm" variant="outline">
                    <PenLine className="h-3.5 w-3.5" /> Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested prompts area */}
        <Card className="mt-8">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-navy">Try asking</h3>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestedPrompts.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
                  >
                    <Icon className="h-4 w-4 text-brand-500" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Input composer */}
        <div className="sticky bottom-6 mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-card-hover">
            <textarea
              rows={2}
              placeholder="Ask anything — find leads, draft replies, run campaigns…"
              className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-navy outline-none placeholder:text-slate-400 focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1 px-2">
                <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 px-2">
                <span className="text-xs text-slate-400">PagePilot can access your leads &amp; inbox</span>
                <Button size="sm" className="h-9 w-9 p-0">
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
