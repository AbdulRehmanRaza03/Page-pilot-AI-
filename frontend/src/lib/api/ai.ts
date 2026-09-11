import { api } from "@/lib/api";

export type ChatReply = {
  reply: string;
};

export const aiApi = {
  chat: (message: string) =>
    api.post<ChatReply>("/ai/chat", { message }),
};
