export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const ACCESS_TOKEN_KEY = "pagepilot.access_token";
const REFRESH_TOKEN_KEY = "pagepilot.refresh_token";
const WORKSPACE_KEY = "pagepilot.workspace_id";

export const tokenStore = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
  },
  getWorkspaceId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(WORKSPACE_KEY);
  },
  setWorkspaceId(id: string) {
    localStorage.setItem(WORKSPACE_KEY, id);
  },
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = tokenStore.getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const workspaceId = tokenStore.getWorkspaceId();
  if (workspaceId) headers.set("X-Workspace-Id", workspaceId);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: ApiErrorBody = { code: "unknown", message: res.statusText };
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
