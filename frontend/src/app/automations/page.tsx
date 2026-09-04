"use client";

import {
  MessageSquare,
  Filter,
  Send,
  UserPlus,
  Tag,
  Clock,
  BellRing,
  Sparkles,
  Pencil,
  Trash2,
  Plus,
  Save,
  Play,
  Rocket,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NodeKind = "trigger" | "condition" | "action";

const automations = [
  { name: "New lead welcome", status: true, lastRun: "2m ago" },
  { name: "Lead follow-up", status: true, lastRun: "18m ago" },
  { name: "Cart recovery", status: false, lastRun: "3d ago" },
  { name: "Review request", status: true, lastRun: "1h ago" },
];

const nodes: {
  kind: NodeKind;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  { kind: "trigger", icon: MessageSquare, title: "New Message", description: "Customer sends a message" },
  { kind: "condition", icon: Filter, title: "Lead Status", description: "Is the sender a hot lead?" },
  { kind: "action", icon: Send, title: "Send Message", description: "Intro with product catalog" },
  { kind: "action", icon: UserPlus, title: "Assign Lead", description: "Route to sales team" },
  { kind: "action", icon: Tag, title: "Add Label", description: "Tag as “Interested”" },
  { kind: "action", icon: Clock, title: "Wait", description: "Delay 24 hours" },
  { kind: "action", icon: BellRing, title: "Notify Team", description: "Ping #sales channel" },
  { kind: "action", icon: Sparkles, title: "AI Response", description: "Automatic smart reply" },
];

const kindStyles: Record<NodeKind, string> = {
  trigger: "border-emerald-200 bg-emerald-50 text-emerald-700",
  condition: "border-amber-200 bg-amber-50 text-amber-700",
  action: "border-brand-200 bg-brand-50 text-brand-700",
};

const kindLabel: Record<NodeKind, string> = {
  trigger: "Trigger",
  condition: "Condition",
  action: "Action",
};

export default function AutomationsPage() {
  return (
    <AppShell title="Automations" subtitle="Design powerful workflows that run on autopilot.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_1fr]">
        {/* Left: automation list */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-navy">Your automations</h3>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" /> New
                </Button>
              </div>
              <ul className="mt-3 divide-y divide-slate-100">
                {automations.map((a, i) => (
                  <li
                    key={a.name}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-3",
                      i === 0 ? "bg-brand-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{a.name}</p>
                      <p className="text-xs text-slate-400">Last run {a.lastRun}</p>
                    </div>
                    <Toggle enabled={a.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 text-sm text-slate-500">
              <p className="flex items-center gap-2 font-medium text-navy">
                <Sparkles className="h-4 w-4 text-brand-600" /> AI suggestions
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                PagePilot noticed 31% of your leads drop off after the first reply. Try adding a
                follow-up step.
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full">
                Apply suggestion
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main: canvas */}
        <Card className="overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-navy">New lead welcome</h3>
              <Badge variant="neutral">Untitled</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4" /> Save
              </Button>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4" /> Test
              </Button>
              <Button size="sm">
                <Rocket className="h-4 w-4" /> Publish
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="bg-slate-50/60 p-8">
            <div className="mx-auto max-w-md">
              {nodes.map((node, i) => {
                const Icon = node.icon;
                return (
                  <div key={i}>
                    <div className="group relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          kindStyles[node.kind]
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-navy">{node.title}</p>
                          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            {kindLabel[node.kind]}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500">{node.description}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {i < nodes.length - 1 && (
                      <div className="flex flex-col items-center py-1">
                        <span className="h-6 w-px bg-slate-300" />
                        <span className="-mt-0.5 rounded-full border border-slate-200 bg-white p-0.5 text-slate-400">
                          <ChevronDown className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add step */}
              <button className="mx-auto mt-2 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-brand-300 hover:text-brand-600">
                <Plus className="h-4 w-4" /> Add step
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
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
