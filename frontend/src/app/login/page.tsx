"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2 L20 12 L10 20 Z" />
        </svg>
      </div>
      <div className="leading-tight">
        <span className="block text-base font-bold text-navy">PagePilot</span>
        <span className="block text-[10px] text-slate-400">
          Connect • Engage • Grow
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Brand panel (left, optional) */}
      <div className="relative hidden flex-1 items-center justify-center lg:flex">
        <div className="relative z-10 max-w-md px-12">
          <Logo />
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-navy">
            Connect<span className="text-brand-600">.</span> Engage
            <span className="text-brand-600">.</span> Grow
            <span className="text-brand-600">.</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">
            Automate every Facebook conversation, capture more leads, and turn
            your pages into a 24/7 growth engine.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "Auto-respond to messages instantly",
              "Turn chats into qualified leads",
              "One dashboard for every page",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-navy">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 L9 17 L4 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative background accents */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        </div>
      </div>

      {/* Form card */}
      <div className="flex w-full items-center justify-center p-6 sm:p-10 lg:flex-1">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Logo className="mb-8 lg:hidden" />

          <h2 className="text-2xl font-bold text-navy">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Sign in to your PagePilot workspace.
          </p>

          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-navy"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-navy"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full bg-white text-navy hover:bg-slate-50"
          >
            <Globe className="h-4 w-4 text-brand-600" />
            Connect with Facebook
          </Button>

          <p className="mt-8 text-center text-sm text-slate-500">
            New to PagePilot?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
