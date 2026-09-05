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
      if (me.workspaces.length > 0 && !tokenStore.getWorkspaceId()) {
        tokenStore.setWorkspaceId(me.workspaces[0].id);
      }
      setState({ user: me, status: "authenticated" });
    } catch {
      tokenStore.clear();
      setState({ user: null, status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login(email, password);
      tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
      await loadUser();
    },
    [loadUser]
  );

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const tokens = await authApi.register(email, password, fullName);
      tokenStore.setTokens(tokens.access_token, tokens.refresh_token);
      await loadUser();
    },
    [loadUser]
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ user: null, status: "unauthenticated" });
  }, []);

  return { ...state, login, register, logout, reload: loadUser };
}
