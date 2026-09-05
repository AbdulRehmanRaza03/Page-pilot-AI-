import { api } from "@/lib/api";
import type { TokenResponse, User, MeResponse } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { email, password }),
  register: (email: string, password: string, fullName?: string) =>
    api.post<TokenResponse>("/auth/register", {
      email,
      password,
      full_name: fullName,
    }),
  refresh: (refreshToken: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken }),
  me: () => api.get<MeResponse>("/auth/me"),
};
