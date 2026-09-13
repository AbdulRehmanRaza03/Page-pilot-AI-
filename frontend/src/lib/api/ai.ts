import { api } from "@/lib/api";

export type ChatReply = {
  reply: string;
};

export type AIChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const aiApi = {
  chat: (message: string, history: AIChatMessage[] = []) =>
    api.post<ChatReply>("/ai/chat", { message, history }),
};
