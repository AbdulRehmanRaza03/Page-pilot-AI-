"use client";

import { createContext, useContext } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { MeResponse } from "@/types";

type AuthContextValue = {
  user: MeResponse | null;
  status: "loading" | "authenticated" | "unauthenticated";
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
