"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export default function ConversationsPage() {
  return (
    <AppShell title="Conversations" subtitle="Browse and manage all conversations across your pages.">
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
          <MessageSquare className="h-6 w-6 text-brand-600" />
        </div>
        <h3 className="text-lg font-semibold text-navy">Your conversations will appear here</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Once your Facebook Pages are connected, all conversations will be unified here.
        </p>
        <Link href="/inbox" className="mt-5">
          <Button>Go to Inbox</Button>
        </Link>
      </div>
    </AppShell>
  );
}
