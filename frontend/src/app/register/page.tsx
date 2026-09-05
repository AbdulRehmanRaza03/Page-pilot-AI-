"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/components/auth-provider";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2 L20 12 L10 20 Z" />
        </svg>
      </div>
      <div className="leading-tight">
        <span className="block text-base font-bold text-navy">PagePilot</span>
        <span className="block text-[10px] text-slate-400">Connect • Engage • Grow</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthContext();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, fullName || undefined);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
      <div className="w-full max-w-sm">
        <Logo />
        <h2 className="mt-8 text-2xl font-bold text-navy">Create your account</h2>
        <p className="mt-1.5 text-sm text-slate-500">Get started with PagePilot — it&apos;s free.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-navy">Full name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="password" type="password" autoComplete="new-password" placeholder="8+ characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Create account <ArrowRight className="h-4 w-4" />
          </Button>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
