import { api } from "@/lib/api";

export type ChatReply = {
  reply: string;
  tool?: string | null;
  data?: any | null;
};

export type AIChatMessage = {
  role: "user" | "assistant";
  content: string;
  tool?: string | null;
  data?: any | null;
};

export const aiApi = {
  chat: (message: string, history: AIChatMessage[] = []) =>
    api.post<ChatReply>("/ai/chat", { message, history }),
};
