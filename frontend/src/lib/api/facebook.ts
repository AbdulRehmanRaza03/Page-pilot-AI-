import { api } from "@/lib/api";
import type { Workspace } from "@/types";

export type FacebookPage = {
  id: string;
  page_id: string;
  name: string;
  category: string | null;
  picture_url: string | null;
  status: string;
  disconnected_at: string | null;
};

export const facebookApi = {
  oauthStart: () =>
    api.get<{ url: string; state: string; redirect_uri: string }>("/facebook/oauth/start"),
  listPages: () => api.get<FacebookPage[]>("/facebook/pages"),
  availablePages: () =>
    api.get<{ pages: { page_id: string; name: string; category: string | null; tasks: string[] | null }[] }>(
      "/facebook/available-pages"
    ),
  connectPage: (pageId: string) => api.post<FacebookPage>("/facebook/pages", { page_id: pageId }),
  disconnectPage: (pageId: string) => api.delete<FacebookPage>(`/facebook/pages/${pageId}`),
};
