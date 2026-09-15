"use client";

import { useState } from "react";
import { Menu, X, Bell, Search, HelpCircle } from "lucide-react";

function MobileSidebarNav({
  onClose,
}: {
  onClose: () => void;
}) {
  // Import nav items lazily to avoid duplicating the full nav config.
  const navGroups = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/inbox", label: "Inbox" },
        { href: "/conversations", label: "Conversations" },
      ],
    },
    {
      label: "Manage",
      items: [
        { href: "/leads", label: "Leads" },
        { href: "/contacts", label: "Contacts" },
        { href: "/campaigns", label: "Campaigns" },
        { href: "/automations", label: "Automations" },
      ],
    },
    {
      label: "Insights",
      items: [
        { href: "/ai-assistant", label: "AI Assistant" },
        { href: "/analytics", label: "Analytics" },
        { href: "/pages", label: "Pages" },
      ],
    },
    {
      label: "Workspace",
      items: [
        { href: "/settings", label: "Settings" },
        { href: "/team", label: "Team & Roles" },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white px-4 py-5">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
              <path d="M12 2 L20 12 L10 20 Z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-navy">PagePilot</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="mb-5">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={onClose}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-navy"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
        <button
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-navy">{title}</h1>
          {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <HelpCircle className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-sm font-semibold text-white">
          AR
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] shadow-xl">
            <MobileSidebarNav onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
