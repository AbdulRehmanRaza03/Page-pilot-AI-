"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { RequireAuth } from "@/components/require-auth";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen">
        <Sidebar />
        <div className="lg:pl-64">
          <Topbar title={title} subtitle={subtitle} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
