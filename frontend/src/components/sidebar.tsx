"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
import { analyticsApi } from "@/lib/api/messaging";
import { useToast } from "@/components/toast";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/inbox", label: "Inbox", icon: Inbox, badge: true },
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
  const router = useRouter();
  const { user, logout } = useAuthContext();
  const { notify } = useToast();
  const [unread, setUnread] = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const prevUnreadRef = useRef(0);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Fetch the real unread count and poll so the badge stays in sync without
  // a page refresh.
  useEffect(() => {
    let active = true;
    const load = () => {
      analyticsApi
        .dashboard()
        .then((d) => {
          if (!active) return;
          const next = d.unread_conversations ?? 0;
          // Show a toast when new unread messages arrive.
          if (next > prevUnreadRef.current) {
            const diff = next - prevUnreadRef.current;
            notify(
              "New message",
              diff === 1 ? "You have 1 new unread message." : `You have ${diff} new unread messages.`
            );
          }
          prevUnreadRef.current = next;
          setUnread(next);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [notify]);

  const name = user?.full_name || user?.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = user?.workspaces?.find((w) => w.id)?.role ?? "Member";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l18-8-3 18-6-4-4 4z" fill="currentColor" stroke="none" opacity="0.9" />
            <path d="M15 13l-1.5 6.5-2.5-4" stroke="currentColor" fill="none" />
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
                      {item.badge && unread > 0 && (
                        <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {unread > 99 ? "99+" : unread}
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
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={name}
              className="h-9 w-9 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-sm font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-navy">{name}</p>
            <p className="truncate text-xs capitalize text-slate-400">{role}</p>
          </div>
        </div>

        {/* Logout button (visible) */}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    {/* Logout confirmation modal */}
    {confirmLogout && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setConfirmLogout(false)}
        />
        <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-navy">Log out of PagePilot?</h3>
          <p className="mt-1.5 text-sm text-slate-500">
            You&apos;ll need to sign in again to access your workspace.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmLogout(false)}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
