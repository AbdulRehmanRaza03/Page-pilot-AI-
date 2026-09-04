"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Globe,
  Mail,
  MoreHorizontal,
  Phone,
  Filter,
  MessageSquare,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Tag = {
  label: string;
  variant: "success" | "warning" | "danger" | "info" | "muted" | "neutral";
};

type Contact = {
  id: string;
  name: string;
  email: string;
  page: string;
  lastInteraction: string;
  tags: Tag[];
};

const contacts: Contact[] = [
  {
    id: "1",
    name: "Maya Johnson",
    email: "maya.j@example.com",
    page: "Acme Fitness",
    lastInteraction: "2 min ago",
    tags: [
      { label: "VIP", variant: "warning" },
      { label: "Newsletter", variant: "info" },
    ],
  },
  {
    id: "2",
    name: "Liam Carter",
    email: "liam.c@example.com",
    page: "Bloom Interiors",
    lastInteraction: "18 min ago",
    tags: [{ label: "Customer", variant: "success" }],
  },
  {
    id: "3",
    name: "Sofia Reyes",
    email: "sofia.r@example.com",
    page: "Acme Fitness",
    lastInteraction: "1 hr ago",
    tags: [{ label: "Lead", variant: "neutral" }],
  },
  {
    id: "4",
    name: "Noah Williams",
    email: "noah.w@example.com",
    page: "Bloom Interiors",
    lastInteraction: "3 hr ago",
    tags: [
      { label: "Wholesale", variant: "info" },
      { label: "VIP", variant: "warning" },
    ],
  },
  {
    id: "5",
    name: "Emma Thompson",
    email: "emma.t@example.com",
    page: "Acme Fitness",
    lastInteraction: "5 hr ago",
    tags: [{ label: "Customer", variant: "success" }],
  },
  {
    id: "6",
    name: "Olivia Brown",
    email: "olivia.b@example.com",
    page: "Bloom Interiors",
    lastInteraction: "1 day ago",
    tags: [{ label: "Newsletter", variant: "info" }],
  },
  {
    id: "7",
    name: "James Wilson",
    email: "james.w@example.com",
    page: "Acme Fitness",
    lastInteraction: "2 days ago",
    tags: [{ label: "Lead", variant: "neutral" }],
  },
  {
    id: "8",
    name: "Ava Martinez",
    email: "ava.m@example.com",
    page: "Bloom Interiors",
    lastInteraction: "3 days ago",
    tags: [
      { label: "Customer", variant: "success" },
      { label: "Newsletter", variant: "info" },
    ],
  },
];

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.page.toLowerCase().includes(q) ||
      c.tags.some((t) => t.label.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell title="Contacts" subtitle="Your audience, organized">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search contacts…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="md">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="md">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={contact.name} className="h-11 w-11" />
                  <div>
                    <p className="font-semibold text-navy">{contact.name}</p>
                    <p className="text-xs text-slate-400">{contact.email}</p>
                  </div>
                </div>
                <button className="text-slate-300 transition-colors hover:text-slate-500">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={tag.label} variant={tag.variant}>
                    {tag.label}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {contact.page}
                  </div>
                  <span className="text-xs text-slate-400">
                    {contact.lastInteraction}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
