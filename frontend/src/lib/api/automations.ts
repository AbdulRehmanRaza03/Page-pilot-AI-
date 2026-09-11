import { api } from "@/lib/api";

export type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  created_at: string;
};

export type AutomationDetail = Automation & {
  nodes: unknown;
};

export type NodeConfig = {
  type: string;
  config: Record<string, unknown>;
};

export type CreateAutomationInput = {
  name: string;
  trigger: NodeConfig;
  condition?: NodeConfig;
  action: NodeConfig;
};

export const automationsApi = {
  list: () => api.get<Automation[]>("/automations"),
  get: (id: string) => api.get<AutomationDetail>(`/automations/${id}`),
  create: (input: CreateAutomationInput) =>
    api.post<Automation>("/automations", input),
  toggle: (id: string, enabled: boolean) =>
    api.post<{ enabled: boolean }>(`/automations/${id}/toggle`, { enabled }),
  remove: (id: string) => api.delete<void>(`/automations/${id}`),
};
