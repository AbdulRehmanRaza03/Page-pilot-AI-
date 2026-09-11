"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Zap, MessagesSquare, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/auth-provider";
import { authApi } from "@/lib/api/auth";

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
        <path d="M12 2 L20 12 L10 20 Z" />
        <path d="M8 6 L14 12 L8 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
    </div>
  );
}

const benefits = [
  {
    icon: Zap,
    title: "Instant automation",
    desc: "Reply to every message in seconds — even while you sleep.",
  },
  {
    icon: MessagesSquare,
    title: "Unified inbox",
    desc: "All your Facebook Pages in one clean, real-time workspace.",
  },
  {
    icon: BarChart3,
    title: "Grow faster",
    desc: "Turn conversations into leads and track real performance.",
  },
];

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

  // If the user is already authenticated, send them to the dashboard.
  if (status === "authenticated") {
    router.replace("/dashboard");
    return null;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Left: brand + benefits */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-12 text-white lg:flex">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -right-16 bottom-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
              <path d="M12 2 L20 12 L10 20 Z" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-semibold tracking-tight">PagePilot</span>
            <span className="block text-[11px] text-blue-200/70">CONNECT • ENGAGE • GROW</span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-[2.75rem]">
            Your Facebook Pages on autopilot.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100/80">
            PagePilot automates every conversation, captures more leads, and turns
            your pages into a 24/7 growth engine — from one beautiful dashboard.
          </p>

          <div className="mt-12 space-y-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{b.title}</p>
                  <p className="mt-0.5 text-sm text-blue-100/70">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-blue-200/60">
          <ShieldCheck className="h-4 w-4" />
          Trusted by growing businesses worldwide
        </div>
      </div>

      {/* Right: sign-in card */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <LogoMark className="lg:hidden" />

          <h2 className="mt-8 text-2xl font-bold tracking-tight text-navy">
            Sign in to PagePilot
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Use your Google account to access your workspace securely.
          </p>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-8 w-full bg-white text-navy shadow-sm hover:bg-slate-50 hover:shadow-md"
            onClick={handleGoogleLogin}
            loading={loading}
            disabled={status === "loading"}
          >
            {!loading && (
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
            )}
            Continue with Google
            {!loading && <ArrowRight className="h-4 w-4 text-slate-400" />}
          </Button>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-medium text-navy">Secure by design</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  We never see or store your Google password. PagePilot uses
                  Google&apos;s official OAuth to keep your data protected.
                </p>
              </div>
            </div>
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
