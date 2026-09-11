import { api } from "@/lib/api";

export type Conversation = {
  id: string;
  page_id: string;
  contact_id: string;
  status: string;
  assigned_to: string | null;
  subject: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender_type: string;
  type: string;
  body: string | null;
  meta_message_id: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  psid: string;
  name: string | null;
  profile_url: string | null;
  lead_status: string;
  lead_score: number;
  product_interests: string[] | null;
  last_interaction_at: string | null;
  created_at: string;
};

export const messagingApi = {
  listConversations: (params?: { status?: string; search?: string }) =>
    api.get<Conversation[]>(`/conversations${buildQuery(params)}`),
  listMessages: (conversationId: string) =>
    api.get<Message[]>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string) =>
    api.post<Message>(`/conversations/${conversationId}/messages`, { text }),
  listContacts: (params?: { search?: string; lead_status?: string }) =>
    api.get<Contact[]>(`/contacts${buildQuery(params)}`),
  getContact: (contactId: string) => api.get<Contact>(`/contacts/${contactId}`),
  updateContact: (contactId: string, body: Partial<Contact>) =>
    api.patch<Contact>(`/contacts/${contactId}`, body),
};

export const analyticsApi = {
  dashboard: () =>
    api.get<{
      connected_pages: number;
      contacts: number;
      conversations: number;
      unread_conversations: number;
      messages: number;
      campaigns: number;
      new_leads: number;
    }>("/analytics/dashboard"),
};

function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}
