"use client";

import { useState } from "react";
import {
  Layout,
  User,
  Building2,
  Users,
  ShieldCheck,
  Globe,
  Sparkles,
  Bell,
  CreditCard,
  Code2,
  Lock,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const navItems = [
  { label: "General", icon: Layout },
  { label: "Profile", icon: User },
  { label: "Workspace", icon: Building2 },
  { label: "Team", icon: Users },
  { label: "Roles & Permissions", icon: ShieldCheck },
  { label: "Facebook Integration", icon: Globe },
  { label: "AI Settings", icon: Sparkles },
  { label: "Notifications", icon: Bell },
  { label: "Billing", icon: CreditCard },
  { label: "API & Webhooks", icon: Code2 },
  { label: "Security", icon: Lock },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 py-4 sm:grid-cols-3 sm:gap-6">
      <div className="sm:pt-1">
        <label className="text-sm font-medium text-navy">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
        checked ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span
        className={`absolute text-[9px] font-semibold ${
          checked ? "left-1.5 text-white" : "right-1.5 text-slate-500"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState("General");
  const [workspaceName, setWorkspaceName] = useState("Acme Inc.");
  const [workspaceSlug, setWorkspaceSlug] = useState("acme-inc");
  const [timezone, setTimezone] = useState("EST (UTC -5:00)");
  const [language, setLanguage] = useState("English (US)");

  const toggles = [
    { key: "sendWelcome", label: "Send welcome message to new contacts", on: true },
    { key: "autoTag", label: "Auto-tag conversations by intent", on: true },
    { key: "digest", label: "Weekly performance digest email", on: false },
    { key: "typingIndicator", label: "Show typing indicators", on: true },
  ];
  const [toggleState, setToggleState] = useState<Record<string, boolean>>(
    Object.fromEntries(toggles.map((t) => [t.key, t.on]))
  );

  return (
    <AppShell
      title="Settings"
      subtitle="Manage your workspace, integrations, and preferences."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Left nav */}
        <nav className="h-fit rounded-xl border border-slate-200 bg-white p-1.5">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.label;
              return (
                <li key={item.label}>
                  <button
                    onClick={() => setActive(item.label)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                Your workspace name and URL are shown across PagePilot.
              </p>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              <Field label="Workspace name" hint="This is the name your team sees.">
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </Field>
              <Field label="Workspace URL">
                <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                  <span className="flex h-10 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    pagepilot.app/
                  </span>
                  <input
                    value={workspaceSlug}
                    onChange={(e) => setWorkspaceSlug(e.target.value)}
                    className="h-10 w-full px-3 text-sm text-navy placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                Customize how PagePilot behaves across your workspace.
              </p>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              <Field label="Timezone">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option>EST (UTC -5:00)</option>
                  <option>PST (UTC -8:00)</option>
                  <option>GMT (UTC +0:00)</option>
                  <option>CET (UTC +1:00)</option>
                </select>
              </Field>
              <Field label="Language">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option>English (US)</option>
                  <option>English (UK)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automation</CardTitle>
              <p className="mt-0.5 text-sm text-slate-500">
                Fine-tune how PagePilot responds on your behalf.
              </p>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              {toggles.map((t) => (
                <div
                  key={t.key}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-navy">{t.label}</p>
                  </div>
                  <Toggle
                    checked={toggleState[t.key]}
                    onChange={(v) =>
                      setToggleState((prev) => ({ ...prev, [t.key]: v }))
                    }
                    label={t.label}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
