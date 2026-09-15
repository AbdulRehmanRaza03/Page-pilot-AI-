"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Check,
  Inbox,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/auth-provider";
import { authApi } from "@/lib/api/auth";

function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          dark ? "bg-white/10" : "bg-gradient-to-br from-blue-500 to-indigo-600"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2 L20 12 L10 20 Z" />
        </svg>
      </div>
      <div className="leading-tight">
        <span className={`block text-[15px] font-bold tracking-tight ${dark ? "text-white" : "text-navy"}`}>
          PagePilot
        </span>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// A realistic miniature of the PagePilot inbox to tell the product story.
function ProductPreview() {
  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur">
        {/* Window header */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
            <Inbox className="h-3 w-3" /> Inbox
          </span>
        </div>

        <div className="flex">
          {/* Conversation list */}
          <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 p-3">
            {[
              { name: "Sarah", dot: "bg-emerald-500", active: true },
              { name: "Ahmad", dot: "bg-slate-300", active: false },
              { name: "Fatima", dot: "bg-emerald-500", active: false },
            ].map((c) => (
              <div
                key={c.name}
                className={`mb-2 rounded-lg px-2 py-2 ${c.active ? "bg-white shadow-sm ring-1 ring-slate-100" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  <span className="text-xs font-medium text-slate-700">{c.name}</span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {c.active ? "Is this product available?" : "Thanks for the info!"}
                </p>
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div className="flex-1 p-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                S
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Sarah</p>
                <p className="text-[10px] text-emerald-600">Online</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div className="max-w-[85%] rounded-xl rounded-bl-sm bg-slate-100 px-3 py-2 text-[11px] text-slate-700">
                Is this product available?
              </div>
              <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-brand-600 px-3 py-2 text-[11px] text-white">
                Yes! It&apos;s available now. 🎉
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
                <Zap className="h-2.5 w-2.5" /> Automated reply sent
              </div>
            </div>
          </div>
        </div>

        {/* Lead captured footer */}
        <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-700">Lead captured</p>
            <p className="text-[10px] text-slate-400">Sarah · Status: New Lead</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { status } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { url } = await authApi.googleStart();
      window.location.href = url;
    } catch {
      setError("Unable to start Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  if (status === "authenticated") {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: product story */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10">
          <LogoMark dark />
        </div>

        <div className="relative z-10">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-[2.6rem]">
            Turn Facebook conversations into customers.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100/75">
            Connect your Facebook Pages, manage conversations, automate replies,
            and capture leads — all from one workspace.
          </p>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <ProductPreview />
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-blue-200/60">
          <ShieldCheck className="h-4 w-4" />
          Connect · Engage · Grow
        </div>
      </div>

      {/* Right: auth card */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <LogoMark className="lg:hidden" />

          <h2 className="mt-8 text-2xl font-bold tracking-tight text-navy">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your PagePilot workspace.</p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-7 w-full bg-white text-navy shadow-sm hover:bg-slate-50 hover:shadow-md"
            onClick={handleGoogleLogin}
            loading={loading}
            disabled={status === "loading"}
          >
            {!loading && <GoogleIcon />}
            Continue with Google
            {!loading && <ArrowRight className="h-4 w-4 text-slate-400" />}
          </Button>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-xs leading-relaxed text-slate-500">
              Secure authentication powered by Google OAuth. We never store your
              password.
            </p>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
            By continuing, you agree to our{" "}
            <a href="https://page-pilot-ai-website.vercel.app/privacy" className="font-medium text-brand-600 hover:text-brand-700">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="https://page-pilot-ai-website.vercel.app/terms" className="font-medium text-brand-600 hover:text-brand-700">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
