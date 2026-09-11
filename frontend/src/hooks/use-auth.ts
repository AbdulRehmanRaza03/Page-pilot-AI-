"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStore } from "@/lib/api";
import type { MeResponse } from "@/types";

type AuthState = {
  user: MeResponse | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    status: "loading",
  });

  const loadUser = useCallback(async () => {
    if (!tokenStore.getAccessToken()) {
      setState({ user: null, status: "unauthenticated" });
      return;
    }
    try {
      const me = await authApi.me();
      // Auto-select first workspace.
      const workspaces = me.workspaces ?? [];
      if (workspaces.length > 0 && !tokenStore.getWorkspaceId()) {
        tokenStore.setWorkspaceId(workspaces[0].id);
      }
      setState({ user: me, status: "authenticated" });
    } catch {
      tokenStore.clear();
      setState({ user: null, status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    // Handle OAuth callback tokens from the URL fragment
    // (Google redirects back with #access_token=...&refresh_token=...).
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const access = params.get("access_token");
      const refresh = params.get("refresh_token");
      if (access && refresh) {
        tokenStore.setTokens(access, refresh);
        // Clean the URL.
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
    loadUser();
  }, [loadUser]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ user: null, status: "unauthenticated" });
  }, []);

  return { ...state, logout, reload: loadUser };
}
