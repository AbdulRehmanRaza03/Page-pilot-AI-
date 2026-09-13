import { api } from "@/lib/api";

export type Campaign = {
  id: string;
  name: string;
  status: string;
  message_template: string | null;
  audience_id: string | null;
  schedule_at: string | null;
  enabled: boolean;
  sent_count: number;
  total_count: number;
  created_at: string;
};

export type CreateCampaignInput = {
  name: string;
  message: string;
  page_id?: string;
  audience_filter?: Record<string, string>;
  schedule_at?: string | null;
};

export const campaignsApi = {
  list: () => api.get<Campaign[]>("/campaigns"),
  create: (input: CreateCampaignInput) =>
    api.post<Campaign>("/campaigns", input),
  toggle: (id: string, enabled: boolean) =>
    api.post<Campaign>(`/campaigns/${id}/toggle`, { enabled }),
  send: (id: string) =>
    api.post<{ sent: number; skipped: number; failed: number }>(
      `/campaigns/${id}/send`
    ),
  remove: (id: string) => api.delete<void>(`/campaigns/${id}`),
};
