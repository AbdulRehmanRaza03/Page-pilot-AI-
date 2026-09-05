import { api } from "@/lib/api";
import type { Workspace } from "@/types";

export const workspacesApi = {
  list: () =>
    api.get<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
  create: (name: string) => api.post<Workspace>("/workspaces", { name }),
};
