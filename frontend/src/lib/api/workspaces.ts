import { api } from "@/lib/api";
import type { Workspace } from "@/types";

export type TeamMember = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  role_label: string;
};

export const workspacesApi = {
  list: () =>
    api.get<{ workspaces: Workspace[] }>("/workspaces").then((r) => r.workspaces),
  create: (name: string) => api.post<Workspace>("/workspaces", { name }),
  teamMembers: () => api.get<TeamMember[]>("/workspaces/team/members"),
};
