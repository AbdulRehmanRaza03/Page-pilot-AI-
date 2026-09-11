import { api } from "@/lib/api";
import type { TokenResponse, MeResponse } from "@/types";

// PagePilot is Google-only. Email/password login and registration have been
// removed from the client; account creation happens via Google OAuth.
export const authApi = {
  refresh: (refreshToken: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken }),
  me: () => api.get<MeResponse>("/auth/me"),
  googleStart: () => api.get<{ url: string; state: string }>("/auth/google/start"),
};
