"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Inbox,
  MessagesSquare,
  Users,
  Megaphone,
  Workflow,
  Users2,
  BarChart3,
  Globe,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/components/auth-provider";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inbox", label: "Inbox", icon: Inbox, badge: "12" },
      { href: "/conversations", label: "Conversations", icon: MessagesSquare },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/contacts", label: "Contacts", icon: Users2 },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone },
      { href: "/automations", label: "Automations", icon: Workflow },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/pages", label: "Pages", icon: Globe },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/team", label: "Team & Roles", icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const name = user?.full_name || user?.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = user?.workspaces?.find((w) => w.id)?.role ?? "Member";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
            <path d="M12 2 L20 12 L10 20 Z" />
          </svg>
        </div>
        <div>
          <span className="block text-sm font-bold text-navy leading-tight">PagePilot</span>
          <span className="block text-[10px] text-slate-400 leading-tight">
            Connect • Engage • Grow
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-navy">{name}</p>
            <p className="truncate text-xs capitalize text-slate-400">{role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
