import { api } from "@/lib/api";

export type Campaign = {
  id: string;
  name: string;
  status: string;
  message_template: string | null;
  audience_id: string | null;
  created_at: string;
};

export type CreateCampaignInput = {
  name: string;
  message: string;
  page_id?: string;
  audience_filter?: string;
};

export const campaignsApi = {
  list: () => api.get<Campaign[]>("/campaigns"),
  create: (input: CreateCampaignInput) =>
    api.post<Campaign>("/campaigns", input),
  remove: (id: string) => api.delete<void>(`/campaigns/${id}`),
};
